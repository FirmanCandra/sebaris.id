<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateVoteRequest;
use App\Http\Resources\VoteResource;
use App\Mail\VoteConfirmationMail;
use App\Models\Category;
use App\Models\Finalist;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
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
            $message = $request->string('message')->trim()->toString() ?: null;
            $isAnonymous = $request->boolean('is_anonymous');

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
                    'message' => $message,
                    'is_anonymous' => $isAnonymous,
                    'vote_amount' => 1,
                    'total_price' => 0,
                    'type' => 'free',
                    'payment_method' => 'free',
                    'status' => 'confirmed',
                    'paid_at' => now(),
                ]);

                $finalist->increment('vote_count', 1);
                Cache::forget("public.finalists.{$category->id}");

                // Send confirmation email if voter_contact is an email address
                if (filter_var($contact, FILTER_VALIDATE_EMAIL)) {
                    try {
                        Mail::to($contact)->later(now()->addSeconds(3), new VoteConfirmationMail($vote->load('finalist.category')));
                    } catch (\Throwable) {
                        // Non-blocking: email failure must not fail the vote
                    }
                }

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
                'message' => $message,
                'is_anonymous' => $isAnonymous,
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

        // Send confirmation email after payment confirmed
        $freshVote = $vote->fresh(['finalist.category']);
        $contact = $freshVote->voter_contact ?? '';
        if (filter_var($contact, FILTER_VALIDATE_EMAIL)) {
            try {
                Mail::to($contact)->later(now()->addSeconds(3), new VoteConfirmationMail($freshVote));
            } catch (\Throwable) {
                // Non-blocking
            }
        }

        return response()->json([
            'message' => 'Pembayaran berhasil dikonfirmasi! Suara telah ditambahkan.',
            'data' => new VoteResource($freshVote),
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

    // ─── Export kategori ke multi-sheet XLSX ─────────────────────────────────────
    private const CAT_CLR_BG     = '1A2E0A';
    private const CAT_CLR_BRAND  = '70B325';
    private const CAT_CLR_DARK   = '4A7A18';
    private const CAT_CLR_ROW    = 'F6FDEF';
    private const CAT_CLR_BORDER = 'C7E6A8';
    private const CAT_CLR_MINT   = 'F0FDF4';
    private const CAT_CLR_AMBER  = 'FEF9EE';

    private function catApplyHeader($sheet, string $range, string $bg, string $fg, int $size = 10): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'font'      => ['bold' => true, 'size' => $size, 'color' => ['rgb' => $fg]],
            'fill'      => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders'   => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => self::CAT_CLR_BORDER]]],
        ]);
    }

    private function catApplyBorder($sheet, int $row, int $cols): void
    {
        $lastCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($cols);
        $sheet->getStyle("A{$row}:{$lastCol}{$row}")->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => self::CAT_CLR_BORDER]]],
        ]);
    }

    public function exportXlsx(int $categoryId): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $category  = Category::query()->with('finalists')->findOrFail($categoryId);
        $finalists = $category->finalists()->orderByDesc('vote_count')->get();
        $votes     = Vote::query()
            ->whereIn('finalist_id', $finalists->pluck('id'))
            ->where('status', 'confirmed')
            ->with('finalist')
            ->latest()
            ->get();

        $totalVotes       = (int) $votes->sum('vote_amount');
        $totalRevenue     = (int) $votes->where('type', 'paid')->sum('total_price');
        $paidVotes        = (int) $votes->where('type', 'paid')->sum('vote_amount');
        $freeVotes        = (int) $votes->where('type', 'free')->sum('vote_amount');
        $totalTx          = $votes->count();
        $paidTx           = $votes->where('type', 'paid')->count();
        $freeTx           = $votes->where('type', 'free')->count();

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $spreadsheet->getProperties()
            ->setCreator('Sebaris.id')
            ->setTitle('Laporan Kategori ' . $category->name)
            ->setSubject('Rekap E-Voting Kategori — Sebaris.id');

        // ── SHEET 1: Ringkasan Kategori ──────────────────────────────────────
        $s1 = $spreadsheet->getActiveSheet();
        $s1->setTitle('Ringkasan Kategori');
        $s1->getColumnDimension('A')->setWidth(36);
        $s1->getColumnDimension('B')->setWidth(32);

        $s1->mergeCells('A1:B1');
        $s1->setCellValue('A1', 'LAPORAN RESMI E-VOTING SEBARIS.ID');
        $this->catApplyHeader($s1, 'A1:B1', self::CAT_CLR_BG, 'FFFFFF', 13);
        $s1->getRowDimension(1)->setRowHeight(28);

        $s1->mergeCells('A2:B2');
        $s1->setCellValue('A2', $category->name);
        $this->catApplyHeader($s1, 'A2:B2', self::CAT_CLR_BRAND, 'FFFFFF', 12);
        $s1->getRowDimension(2)->setRowHeight(22);

        $infoRows = [
            ['Penyelenggara',            $category->organizer ?? '-'],
            ['Periode Voting',           ($category->start_date?->toDateString() ?? '-') . ' s/d ' . ($category->end_date?->toDateString() ?? '-')],
            ['Status Pembekuan (Freeze)', $category->freeze_leaderboard ? 'DIBEKUKAN' : 'TIDAK DIBEKUKAN'],
            ['Total Finalis',            $finalists->count() . ' Kandidat'],
            ['Tanggal Cetak',            now()->format('d/m/Y H:i:s') . ' WIB'],
        ];

        $r = 4;
        foreach ($infoRows as $i => [$label, $value]) {
            $bg = $i % 2 === 0 ? 'FFFFFF' : self::CAT_CLR_ROW;
            $s1->setCellValue("A{$r}", $label);
            $s1->setCellValue("B{$r}", $value);
            $s1->getStyle("A{$r}")->applyFromArray([
                'font'      => ['bold' => true, 'size' => 10, 'color' => ['rgb' => self::CAT_CLR_DARK]],
                'fill'      => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
                'borders'   => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => self::CAT_CLR_BORDER]]],
            ]);
            $s1->getStyle("B{$r}")->applyFromArray([
                'font'  => ['size' => 10],
                'fill'  => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
                'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => self::CAT_CLR_BORDER]]],
            ]);
            $r++;
        }

        $r++;
        $s1->mergeCells("A{$r}:B{$r}");
        $s1->setCellValue("A{$r}", 'RINGKASAN METRIK VOTING');
        $this->catApplyHeader($s1, "A{$r}:B{$r}", self::CAT_CLR_DARK, 'FFFFFF');
        $r++;

        $metricRows = [
            ['Total Suara Sah Masuk',      number_format($totalVotes, 0, ',', '.') . ' Suara'],
            ['Total Revenue / Pendapatan', 'Rp ' . number_format($totalRevenue, 0, ',', '.')],
            ['Total Transaksi Sukses',     number_format($totalTx, 0, ',', '.') . ' Transaksi'],
            ['Suara Berbayar',             number_format($paidVotes, 0, ',', '.') . ' Suara'],
            ['Suara Gratis (1×Vote)',      number_format($freeVotes, 0, ',', '.') . ' Suara'],
            ['Transaksi Berbayar',         number_format($paidTx, 0, ',', '.') . ' Transaksi'],
            ['Transaksi Gratis',           number_format($freeTx, 0, ',', '.') . ' Transaksi'],
        ];

        foreach ($metricRows as $i => [$label, $value]) {
            $bg = $i % 2 === 0 ? self::CAT_CLR_MINT : 'FFFFFF';
            $s1->setCellValue("A{$r}", $label);
            $s1->setCellValue("B{$r}", $value);
            $s1->getStyle("A{$r}:B{$r}")->applyFromArray([
                'font'    => ['size' => 10, 'bold' => ($i < 3)],
                'fill'    => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
                'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => self::CAT_CLR_BORDER]]],
            ]);
            $r++;
        }

        // ── SHEET 2: Leaderboard Finalis ─────────────────────────────────────
        $s2 = $spreadsheet->createSheet();
        $s2->setTitle('Leaderboard Finalis');

        foreach ([5, 38, 14, 16, 48] as $i => $w) {
            $s2->getColumnDimensionByColumn($i + 1)->setWidth($w);
        }

        $s2->mergeCells('A1:E1');
        $s2->setCellValue('A1', 'REKAP PEROLEHAN SUARA — ' . strtoupper($category->name));
        $this->catApplyHeader($s2, 'A1:E1', self::CAT_CLR_BG, 'FFFFFF', 12);
        $s2->getRowDimension(1)->setRowHeight(24);

        $s2Headers = ['Rank', 'Nama Finalis', 'Total Suara', 'Porsi (%)', 'Biodata / Deskripsi'];
        $col = 1;
        foreach ($s2Headers as $h) {
            $s2->setCellValue([$col++, 2], $h);
        }
        $this->catApplyHeader($s2, 'A2:E2', self::CAT_CLR_BG, 'FFFFFF');
        $s2->getRowDimension(2)->setRowHeight(26);

        $catTotal = $finalists->sum('vote_count') ?: 1;
        $r2 = 3;
        foreach ($finalists as $fIdx => $finalist) {
            $pct = round(($finalist->vote_count / $catTotal) * 100, 2);

            $s2->setCellValue([1, $r2], $fIdx + 1);
            $s2->setCellValue([2, $r2], $finalist->name);
            $s2->setCellValue([3, $r2], $finalist->vote_count);
            $s2->setCellValue([4, $r2], $pct / 100);
            $s2->setCellValue([5, $r2], $finalist->description ?? '-');

            $s2->getStyle([3, $r2])->getNumberFormat()->setFormatCode('#,##0');
            $s2->getStyle([4, $r2])->getNumberFormat()->setFormatCode('0.00%');
            $s2->getStyle([5, $r2])->getAlignment()->setWrapText(true);

            if ($fIdx === 0) {
                $s2->getStyle("A{$r2}:E{$r2}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => '7A3F00']],
                    'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FEF9C3']],
                ]);
            } elseif ($fIdx % 2 !== 0) {
                $s2->getStyle("A{$r2}:E{$r2}")->getFill()
                    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setRGB(self::CAT_CLR_ROW);
            }

            $this->catApplyBorder($s2, $r2, 5);
            $s2->getStyle([1, $r2])->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            $r2++;
        }
        $s2->freezePane('A3');

        // ── SHEET 3: Log Transaksi ────────────────────────────────────────────
        $s3 = $spreadsheet->createSheet();
        $s3->setTitle('Log Transaksi');

        foreach ([24, 20, 34, 28, 28, 12, 12, 20, 16, 14] as $i => $w) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1);
            $s3->getColumnDimension($colLetter)->setWidth($w);
        }

        $s3->mergeCells('A1:J1');
        $s3->setCellValue('A1', 'DETAIL AUDIT LOG TRANSAKSI & SUARA MASUK — ' . strtoupper($category->name));
        $this->catApplyHeader($s3, 'A1:J1', self::CAT_CLR_BG, 'FFFFFF', 12);
        $s3->getRowDimension(1)->setRowHeight(24);

        $s3Headers = [
            'ID Referensi', 'Waktu (WIB)', 'Finalis Dipilih',
            'Nama Pemilih', 'Kontak', 'Tipe Vote',
            'Jml Suara', 'Metode Bayar', 'Total Bayar (Rp)', 'Status',
        ];
        $col = 1;
        foreach ($s3Headers as $h) {
            $s3->setCellValue([$col++, 2], $h);
        }
        $this->catApplyHeader($s3, 'A2:J2', self::CAT_CLR_BG, 'FFFFFF');
        $s3->getRowDimension(2)->setRowHeight(26);

        $r3 = 3;
        foreach ($votes as $i => $vote) {
            $isPaid = $vote->type !== 'free';

            $s3->setCellValue([1, $r3], $vote->reference_id ?? 'SVT-' . $vote->id);
            $s3->setCellValue([2, $r3], $vote->created_at?->format('d/m/Y H:i:s') ?? '-');
            $s3->setCellValue([3, $r3], $vote->finalist?->name ?? '-');
            $s3->setCellValue([4, $r3], $vote->voter_name ?? '-');
            $s3->setCellValue([5, $r3], $vote->voter_contact ?? '-');
            $s3->setCellValue([6, $r3], $isPaid ? 'Berbayar' : 'Gratis (1×)');
            $s3->setCellValue([7, $r3], $vote->vote_amount);
            $s3->setCellValue([8, $r3], strtoupper($vote->payment_method ?? 'FREE'));
            $s3->setCellValue([9, $r3], $vote->total_price);
            $s3->setCellValue([10, $r3], strtoupper($vote->status ?? 'CONFIRMED'));

            $s3->getStyle([7, $r3])->getNumberFormat()->setFormatCode('#,##0');
            $s3->getStyle([9, $r3])->getNumberFormat()->setFormatCode('"Rp "#,##0');

            if ($i % 2 !== 0) {
                $s3->getStyle("A{$r3}:J{$r3}")->getFill()
                    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setRGB($isPaid ? self::CAT_CLR_AMBER : self::CAT_CLR_MINT);
            }

            $this->catApplyBorder($s3, $r3, 10);

            $s3->getStyle([6, $r3])->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
            $s3->getStyle([7, $r3])->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
            $s3->getStyle([10, $r3])->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            $r3++;
        }

        $lastRow3 = $r3 - 1;
        if ($lastRow3 >= 3) {
            $s3->setAutoFilter("A2:J{$lastRow3}");
        }
        $s3->freezePane('A3');

        // ── Deliver ──────────────────────────────────────────────────────────
        $spreadsheet->setActiveSheetIndex(0);

        $filename = 'Laporan_Kategori_' . Str::slug($category->name) . '_' . date('Ymd_His') . '.xlsx';

        $headers = [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control'       => 'max-age=0, no-cache, no-store',
            'Pragma'              => 'no-cache',
            'Expires'             => '0',
        ];

        $callback = function () use ($spreadsheet) {
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $writer->setPreCalculateFormulas(true);
            $writer->save('php://output');
            $spreadsheet->disconnectWorksheets();
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Get Wall of Support messages for a category or specific finalist.
     * GET /categories/{category}/messages
     */
    public function messages(Request $request, string $category): JsonResponse
    {
        $cat = Category::query()
            ->where(function ($query) use ($category) {
                if (is_numeric($category)) {
                    $query->where('id', (int) $category);
                } else {
                    $query->where('slug', $category);
                }
            })
            ->firstOrFail();

        $query = Vote::query()
            ->with('finalist:id,name,photo')
            ->whereHas('finalist', fn ($q) => $q->where('category_id', $cat->id))
            ->where('status', 'confirmed')
            ->whereNotNull('message')
            ->where('message', '!=', '')
            ->latest('paid_at');

        if ($request->filled('finalist_id')) {
            $query->where('finalist_id', $request->integer('finalist_id'));
        }

        $messages = $query->limit(50)->get()->map(function ($vote) {
            return [
                'id' => $vote->id,
                'voter_name' => $vote->is_anonymous ? 'Pendukung Anonim' : $vote->voter_name,
                'is_anonymous' => (bool) $vote->is_anonymous,
                'message' => $vote->message,
                'vote_amount' => $vote->vote_amount,
                'finalist_id' => $vote->finalist_id,
                'finalist_name' => $vote->finalist?->name,
                'created_at' => $vote->paid_at?->toISOString() ?? $vote->created_at->toISOString(),
                'time_ago' => $vote->paid_at?->diffForHumans() ?? $vote->created_at->diffForHumans(),
            ];
        });

        return response()->json([
            'data' => $messages,
            'count' => $messages->count(),
        ]);
    }

    /**
     * Get recent confirmed votes for Live Vote Ticker (FOMO notification)
     * GET /api/votes/recent
     */
    /**
     * Get recent confirmed votes for Live Vote Ticker (FOMO notification)
     * Strictly filters by category or event if specified in query params.
     * GET /api/votes/recent?category=...&event=...
     */
    public function recent(Request $request): JsonResponse
    {
        $categoryParam = trim($request->query('category', ''));
        if (empty($categoryParam)) {
            return response()->json(['data' => []]);
        }

        $targetCategory = Category::where(function ($q) use ($categoryParam) {
            if (is_numeric($categoryParam)) {
                $q->where('id', (int) $categoryParam);
            } else {
                $q->where('slug', $categoryParam);
            }
        })->first();

        if (!$targetCategory) {
            return response()->json(['data' => []]);
        }

        $votes = Vote::query()
            ->with(['finalist:id,name,photo,category_id', 'finalist.category:id,name,slug'])
            ->where('status', 'confirmed')
            ->whereHas('finalist', fn ($q) => $q->where('category_id', $targetCategory->id))
            ->latest('paid_at')
            ->limit(20)
            ->get();

        $items = $votes->map(function ($vote) {
            $name = 'Seseorang';
            if (!$vote->is_anonymous && !empty($vote->voter_name)) {
                $parts = explode(' ', trim($vote->voter_name));
                $name = $parts[0];
            }

            return [
                'id' => $vote->id,
                'voter_display' => $name,
                'vote_amount' => $vote->vote_amount ?? 1,
                'finalist_name' => $vote->finalist?->name ?? 'Kandidat',
                'finalist_photo' => $vote->finalist?->photo,
                'category_name' => $vote->finalist?->category?->name ?? 'Kategori Voting',
                'category_slug' => $vote->finalist?->category?->slug,
                'time_ago' => $vote->paid_at ? $vote->paid_at->diffForHumans() : ($vote->created_at ? $vote->created_at->diffForHumans() : 'baru saja'),
            ];
        })->values();

        // Jika data vote riil kategori ini belum banyak, buatkan aktivitas dinamis khusus dari finalis kategori ini saja
        if ($items->count() < 4) {
            $sampleFinalistsQuery = Finalist::with('category:id,name,slug');

            if ($targetCategory) {
                // HANYA ambil finalis dari kategori ini (tidak boleh ada kategori/event lain masuk)
                $sampleFinalistsQuery->where('category_id', $targetCategory->id);
            } else {
                $sampleFinalistsQuery->whereHas('category', fn ($q) => $q->where('status', 'active'));
            }

            $sampleFinalists = $sampleFinalistsQuery->inRandomOrder()->limit(6)->get();

            if ($sampleFinalists->isNotEmpty()) {
                $sampleNames = ['Seseorang', 'Dimas', 'Nabila', 'Rian', 'Putri', 'Fajar', 'Siti', 'Bagus', 'Alya', 'Reza'];
                $sampleAmounts = [1, 2, 5, 10, 15, 20];
                $sampleTimes = ['baru saja', '1 menit lalu', '2 menit lalu', '4 menit lalu', '7 menit lalu'];

                foreach ($sampleFinalists as $idx => $finalist) {
                    $items->push([
                        'id' => 'ticker-' . ($idx + 1),
                        'voter_display' => $sampleNames[array_rand($sampleNames)],
                        'vote_amount' => $sampleAmounts[array_rand($sampleAmounts)],
                        'finalist_name' => $finalist->name,
                        'finalist_photo' => $finalist->photo,
                        'category_name' => $finalist->category?->name ?? ($targetCategory->name ?? 'Voting Terbuka'),
                        'category_slug' => $finalist->category?->slug ?? ($targetCategory->slug ?? null),
                        'time_ago' => $sampleTimes[$idx % count($sampleTimes)],
                    ]);
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $items,
        ]);
    }
}
