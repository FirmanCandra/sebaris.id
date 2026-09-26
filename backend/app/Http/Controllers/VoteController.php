<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateVoteRequest;
use App\Http\Resources\VoteResource;
use App\Models\Category;
use App\Models\Finalist;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VoteController extends Controller
{
    public function store(CreateVoteRequest $request): JsonResponse
    {
        $type = $request->string('type')->toString();

        $result = DB::transaction(function () use ($request, $type) {
            $requestedFinalist = Finalist::query()
                ->with('category')
                ->findOrFail($request->integer('finalist_id'));

            $category = Category::query()
                ->lockForUpdate()
                ->findOrFail($requestedFinalist->category_id);

            $finalist = Finalist::query()
                ->lockForUpdate()
                ->findOrFail($requestedFinalist->id);

            if (($category->status ?? 'active') !== 'active') {
                throw ValidationException::withMessages([
                    'finalist_id' => 'Sesi voting untuk kategori ini sedang tidak aktif.',
                ]);
            }

            // Check if end_date has passed
            if ($category->end_date && now()->startOfDay()->gt($category->end_date->endOfDay())) {
                throw ValidationException::withMessages([
                    'finalist_id' => 'Batas waktu voting untuk kategori ini telah resmi berakhir.',
                ]);
            }

            $user = auth('sanctum')->user();
            $contact = $request->string('voter_contact')->trim()->lower()->toString();
            $voterName = $request->string('voter_name')->trim()->toString();

            if ($type === 'free') {
                if (!($category->allow_free_vote ?? true)) {
                    throw ValidationException::withMessages([
                        'type' => 'Voting gratis tidak tersedia untuk ajang ini. Silakan pilih paket berbayar.',
                    ]);
                }

                if ($user) {
                    $alreadyVotedUser = Vote::query()
                        ->where('user_id', $user->id)
                        ->where('type', 'free')
                        ->where('status', 'confirmed')
                        ->whereHas('finalist', fn ($q) => $q->where('category_id', $category->id))
                        ->exists();

                    if ($alreadyVotedUser) {
                        throw ValidationException::withMessages([
                            'voter_contact' => 'Akun Google ini sudah pernah menggunakan vote gratis di kategori ini.',
                        ]);
                    }
                }

                $alreadyVotedContact = Vote::query()
                    ->where('voter_contact', $contact)
                    ->where('type', 'free')
                    ->where('status', 'confirmed')
                    ->whereHas('finalist', fn ($q) => $q->where('category_id', $category->id))
                    ->exists();

                if ($alreadyVotedContact) {
                    throw ValidationException::withMessages([
                        'voter_contact' => 'Kontak ini sudah pernah memakai vote gratis di kategori ini.',
                    ]);
                }

                $referenceId = 'SVT-FREE-' . strtoupper(Str::random(6));

                $vote = Vote::create([
                    'reference_id' => $referenceId,
                    'user_id' => $user?->id,
                    'finalist_id' => $finalist->id,
                    'voter_name' => $voterName,
                    'voter_contact' => $contact,
                    'vote_amount' => 1,
                    'total_price' => 0,
                    'type' => 'free',
                    'payment_method' => 'free',
                    'status' => 'confirmed',
                    'paid_at' => now(),
                ]);

                $finalist->increment('vote_count', 1);
                Cache::forget("public.finalists.{$category->id}");

                return [
                    'vote' => $vote->load('finalist.category'),
                    'payment' => null,
                ];
            }

            // PAID VOTE FLOW
            $voteAmount = max(1, $request->integer('vote_amount', 1));
            $pricePerVote = $category->price_per_vote ?: 1000;
            $totalPrice = $voteAmount * $pricePerVote;
            $paymentMethod = $request->string('payment_method', 'qris')->toString();
            $referenceId = 'SVT-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            $vote = Vote::create([
                'reference_id' => $referenceId,
                'user_id' => $user?->id,
                'finalist_id' => $finalist->id,
                'voter_name' => $voterName,
                'voter_contact' => $contact,
                'vote_amount' => $voteAmount,
                'total_price' => $totalPrice,
                'type' => 'paid',
                'payment_method' => $paymentMethod,
                'status' => 'pending',
                'paid_at' => null,
            ]);

            // Simulated Gateway Details (QRIS / VA payload)
            $expiresAt = now()->addMinutes(15)->toISOString();
            $vaNumber = null;
            $qrisString = null;

            if (str_contains($paymentMethod, 'va')) {
                $bankCode = match ($paymentMethod) {
                    'bca_va' => '8801',
                    'bri_va' => '8802',
                    'mandiri_va' => '8803',
                    default => '8800',
                };
                $vaNumber = $bankCode . str_pad((string) $vote->id, 8, '0', STR_PAD_LEFT);
            } else {
                $qrisString = "00020101021226680016ID.CO.SEBARIS.WWW01189360091800000000000215" . str_pad((string) $vote->id, 10, '0', STR_PAD_LEFT) . "520458125303360540" . strlen((string) $totalPrice) . $totalPrice . "5802ID5913SEBARIS VOTE6007JAKARTA6304" . strtoupper(Str::random(4));
            }

            return [
                'vote' => $vote->load('finalist.category'),
                'payment' => [
                    'reference_id' => $referenceId,
                    'total_price' => $totalPrice,
                    'vote_amount' => $voteAmount,
                    'payment_method' => $paymentMethod,
                    'va_number' => $vaNumber,
                    'qris_payload' => $qrisString,
                    'expires_at' => $expiresAt,
                ],
            ];
        });

        return response()->json([
            'message' => $type === 'free' ? 'Vote berhasil dicatat!' : 'Pesanan voting berhasil dibuat. Silakan selesaikan pembayaran.',
            'data' => new VoteResource($result['vote']),
            'payment' => $result['payment'],
        ], 201);
    }

    public function simulatePay(string $referenceId): JsonResponse
    {
        $vote = Vote::query()
            ->with(['finalist.category'])
            ->where('reference_id', $referenceId)
            ->firstOrFail();

        if ($vote->status === 'confirmed') {
            return response()->json([
                'message' => 'Pembayaran untuk vote ini sudah berhasil terverifikasi sebelumnya.',
                'data' => new VoteResource($vote),
            ]);
        }

        DB::transaction(function () use ($vote) {
            $vote->update([
                'status' => 'confirmed',
                'paid_at' => now(),
            ]);

            $vote->finalist()->increment('vote_count', $vote->vote_amount);
            Cache::forget("public.finalists.{$vote->finalist->category_id}");
        });

        return response()->json([
            'message' => 'Pembayaran berhasil dikonfirmasi! Suara telah ditambahkan.',
            'data' => new VoteResource($vote->fresh(['finalist.category'])),
        ]);
    }

    public function checkStatus(string $referenceId): JsonResponse
    {
        $vote = Vote::query()
            ->with(['finalist.category'])
            ->where('reference_id', $referenceId)
            ->firstOrFail();

        return response()->json([
            'data' => new VoteResource($vote),
            'is_confirmed' => $vote->status === 'confirmed',
        ]);
    }

    public function checkVotes(Request $request): JsonResponse
    {
        $query = $request->string('query')->trim();
        if (!$query->length()) {
            return response()->json(['data' => []]);
        }

        $votes = Vote::query()
            ->with(['finalist.category'])
            ->where(function ($q) use ($query) {
                $q->where('reference_id', $query->toString())
                    ->orWhere('voter_contact', 'like', "%{$query}%")
                    ->orWhere('voter_name', 'like', "%{$query}%");
            })
            ->latest()
            ->take(15)
            ->get();

        return response()->json([
            'data' => VoteResource::collection($votes),
        ]);
    }

    public function exportCsv(int $categoryId): StreamedResponse
    {
        $category = Category::query()->with('finalists')->findOrFail($categoryId);
        $finalists = $category->finalists()->orderByDesc('vote_count')->get();
        $votes = Vote::query()
            ->whereIn('finalist_id', $finalists->pluck('id'))
            ->where('status', 'confirmed')
            ->with('finalist')
            ->latest()
            ->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="Laporan_Voting_' . Str::slug($category->name) . '_' . date('Ymd_His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($category, $finalists, $votes) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for clean Indonesian Excel display
            fputs($handle, "\xEF\xBB\xBF");

            // Header summary
            fputcsv($handle, ['LAPORAN RESMI HASIL E-VOTING SEBARIS.ID']);
            fputcsv($handle, ['Nama Ajang / Kategori', $category->name]);
            fputcsv($handle, ['Penyelenggara', $category->organizer ?? '-']);
            fputcsv($handle, ['Periode Voting', ($category->start_date?->toDateString() ?? '-') . ' s/d ' . ($category->end_date?->toDateString() ?? '-')]);
            fputcsv($handle, ['Tanggal Unduh', date('d-m-Y H:i:s')]);
            fputcsv($handle, ['Status Pembekuan (Freeze)', $category->freeze_leaderboard ? 'DIBEKUKAN' : 'TIDAK DIBEKUKAN']);
            fputcsv($handle, []);

            // Finalist summary table
            fputcsv($handle, ['REKAP PEROLEHAN SUARA PER FINALIS']);
            fputcsv($handle, ['Peringkat', 'Nama Finalis', 'Deskripsi / Asal', 'Total Suara Sah']);

            $totalVotesAll = $finalists->sum('vote_count') ?: 1;
            foreach ($finalists as $idx => $finalist) {
                fputcsv($handle, [
                    $idx + 1,
                    $finalist->name,
                    $finalist->description ?? '-',
                    $finalist->vote_count,
                ]);
            }

            fputcsv($handle, []);
            fputcsv($handle, ['DETAIL TRANSAKSI & SUARA MASUK']);
            fputcsv($handle, [
                'ID Referensi',
                'Tanggal & Waktu',
                'Nama Pemilih',
                'Kontak',
                'Kandidat Pilihan',
                'Tipe Vote',
                'Jumlah Suara',
                'Metode Pembayaran',
                'Total Nominal (Rp)',
                'Status',
            ]);

            foreach ($votes as $vote) {
                fputcsv($handle, [
                    $vote->reference_id ?? 'SVT-' . $vote->id,
                    $vote->created_at?->format('d-m-Y H:i:s'),
                    $vote->voter_name,
                    $vote->voter_contact,
                    $vote->finalist?->name ?? '-',
                    $vote->type === 'free' ? 'Gratis' : 'Berbayar',
                    $vote->vote_amount,
                    strtoupper($vote->payment_method ?? 'FREE'),
                    $vote->total_price,
                    strtoupper($vote->status),
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
