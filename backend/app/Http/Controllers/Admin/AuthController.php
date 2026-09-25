<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LoginRequest;
use App\Http\Resources\AdminResource;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $admin = Admin::query()->where('email', $request->validated('email'))->first();

        if (! $admin || ! Hash::check($request->validated('password'), $admin->password)) {
            return response()->json(['message' => 'Email atau kata sandi tidak valid.'], 422);
        }

        return response()->json([
            'token' => $admin->createToken('admin-spa')->plainTextToken,
            'admin' => new AdminResource($admin),
        ]);
    }

    public function googleLogin(Request $request): JsonResponse
    {
        $request->validate([
            'credential' => ['required', 'string'],
        ]);

        $credential = $request->string('credential');

        $response = \Illuminate\Support\Facades\Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $credential,
        ]);

        if (! $response->successful()) {
            return response()->json(['message' => 'Token Google tidak valid atau telah kedaluwarsa.'], 422);
        }

        $payload = $response->json();
        $googleId = $payload['sub'] ?? null;
        $email = $payload['email'] ?? null;
        $name = $payload['name'] ?? 'Admin Google';
        $avatar = $payload['picture'] ?? null;
        $aud = $payload['aud'] ?? null;

        $expectedClientId = config('services.google.client_id');
        if ($expectedClientId && $aud && $aud !== $expectedClientId) {
            return response()->json(['message' => 'Token Google tidak sesuai dengan Client ID aplikasi ini.'], 422);
        }

        if (! $email) {
            return response()->json(['message' => 'Email tidak dapat ditemukan dari akun Google.'], 422);
        }

        $admin = Admin::query()->where('email', $email)->orWhere('google_id', $googleId)->first();

        if (! $admin) {
            return response()->json([
                'message' => 'Akses ditolak: Akun Google ini tidak terdaftar sebagai administrator.',
            ], 403);
        }

        $admin->update([
            'google_id' => $googleId,
            'avatar' => $avatar ?? $admin->avatar,
        ]);

        return response()->json([
            'token' => $admin->createToken('admin-spa')->plainTextToken,
            'admin' => new AdminResource($admin),
        ]);
    }

    public function me(Request $request): AdminResource
    {
        return new AdminResource($request->user());
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(status: 204);
    }
}
