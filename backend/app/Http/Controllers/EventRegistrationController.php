<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EventRegistrationController extends Controller
{
    /**
     * Submit permohonan event baru oleh publik / panitia
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'organization_name' => 'required|string|max:255',
            'pic_name' => 'required|string|max:255',
            'pic_email' => 'required|email|max:255',
            'pic_phone' => 'required|string|max:50',
            'event_name' => 'required|string|max:255',
            'event_description' => 'nullable|string',
            'category_names' => 'nullable|array',
            'category_names.*' => 'string|max:255',
            'estimated_finalists' => 'nullable|string|max:50',
            'voting_type' => 'required|in:free,paid,hybrid',
            'target_start_date' => 'nullable|date',
            'target_end_date' => 'nullable|date',
            'addons' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        // Generate nomor registrasi unik format: SBR-2026-XXXXX
        $year = date('Y');
        do {
            $regNumber = 'SBR-' . $year . '-' . strtoupper(Str::random(5));
        } while (EventRegistration::where('registration_number', $regNumber)->exists());

        // Cek user yang sedang login jika ada
        $user = $request->user('sanctum');

        $registration = EventRegistration::create([
            'registration_number' => $regNumber,
            'user_id' => $user?->id,
            'organization_name' => trim($validated['organization_name']),
            'pic_name' => trim($validated['pic_name']),
            'pic_email' => strtolower(trim($validated['pic_email'])),
            'pic_phone' => trim($validated['pic_phone']),
            'event_name' => trim($validated['event_name']),
            'event_description' => $validated['event_description'] ?? null,
            'category_names' => $validated['category_names'] ?? [],
            'estimated_finalists' => $validated['estimated_finalists'] ?? 'Belum ditentukan',
            'voting_type' => $validated['voting_type'],
            'target_start_date' => $validated['target_start_date'] ?? null,
            'target_end_date' => $validated['target_end_date'] ?? null,
            'addons' => $validated['addons'] ?? [],
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',
            'admin_notes' => null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pendaftaran event voting berhasil diajukan! Simpan nomor registrasi Anda untuk memantau status persetujuan.',
            'data' => $registration,
        ], 201);
    }

    /**
     * Cek status pendaftaran event secara publik via nomor registrasi atau email
     */
    public function show(string $registrationNumber): JsonResponse
    {
        $reg = EventRegistration::with('createdEvent:id,name,status')
            ->where('registration_number', strtoupper(trim($registrationNumber)))
            ->first();

        if (!$reg) {
            return response()->json([
                'status' => 'error',
                'message' => 'Nomor registrasi event tidak ditemukan. Pastikan format nomor benar (contoh: SBR-2026-XXXXX).',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $reg,
        ]);
    }

    /**
     * Cari pendaftaran berdasarkan No. Registrasi atau Email PIC
     */
    public function search(Request $request): JsonResponse
    {
        $query = trim($request->query('q', ''));
        if (empty($query)) {
            return response()->json(['status' => 'success', 'data' => []]);
        }

        $results = EventRegistration::with('createdEvent:id,name,status')
            ->where('registration_number', 'LIKE', "%{$query}%")
            ->orWhere('pic_email', 'LIKE', "%{$query}%")
            ->orWhere('pic_phone', 'LIKE', "%{$query}%")
            ->latest()
            ->limit(10)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $results,
        ]);
    }

    /**
     * Mengambil daftar pendaftaran milik akun user yang login
     */
    public function userRegistrations(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $registrations = EventRegistration::with('createdEvent:id,name,status')
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id);
                if ($user->email) {
                    $q->orWhere('pic_email', $user->email);
                }
            })
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $registrations,
        ]);
    }

    /**
     * Admin: Melihat semua permohonan event
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $search = trim($request->query('search', ''));

        $query = EventRegistration::with(['createdEvent:id,name,status', 'user:id,name,email'])
            ->latest();

        if ($status && in_array($status, ['pending', 'in_review', 'approved', 'rejected'])) {
            $query->where('status', $status);
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('registration_number', 'LIKE', "%{$search}%")
                  ->orWhere('event_name', 'LIKE', "%{$search}%")
                  ->orWhere('organization_name', 'LIKE', "%{$search}%")
                  ->orWhere('pic_name', 'LIKE', "%{$search}%")
                  ->orWhere('pic_email', 'LIKE', "%{$search}%")
                  ->orWhere('pic_phone', 'LIKE', "%{$search}%");
            });
        }

        $items = $query->paginate(20);

        // Hitung statistik untuk badge admin
        $counts = [
            'all' => EventRegistration::count(),
            'pending' => EventRegistration::where('status', 'pending')->count(),
            'in_review' => EventRegistration::where('status', 'in_review')->count(),
            'approved' => EventRegistration::where('status', 'approved')->count(),
            'rejected' => EventRegistration::where('status', 'rejected')->count(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $items->items(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'total' => $items->total(),
            ],
            'counts' => $counts,
        ]);
    }

    /**
     * Admin: Update status dan catatan admin
     */
    public function adminUpdate(Request $request, int $id): JsonResponse
    {
        $registration = EventRegistration::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:pending,in_review,approved,rejected',
            'admin_notes' => 'nullable|string',
        ]);

        $registration->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Status pengajuan event berhasil diperbarui.',
            'data' => $registration,
        ]);
    }

    /**
     * Admin: Setujui dan otomatis buat Event resmi di database
     */
    public function adminApproveToEvent(Request $request, int $id): JsonResponse
    {
        $registration = EventRegistration::findOrFail($id);

        if ($registration->created_event_id && Event::where('id', $registration->created_event_id)->exists()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Event ini sudah pernah dibuat sebelumnya.',
                'event_id' => $registration->created_event_id,
            ]);
        }

        // Buat record Event baru
        $event = Event::create([
            'name' => $registration->event_name,
            'start_date' => $registration->target_start_date ?? now()->toDateString(),
            'end_date' => $registration->target_end_date ?? now()->addDays(14)->toDateString(),
            'status' => 'active',
            'theme_color' => '#70B325',
        ]);

        // Buat kategori default jika panitia mencantumkan nama-nama kategori
        $catNames = is_array($registration->category_names) ? $registration->category_names : [];
        if (empty($catNames)) {
            $catNames = ['Kategori Utama'];
        }

        foreach ($catNames as $index => $catName) {
            $slugBase = Str::slug($catName);
            $slug = $slugBase;
            $count = 1;
            while (Category::where('slug', $slug)->exists()) {
                $slug = $slugBase . '-' . (++$count);
            }

            Category::create([
                'event_id' => $event->id,
                'name' => trim($catName),
                'slug' => $slug,
                'description' => "Kategori voting resmi ajang {$event->name}.",
                'start_date' => $event->start_date,
                'end_date' => $event->end_date,
                'status' => 'active',
                'is_frozen' => false,
                'price_per_vote' => $registration->voting_type === 'free' ? 0 : 1000,
                'free_votes_per_user' => $registration->voting_type === 'paid' ? 0 : 1,
                'min_paid_votes' => 1,
                'max_paid_votes' => 1000,
                'sort_order' => $index + 1,
            ]);
        }

        // Update status pendaftaran menjadi approved dan hubungkan event_id
        $registration->update([
            'status' => 'approved',
            'created_event_id' => $event->id,
            'admin_notes' => ($registration->admin_notes ? $registration->admin_notes . "\n" : '') .
                "Disetujui dan dibuat menjadi event ID #{$event->id} pada " . now()->format('d M Y, H:i'),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Event '{$event->name}' berhasil dibuat secara otomatis dengan " . count($catNames) . " kategori!",
            'event_id' => $event->id,
            'data' => $registration->fresh(['createdEvent']),
        ]);
    }
}
