<?php

namespace App\Http\Controllers;

use App\Http\Resources\AdminResource;
use App\Http\Resources\UserResource;
use App\Mail\GoogleLoginNotificationMail;
use App\Models\Admin;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class UserAuthController extends Controller
{
    /**
     * Unified Global Login with Email & Password (for Admin and Users).
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $email = $request->string('email')->trim()->toString();
        $password = $request->string('password')->toString();

        // 1. Check if an Admin matches
        $admin = Admin::query()->where('email', $email)->first();
        if ($admin && Hash::check($password, $admin->password)) {
            return response()->json([
                'token' => $admin->createToken('admin-spa')->plainTextToken,
                'role' => $admin->role ?? 'admin',
                'user' => new AdminResource($admin),
                'redirect' => '/admin/categories',
            ]);
        }

        // 2. Check if a User matches
        $user = User::query()->where('email', $email)->first();
        if ($user && $user->password && Hash::check($password, $user->password)) {
            return response()->json([
                'token' => $user->createToken('user-spa')->plainTextToken,
                'role' => 'user',
                'user' => new UserResource($user),
                'redirect' => '/',
            ]);
        }

        return response()->json([
            'message' => 'Email atau kata sandi tidak valid.',
        ], 422);
    }

    /**
     * Manual Registration for regular users (voters/pemilih).
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email', 'unique:admins,email'],
            'password' => ['required', 'string', 'min:6'],
        ], [
            'email.unique' => 'Email ini sudah terdaftar pada sistem.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'user',
        ]);

        return response()->json([
            'token' => $user->createToken('user-spa')->plainTextToken,
            'role' => 'user',
            'user' => new UserResource($user),
            'redirect' => '/',
        ], 201);
    }

    /**
     * Universal Google Sign-In with automatic notification email.
     */
    public function googleLogin(Request $request): JsonResponse
    {
        $request->validate([
            'credential' => ['required', 'string'],
        ]);

        $credential = $request->string('credential');

        $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $credential,
        ]);

        if (! $response->successful()) {
            return response()->json(['message' => 'Token Google tidak valid atau telah kedaluwarsa.'], 422);
        }

        $payload = $response->json();
        $googleId = $payload['sub'] ?? null;
        $email = $payload['email'] ?? null;
        $name = $payload['name'] ?? 'Pengguna Google';
        $avatar = $payload['picture'] ?? null;
        $aud = $payload['aud'] ?? null;

        $expectedClientId = config('services.google.client_id');
        if ($expectedClientId && $aud && $aud !== $expectedClientId) {
            return response()->json(['message' => 'Token Google tidak sesuai dengan Client ID aplikasi ini.'], 422);
        }

        if (! $email) {
            return response()->json(['message' => 'Email tidak dapat ditemukan dari akun Google.'], 422);
        }

        // Case A: Is this an Admin account?
        $admin = Admin::query()->where('email', $email)->orWhere('google_id', $googleId)->first();
        if ($admin) {
            $admin->update([
                'google_id' => $googleId,
                'avatar' => $avatar ?? $admin->avatar,
            ]);

            // Kirim email notifikasi bahwa telah login ke Sebaris.id
            $this->sendNotificationEmail($admin->name, $email, $request->ip());

            return response()->json([
                'token' => $admin->createToken('admin-spa')->plainTextToken,
                'role' => $admin->role ?? 'admin',
                'user' => new AdminResource($admin),
                'redirect' => '/admin/categories',
            ]);
        }

        // Case B: Regular User / Voter account
        $user = User::query()->where('email', $email)->orWhere('google_id', $googleId)->first();

        if ($user) {
            $user->update([
                'name' => $name ?: $user->name,
                'google_id' => $googleId,
                'avatar' => $avatar ?? $user->avatar,
            ]);
        } else {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'google_id' => $googleId,
                'avatar' => $avatar,
                'role' => 'user',
            ]);
        }

        // Kirim email notifikasi bahwa telah login ke Sebaris.id
        $this->sendNotificationEmail($user->name, $email, $request->ip());

        return response()->json([
            'token' => $user->createToken('user-spa')->plainTextToken,
            'role' => 'user',
            'user' => new UserResource($user),
            'redirect' => '/',
        ]);
    }

    /**
     * Send email notification safely without breaking login flow.
     */
    protected function sendNotificationEmail(string $name, string $email, ?string $ip): void
    {
        try {
            Mail::to($email)->send(new GoogleLoginNotificationMail($name, $email, $ip));
        } catch (\Throwable $e) {
            Log::warning("Gagal mengirim email notifikasi Google Login ke {$email}: " . $e->getMessage());
        }
    }

    public function me(Request $request): JsonResponse
    {
        $currentUser = $request->user();

        if ($currentUser instanceof Admin) {
            return response()->json([
                'role' => $currentUser->role ?? 'admin',
                'data' => new AdminResource($currentUser),
            ]);
        }

        return response()->json([
            'role' => 'user',
            'data' => new UserResource($currentUser),
        ]);
    }

    public function myVotes(Request $request): JsonResponse
    {
        $votes = Vote::query()
            ->where('user_id', $request->user()->id)
            ->with(['finalist.category'])
            ->latest()
            ->get();

        return response()->json([
            'data' => $votes->map(function ($vote) {
                return [
                    'id' => $vote->id,
                    'reference_id' => $vote->reference_id,
                    'finalist_name' => $vote->finalist?->name,
                    'category_name' => $vote->finalist?->category?->name,
                    'category_slug' => $vote->finalist?->category?->slug,
                    'category_id' => $vote->finalist?->category?->id,
                    'voter_name' => $vote->voter_name,
                    'voter_contact' => $vote->voter_contact,
                    'vote_amount' => $vote->vote_amount,
                    'total_price' => $vote->total_price,
                    'payment_method' => $vote->payment_method,
                    'type' => $vote->type,
                    'status' => $vote->status,
                    'paid_at' => $vote->paid_at ? $vote->paid_at->toIso8601String() : null,
                    'created_at' => $vote->created_at?->format('d M Y, H:i'),
                ];
            }),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(status: 204);
    }
}
