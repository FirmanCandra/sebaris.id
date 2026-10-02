<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\EventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Services\ImageOptimizer;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use App\Models\Vote;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EventController extends Controller
{
    private function ensureThumbnailColumnExists(): void
    {
        if (!Schema::hasColumn('events', 'thumbnail')) {
            try {
                Schema::table('events', function ($table) {
                    $table->string('thumbnail')->nullable()->after('name');
                });
            } catch (\Throwable) {
                // Column might have been added concurrently
            }

            try {
                $categories = DB::table('categories')
                    ->whereNotNull('thumbnail')
                    ->whereNotNull('event_id')
                    ->get();

                foreach ($categories as $cat) {
                    DB::table('events')
                        ->where('id', $cat->event_id)
                        ->whereNull('thumbnail')
                        ->update(['thumbnail' => $cat->thumbnail]);
                }
            } catch (\Throwable) {
                // Silently ignore backfill errors
            }
        }

        if (!Schema::hasColumn('events', 'theme_color')) {
            try {
                Schema::table('events', function ($table) {
                    $table->string('theme_color', 50)->nullable()->after('status');
                });
            } catch (\Throwable) {
            }
        }
    }

    public function index(): AnonymousResourceCollection
    {
        $this->ensureThumbnailColumnExists();

        return EventResource::collection(
            Event::query()
                ->withCount('categories')
                ->with(['categories' => function ($q) {
                    $q->ordered();
                }])
                ->latest()
                ->get()
        );
    }

    public function store(EventRequest $request): EventResource
    {
        $this->ensureThumbnailColumnExists();

        $data = $request->safe()->except('thumbnail');
        if (empty($data['status'])) {
            $data['status'] = 'active';
        }

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = ImageOptimizer::storeOptimized($request->file('thumbnail'), 'events', 1000, 78);
        }

        $event = Event::create($data);

        return new EventResource($event->load(['categories']));
    }

    public function show(Event $event): EventResource
    {
        $this->ensureThumbnailColumnExists();

        return new EventResource(
            $event->load([
                'categories' => function ($q) {
                    $q->ordered()->withCount('finalists');
                },
            ])->loadCount('categories')
        );
    }

    public function update(EventRequest $request, Event $event): EventResource
    {
        $this->ensureThumbnailColumnExists();

        $data = $request->safe()->except('thumbnail');

        if ($request->hasFile('thumbnail')) {
            if ($event->thumbnail) {
                Storage::disk('public')->delete($event->thumbnail);
            }
            $data['thumbnail'] = ImageOptimizer::storeOptimized($request->file('thumbnail'), 'events', 1000, 78);
        }

        $event->update($data);

        return new EventResource($event->fresh()->loadCount('categories')->load(['categories']));
    }

    public function destroy(Event $event): Response
    {
        if ($event->thumbnail) {
            Storage::disk('public')->delete($event->thumbnail);
        }

        $event->delete();

        return response()->noContent();
    }

    public function exportCsv(Event $event): StreamedResponse
    {
        $this->ensureThumbnailColumnExists();

        $categories = $event->categories()
            ->with(['finalists' => fn ($q) => $q->orderByDesc('vote_count')])
            ->get();

        $categoryIds = $categories->pluck('id');
        $finalistIds = $categories->flatMap(fn ($c) => $c->finalists->pluck('id'));

        $votes = Vote::query()
            ->whereIn('finalist_id', $finalistIds)
            ->where('status', 'confirmed')
            ->with(['finalist.category', 'user'])
            ->latest()
            ->get();

        $totalVotes = (int) $votes->sum('vote_amount');
        $totalRevenue = (int) $votes->where('type', 'paid')->sum('total_price');
        $totalTransactions = $votes->count();
        $paidVotes = (int) $votes->where('type', 'paid')->sum('vote_amount');
        $freeVotes = (int) $votes->where('type', 'free')->sum('vote_amount');
        $paidTransactions = $votes->where('type', 'paid')->count();
        $freeTransactions = $votes->where('type', 'free')->count();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="Laporan_Event_' . Str::slug($event->name) . '_' . date('Ymd_His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use (
            $event,
            $categories,
            $finalistIds,
            $votes,
            $totalVotes,
            $totalRevenue,
            $totalTransactions,
            $paidVotes,
            $freeVotes,
            $paidTransactions,
            $freeTransactions
        ) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for clean Microsoft Excel rendering
            fputs($handle, "\xEF\xBB\xBF");

            // 1. HEADER RINGKASAN EVENT
            fputcsv($handle, ['LAPORAN RESMI & REKAPITULASI EVENT E-VOTING SEBARIS.ID']);
            fputcsv($handle, ['Nama Event / Ajang', $event->name]);
            fputcsv($handle, ['Periode Event', ($event->start_date?->format('d/m/Y') ?? '-') . ' s/d ' . ($event->end_date?->format('d/m/Y') ?? '-')]);
            fputcsv($handle, ['Status Event', strtoupper($event->status ?? 'ACTIVE')]);
            fputcsv($handle, ['Tanggal & Waktu Unduh', date('d/m/Y H:i:s') . ' WIB']);
            fputcsv($handle, []);

            // 2. METRIK & FINANSIAL SUMMARY
            fputcsv($handle, ['RINGKASAN METRIK & FINANSIAL EVENT']);
            fputcsv($handle, ['Total Suara Sah Terverifikasi', number_format($totalVotes, 0, ',', '.') . ' Suara']);
            fputcsv($handle, ['Total Pendapatan / Revenue (Gross)', 'Rp ' . number_format($totalRevenue, 0, ',', '.')]);
            fputcsv($handle, ['Total Transaksi Sukses', number_format($totalTransactions, 0, ',', '.') . ' Transaksi']);
            fputcsv($handle, ['Suara Berbayar', number_format($paidVotes, 0, ',', '.') . ' Suara']);
            fputcsv($handle, ['Suara Gratis (1x Vote)', number_format($freeVotes, 0, ',', '.') . ' Suara']);
            fputcsv($handle, ['Transaksi Berbayar', number_format($paidTransactions, 0, ',', '.') . ' Transaksi']);
            fputcsv($handle, ['Transaksi Gratis', number_format($freeTransactions, 0, ',', '.') . ' Transaksi']);
            fputcsv($handle, ['Total Kategori Terdaftar', $categories->count() . ' Kategori']);
            fputcsv($handle, ['Total Finalis Terdaftar', $finalistIds->count() . ' Kandidat']);
            fputcsv($handle, []);

            // 3. REKAP PER KATEGORI
            fputcsv($handle, ['REKAP PERFORMA PER KATEGORI VOTING']);
            fputcsv($handle, [
                'No',
                'Nama Kategori / Sesi',
                'Tingkatan (Tier)',
                'Penyelenggara',
                'Tarif per Suara',
                'Fitur 1x Vote Gratis',
                'Jumlah Finalis',
                'Total Suara Sah',
                'Suara Berbayar',
                'Suara Gratis',
                'Total Revenue (Rp)',
                'Status Sesi',
            ]);

            foreach ($categories as $idx => $cat) {
                $catVotes = $votes->filter(fn ($v) => $v->finalist?->category_id === $cat->id);
                $catTotalVotes = (int) $catVotes->sum('vote_amount');
                $catRevenue = (int) $catVotes->where('type', 'paid')->sum('total_price');
                $catPaidVotes = (int) $catVotes->where('type', 'paid')->sum('vote_amount');
                $catFreeVotes = (int) $catVotes->where('type', 'free')->sum('vote_amount');

                fputcsv($handle, [
                    $idx + 1,
                    $cat->name,
                    strtoupper($cat->tier ?? 'PREMIER'),
                    $cat->organizer ?? '-',
                    'Rp ' . number_format($cat->price_per_vote ?? 1000, 0, ',', '.'),
                    $cat->allow_free_vote ? 'Tersedia (Aktif)' : 'Tidak Tersedia (Pure Paid)',
                    $cat->finalists->count(),
                    $catTotalVotes,
                    $catPaidVotes,
                    $catFreeVotes,
                    $catRevenue,
                    strtoupper($cat->status ?? 'ACTIVE'),
                ]);
            }
            fputcsv($handle, []);

            // 4. REKAP PEROLEHAN SUARA FINALIS
            fputcsv($handle, ['REKAP PEROLEHAN SUARA FINALIS (SELURUH KATEGORI)']);
            fputcsv($handle, [
                'Kategori',
                'Tingkatan',
                'Peringkat',
                'Nama Finalis',
                'Total Suara',
                'Porsi Suara (%)',
                'Biodata / Deskripsi',
            ]);

            foreach ($categories as $cat) {
                $catTotal = $cat->finalists->sum('vote_count') ?: 1;
                foreach ($cat->finalists as $fIdx => $finalist) {
                    $pct = round(($finalist->vote_count / $catTotal) * 100, 2);
                    fputcsv($handle, [
                        $cat->name,
                        strtoupper($cat->tier ?? 'PREMIER'),
                        $fIdx + 1,
                        $finalist->name,
                        $finalist->vote_count,
                        $pct . '%',
                        $finalist->description ?? $finalist->bio ?? '-',
                    ]);
                }
            }
            fputcsv($handle, []);

            // 5. DETAIL LOG TRANSAKSI & SUARA MASUK
            fputcsv($handle, ['DETAIL AUDIT TRANSAKSI & SUARA MASUK']);
            fputcsv($handle, [
                'ID Referensi / Invoice',
                'Waktu Transaksi (WIB)',
                'Kategori',
                'Finalis Dipilih',
                'Nama Pemilih',
                'Kontak (WA/Email)',
                'Tipe Vote',
                'Jumlah Suara',
                'Metode Pembayaran',
                'Total Bayar (Rp)',
                'Status Transaksi',
            ]);

            foreach ($votes as $vote) {
                fputcsv($handle, [
                    $vote->reference_id ?? 'SVT-' . $vote->id,
                    $vote->created_at?->format('d/m/Y H:i:s') ?? '-',
                    $vote->finalist?->category?->name ?? '-',
                    $vote->finalist?->name ?? '-',
                    $vote->is_anonymous ? 'Anonim (' . ($vote->user?->name ?? $vote->voter_name) . ')' : ($vote->user?->name ?? $vote->voter_name),
                    $vote->voter_contact ?? '-',
                    $vote->type === 'free' ? 'Gratis (1x)' : 'Berbayar',
                    $vote->vote_amount,
                    strtoupper($vote->payment_method ?? 'FREE'),
                    $vote->total_price,
                    strtoupper($vote->status ?? 'CONFIRMED'),
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
