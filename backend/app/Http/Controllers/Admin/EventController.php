<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\EventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Models\Vote;
use App\Services\ImageOptimizer;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EventController extends Controller
{
    // ─── Shared palette ─────────────────────────────────────────────────────────
    private const CLR_BRAND      = '70B325'; // Sebaris green
    private const CLR_BRAND_DARK = '4A7A18';
    private const CLR_GOLD       = 'F59E0B';
    private const CLR_HEADER_BG  = '1A2E0A'; // deep dark green
    private const CLR_HEADER_FG  = 'FFFFFF';
    private const CLR_SUBHEAD_BG = 'EBF7E3'; // light green tint
    private const CLR_SUBHEAD_FG = '2D5A0E';
    private const CLR_ROW_ALT    = 'F6FDEF'; // very light green row stripe
    private const CLR_BORDER     = 'C7E6A8';
    private const CLR_REVENUE    = 'F0FDF4'; // mint for revenue rows
    private const CLR_PAID       = 'FEF9EE'; // amber tint for paid

    private function applyHeaderStyle($sheet, string $cellRange, string $bg = self::CLR_HEADER_BG, string $fg = self::CLR_HEADER_FG, int $size = 11): void
    {
        $sheet->getStyle($cellRange)->applyFromArray([
            'font'      => ['bold' => true, 'size' => $size, 'color' => ['rgb' => $fg]],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::CLR_BORDER]]],
        ]);
    }

    private function applyColumnHeaders($sheet, int $row, array $headers, string $bg = self::CLR_HEADER_BG, string $fg = self::CLR_HEADER_FG): void
    {
        $col = 1;
        foreach ($headers as $header) {
            $sheet->setCellValue([$col, $row], $header);
            $col++;
        }
        $lastCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($headers));
        $this->applyHeaderStyle($sheet, "A{$row}:{$lastCol}{$row}", $bg, $fg, 10);
    }

    private function applyRowBorder($sheet, int $row, int $colCount): void
    {
        $lastCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colCount);
        $sheet->getStyle("A{$row}:{$lastCol}{$row}")->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::CLR_BORDER]]],
        ]);
    }

    private function applyAlternateRow($sheet, int $row, int $colCount, bool $isOdd): void
    {
        if (!$isOdd) {
            $lastCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colCount);
            $sheet->getStyle("A{$row}:{$lastCol}{$row}")->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB(self::CLR_ROW_ALT);
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // SHEET 1 — Ringkasan Event & Metrik Finansial
    // ────────────────────────────────────────────────────────────────────────────
    private function buildSheet1(
        \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet,
        Event $event,
        $categories,
        $finalistIds,
        int $totalVotes,
        int $totalRevenue,
        int $totalTransactions,
        int $paidVotes,
        int $freeVotes,
        int $paidTransactions,
        int $freeTransactions
    ): void {
        $sheet->setTitle('Ringkasan Event');
        $sheet->getColumnDimension('A')->setWidth(36);
        $sheet->getColumnDimension('B')->setWidth(30);

        // Title block
        $sheet->mergeCells('A1:B1');
        $sheet->setCellValue('A1', 'LAPORAN E-VOTING SEBARIS.ID');
        $this->applyHeaderStyle($sheet, 'A1:B1', self::CLR_HEADER_BG, self::CLR_HEADER_FG, 14);
        $sheet->getRowDimension(1)->setRowHeight(30);

        $sheet->mergeCells('A2:B2');
        $sheet->setCellValue('A2', $event->name);
        $this->applyHeaderStyle($sheet, 'A2:B2', self::CLR_BRAND, self::CLR_HEADER_FG, 12);
        $sheet->getRowDimension(2)->setRowHeight(22);

        // Info rows
        $infoRows = [
            ['Periode Event', ($event->start_date?->format('d/m/Y') ?? '-') . ' s/d ' . ($event->end_date?->format('d/m/Y') ?? '-')],
            ['Status Event', strtoupper($event->status ?? 'ACTIVE')],
            ['Total Kategori', $categories->count() . ' Kategori'],
            ['Total Finalis Terdaftar', $finalistIds->count() . ' Kandidat'],
            ['Tanggal & Waktu Cetak', now()->format('d/m/Y H:i:s') . ' WIB'],
        ];

        $r = 4;
        foreach ($infoRows as $i => [$label, $value]) {
            $sheet->setCellValue("A{$r}", $label);
            $sheet->setCellValue("B{$r}", $value);
            $isOdd = ($i % 2 === 0);
            $bg    = $isOdd ? 'FFFFFF' : self::CLR_ROW_ALT;
            $sheet->getStyle("A{$r}")->applyFromArray([
                'font'      => ['bold' => true, 'size' => 10, 'color' => ['rgb' => self::CLR_BRAND_DARK]],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
                'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::CLR_BORDER]]],
            ]);
            $sheet->getStyle("B{$r}")->applyFromArray([
                'font'      => ['bold' => false, 'size' => 10],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
                'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::CLR_BORDER]]],
            ]);
            $r++;
        }

        // Spacer
        $r++;

        // Metrics section
        $sheet->mergeCells("A{$r}:B{$r}");
        $sheet->setCellValue("A{$r}", 'METRIK & FINANSIAL KESELURUHAN EVENT');
        $this->applyHeaderStyle($sheet, "A{$r}:B{$r}", self::CLR_BRAND_DARK, self::CLR_HEADER_FG, 10);
        $r++;

        $metricRows = [
            ['Total Suara Sah Terverifikasi', number_format($totalVotes, 0, ',', '.') . ' Suara'],
            ['Total Revenue / Pendapatan (Gross)', 'Rp ' . number_format($totalRevenue, 0, ',', '.')],
            ['Total Transaksi Sukses', number_format($totalTransactions, 0, ',', '.') . ' Transaksi'],
            ['Suara Berbayar',   number_format($paidVotes, 0, ',', '.') . ' Suara'],
            ['Suara Gratis (1×Vote)', number_format($freeVotes, 0, ',', '.') . ' Suara'],
            ['Transaksi Berbayar',   number_format($paidTransactions, 0, ',', '.') . ' Transaksi'],
            ['Transaksi Gratis',     number_format($freeTransactions, 0, ',', '.') . ' Transaksi'],
        ];

        foreach ($metricRows as $i => [$label, $value]) {
            $sheet->setCellValue("A{$r}", $label);
            $sheet->setCellValue("B{$r}", $value);
            $bg = ($i % 2 === 0) ? self::CLR_REVENUE : 'FFFFFF';
            $sheet->getStyle("A{$r}:B{$r}")->applyFromArray([
                'font'      => ['size' => 10, 'bold' => ($i < 3)],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
                'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::CLR_BORDER]]],
            ]);
            $r++;
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // SHEET 2 — Rekap Per Kategori
    // ────────────────────────────────────────────────────────────────────────────
    private function buildSheet2(
        \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet,
        $categories,
        $votes
    ): void {
        $sheet->setTitle('Rekap Kategori');

        $widths = [5, 34, 14, 28, 18, 22, 12, 14, 14, 14, 18, 14];
        foreach ($widths as $i => $w) {
            $sheet->getColumnDimensionByColumn($i + 1)->setWidth($w);
        }

        $headers = [
            'No', 'Nama Kategori / Sesi', 'Tingkatan (Tier)', 'Penyelenggara',
            'Tarif per Suara (Rp)', 'Fitur 1×Vote Gratis', 'Jml. Finalis',
            'Total Suara Sah', 'Suara Berbayar', 'Suara Gratis',
            'Revenue (Rp)', 'Status',
        ];

        $sheet->mergeCells('A1:L1');
        $sheet->setCellValue('A1', 'REKAP PERFORMA PER KATEGORI VOTING');
        $this->applyHeaderStyle($sheet, 'A1:L1', self::CLR_HEADER_BG, self::CLR_HEADER_FG, 12);
        $sheet->getRowDimension(1)->setRowHeight(24);

        $this->applyColumnHeaders($sheet, 2, $headers);
        $sheet->getRowDimension(2)->setRowHeight(30);

        $r = 3;
        foreach ($categories as $idx => $cat) {
            $catVotes    = $votes->filter(fn ($v) => $v->finalist?->category_id === $cat->id);
            $catTotal    = (int) $catVotes->sum('vote_amount');
            $catRevenue  = (int) $catVotes->where('type', 'paid')->sum('total_price');
            $catPaid     = (int) $catVotes->where('type', 'paid')->sum('vote_amount');
            $catFree     = (int) $catVotes->where('type', 'free')->sum('vote_amount');

            $sheet->setCellValue([1,  $r], $idx + 1);
            $sheet->setCellValue([2,  $r], $cat->name);
            $sheet->setCellValue([3,  $r], strtoupper($cat->tier ?? 'PREMIER'));
            $sheet->setCellValue([4,  $r], $cat->organizer ?? '-');
            $sheet->setCellValue([5,  $r], $cat->price_per_vote ?? 1000);
            $sheet->setCellValue([6,  $r], $cat->allow_free_vote ? 'Tersedia' : 'Tidak');
            $sheet->setCellValue([7,  $r], $cat->finalists->count());
            $sheet->setCellValue([8,  $r], $catTotal);
            $sheet->setCellValue([9,  $r], $catPaid);
            $sheet->setCellValue([10, $r], $catFree);
            $sheet->setCellValue([11, $r], $catRevenue);
            $sheet->setCellValue([12, $r], strtoupper($cat->status ?? 'ACTIVE'));

            // Number format
            $sheet->getStyle([5, $r])->getNumberFormat()->setFormatCode('#,##0');
            foreach ([8, 9, 10] as $c) {
                $sheet->getStyle([$c, $r])->getNumberFormat()->setFormatCode('#,##0');
            }
            $sheet->getStyle([11, $r])->getNumberFormat()->setFormatCode('"Rp "#,##0');

            $this->applyAlternateRow($sheet, $r, 12, $idx % 2 === 0);
            $this->applyRowBorder($sheet, $r, 12);

            // Alignment
            $sheet->getStyle([1, $r])->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle([3, $r])->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle([6, $r])->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle([12, $r])->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $r++;
        }

        // Totals row
        $lastRow = $r - 1;
        if ($lastRow >= 3) {
            $colLetters = ['H', 'I', 'J', 'K'];
            $colNums    = [8, 9, 10, 11];
            $sheet->setCellValue([2, $r], 'TOTAL');
            foreach ($colNums as $c) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($c);
                $sheet->setCellValue([$c, $r], "=SUM({$colLetter}3:{$colLetter}{$lastRow})");
            }
            $sheet->getStyle("A{$r}:L{$r}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => self::CLR_HEADER_FG]],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::CLR_BRAND]],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => self::CLR_BRAND_DARK]]],
            ]);
            foreach ([8, 9, 10] as $c) {
                $sheet->getStyle([$c, $r])->getNumberFormat()->setFormatCode('#,##0');
            }
            $sheet->getStyle([11, $r])->getNumberFormat()->setFormatCode('"Rp "#,##0');
        }

        $sheet->setAutoFilter("A2:L{$lastRow}");
        $sheet->freezePane('A3');
    }

    // ────────────────────────────────────────────────────────────────────────────
    // SHEET 3 — Rekap Finalis (Leaderboard)
    // ────────────────────────────────────────────────────────────────────────────
    private function buildSheet3(
        \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet,
        $categories
    ): void {
        $sheet->setTitle('Rekap Finalis');

        $widths = [5, 34, 14, 5, 38, 14, 16, 48];
        foreach ($widths as $i => $w) {
            $sheet->getColumnDimensionByColumn($i + 1)->setWidth($w);
        }

        $headers = ['No', 'Kategori', 'Tingkatan', 'Rank', 'Nama Finalis', 'Total Suara', 'Porsi (%)', 'Biodata / Deskripsi'];

        $sheet->mergeCells('A1:H1');
        $sheet->setCellValue('A1', 'REKAP PEROLEHAN SUARA FINALIS — SELURUH KATEGORI');
        $this->applyHeaderStyle($sheet, 'A1:H1', self::CLR_HEADER_BG, self::CLR_HEADER_FG, 12);
        $sheet->getRowDimension(1)->setRowHeight(24);

        $this->applyColumnHeaders($sheet, 2, $headers);
        $sheet->getRowDimension(2)->setRowHeight(28);

        $r   = 3;
        $row = 0;
        foreach ($categories as $cat) {
            $catTotal = $cat->finalists->sum('vote_count') ?: 1;

            foreach ($cat->finalists as $fIdx => $finalist) {
                $pct = round(($finalist->vote_count / $catTotal) * 100, 2);

                $sheet->setCellValue([1, $r], ++$row);
                $sheet->setCellValue([2, $r], $cat->name);
                $sheet->setCellValue([3, $r], strtoupper($cat->tier ?? 'PREMIER'));
                $sheet->setCellValue([4, $r], $fIdx + 1);
                $sheet->setCellValue([5, $r], $finalist->name);
                $sheet->setCellValue([6, $r], $finalist->vote_count);
                $sheet->setCellValue([7, $r], $pct / 100);
                $sheet->setCellValue([8, $r], $finalist->description ?? $finalist->bio ?? '-');

                $sheet->getStyle([6, $r])->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle([7, $r])->getNumberFormat()->setFormatCode('0.00%');

                // Gold for #1 finalists
                if ($fIdx === 0) {
                    $sheet->getStyle("A{$r}:H{$r}")->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['rgb' => '7A3F00']],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FEF9C3']],
                    ]);
                } else {
                    $this->applyAlternateRow($sheet, $r, 8, $row % 2 === 0);
                }

                $this->applyRowBorder($sheet, $r, 8);

                foreach ([1, 3, 4] as $c) {
                    $sheet->getStyle([$c, $r])->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                }
                $sheet->getStyle([8, $r])->getAlignment()->setWrapText(true);

                $r++;
            }
        }

        $sheet->freezePane('A3');
    }

    // ────────────────────────────────────────────────────────────────────────────
    // SHEET 4 — Detail Log Transaksi & Audit
    // ────────────────────────────────────────────────────────────────────────────
    private function buildSheet4(
        \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet,
        $votes
    ): void {
        $sheet->setTitle('Log Transaksi');

        $widths = [24, 20, 34, 34, 28, 28, 12, 12, 20, 16, 14];
        foreach ($widths as $i => $w) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1);
            $sheet->getColumnDimension($colLetter)->setWidth($w);
        }

        $headers = [
            'ID Referensi / Invoice', 'Waktu (WIB)', 'Kategori', 'Finalis Dipilih',
            'Nama Pemilih', 'Kontak (WA/Email)', 'Tipe Vote', 'Jml Suara',
            'Metode Bayar', 'Total Bayar (Rp)', 'Status',
        ];

        $sheet->mergeCells('A1:K1');
        $sheet->setCellValue('A1', 'DETAIL AUDIT LOG TRANSAKSI & SUARA MASUK');
        $this->applyHeaderStyle($sheet, 'A1:K1', self::CLR_HEADER_BG, self::CLR_HEADER_FG, 12);
        $sheet->getRowDimension(1)->setRowHeight(24);

        $this->applyColumnHeaders($sheet, 2, $headers);
        $sheet->getRowDimension(2)->setRowHeight(28);

        $r = 3;
        foreach ($votes as $i => $vote) {
            $isPaid = $vote->type !== 'free';

            $voterDisplay = $vote->is_anonymous
                ? 'Anonim (' . ($vote->user?->name ?? $vote->voter_name) . ')'
                : ($vote->user?->name ?? $vote->voter_name);

            $sheet->setCellValue([1,  $r], $vote->reference_id ?? 'SVT-' . $vote->id);
            $sheet->setCellValue([2,  $r], $vote->created_at?->format('d/m/Y H:i:s') ?? '-');
            $sheet->setCellValue([3,  $r], $vote->finalist?->category?->name ?? '-');
            $sheet->setCellValue([4,  $r], $vote->finalist?->name ?? '-');
            $sheet->setCellValue([5,  $r], $voterDisplay);
            $sheet->setCellValue([6,  $r], $vote->voter_contact ?? '-');
            $sheet->setCellValue([7,  $r], $isPaid ? 'Berbayar' : 'Gratis (1×)');
            $sheet->setCellValue([8,  $r], $vote->vote_amount);
            $sheet->setCellValue([9,  $r], strtoupper($vote->payment_method ?? 'FREE'));
            $sheet->setCellValue([10, $r], $vote->total_price);
            $sheet->setCellValue([11, $r], strtoupper($vote->status ?? 'CONFIRMED'));

            $sheet->getStyle([8,  $r])->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle([10, $r])->getNumberFormat()->setFormatCode('"Rp "#,##0');

            // Colour code: paid = light amber, free = light mint
            $rowBg = $isPaid ? self::CLR_PAID : self::CLR_REVENUE;
            if ($i % 2 !== 0) {
                $sheet->getStyle("A{$r}:K{$r}")->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB($rowBg);
            }

            $this->applyRowBorder($sheet, $r, 11);

            $sheet->getStyle([7,  $r])->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle([8,  $r])->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle([11, $r])->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $r++;
        }

        $lastRow = $r - 1;
        if ($lastRow >= 3) {
            $sheet->setAutoFilter("A2:K{$lastRow}");
        }
        $sheet->freezePane('A3');
    }

    // ────────────────────────────────────────────────────────────────────────────
    // PUBLIC — Export Event as multi-sheet XLSX
    // ────────────────────────────────────────────────────────────────────────────
    public function exportXlsx(Event $event): StreamedResponse
    {
        $this->ensureThumbnailColumnExists();

        $categories  = $event->categories()
            ->with(['finalists' => fn ($q) => $q->orderByDesc('vote_count')])
            ->get();
        $finalistIds = $categories->flatMap(fn ($c) => $c->finalists->pluck('id'));

        $votes = Vote::query()
            ->whereIn('finalist_id', $finalistIds)
            ->where('status', 'confirmed')
            ->with(['finalist.category', 'user'])
            ->latest()
            ->get();

        $totalVotes        = (int) $votes->sum('vote_amount');
        $totalRevenue      = (int) $votes->where('type', 'paid')->sum('total_price');
        $totalTransactions = $votes->count();
        $paidVotes         = (int) $votes->where('type', 'paid')->sum('vote_amount');
        $freeVotes         = (int) $votes->where('type', 'free')->sum('vote_amount');
        $paidTransactions  = $votes->where('type', 'paid')->count();
        $freeTransactions  = $votes->where('type', 'free')->count();

        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()
            ->setCreator('Sebaris.id')
            ->setTitle('Laporan Event ' . $event->name)
            ->setSubject('Rekap E-Voting Sebaris.id')
            ->setDescription('Laporan resmi hasil e-voting yang diunduh dari platform Sebaris.id.');

        // Sheet 1 — Ringkasan
        $this->buildSheet1(
            $spreadsheet->getActiveSheet(),
            $event, $categories, $finalistIds,
            $totalVotes, $totalRevenue, $totalTransactions,
            $paidVotes, $freeVotes, $paidTransactions, $freeTransactions
        );

        // Sheet 2 — Rekap Kategori
        $sheet2 = $spreadsheet->createSheet();
        $this->buildSheet2($sheet2, $categories, $votes);

        // Sheet 3 — Rekap Finalis
        $sheet3 = $spreadsheet->createSheet();
        $this->buildSheet3($sheet3, $categories);

        // Sheet 4 — Log Transaksi
        $sheet4 = $spreadsheet->createSheet();
        $this->buildSheet4($sheet4, $votes);

        // Activate sheet 1 on open
        $spreadsheet->setActiveSheetIndex(0);

        $filename = 'Laporan_Event_' . Str::slug($event->name) . '_' . date('Ymd_His') . '.xlsx';

        $headers = [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control'       => 'max-age=0, no-cache, no-store',
            'Pragma'              => 'no-cache',
            'Expires'             => '0',
        ];

        $callback = function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->setPreCalculateFormulas(true);
            $writer->save('php://output');
            $spreadsheet->disconnectWorksheets();
        };

        return response()->stream($callback, 200, $headers);
    }

    // ─── Standard CRUD ───────────────────────────────────────────────────────────
    private function ensureThumbnailColumnExists(): void
    {
        if (!Schema::hasColumn('events', 'thumbnail')) {
            try {
                Schema::table('events', function ($table) {
                    $table->string('thumbnail')->nullable()->after('name');
                });
            } catch (\Throwable) {}

            try {
                $cats = DB::table('categories')
                    ->whereNotNull('thumbnail')
                    ->whereNotNull('event_id')
                    ->get();
                foreach ($cats as $cat) {
                    DB::table('events')
                        ->where('id', $cat->event_id)
                        ->whereNull('thumbnail')
                        ->update(['thumbnail' => $cat->thumbnail]);
                }
            } catch (\Throwable) {}
        }

        if (!Schema::hasColumn('events', 'theme_color')) {
            try {
                Schema::table('events', function ($table) {
                    $table->string('theme_color', 50)->nullable()->after('status');
                });
            } catch (\Throwable) {}
        }
    }

    public function index(): AnonymousResourceCollection
    {
        $this->ensureThumbnailColumnExists();
        return EventResource::collection(
            Event::query()
                ->withCount('categories')
                ->with(['categories' => function ($q) { $q->ordered(); }])
                ->latest()
                ->get()
        );
    }

    public function store(EventRequest $request): EventResource
    {
        $this->ensureThumbnailColumnExists();
        $data = $request->safe()->except('thumbnail');
        if (empty($data['status'])) $data['status'] = 'active';
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
                'categories' => function ($q) { $q->ordered()->withCount('finalists'); },
            ])->loadCount('categories')
        );
    }

    public function update(EventRequest $request, Event $event): EventResource
    {
        $this->ensureThumbnailColumnExists();
        $data = $request->safe()->except('thumbnail');
        if ($request->hasFile('thumbnail')) {
            if ($event->thumbnail) Storage::disk('public')->delete($event->thumbnail);
            $data['thumbnail'] = ImageOptimizer::storeOptimized($request->file('thumbnail'), 'events', 1000, 78);
        }
        $event->update($data);
        return new EventResource($event->fresh()->loadCount('categories')->load(['categories']));
    }

    public function destroy(Event $event): Response
    {
        if ($event->thumbnail) Storage::disk('public')->delete($event->thumbnail);
        $event->delete();
        return response()->noContent();
    }
}
