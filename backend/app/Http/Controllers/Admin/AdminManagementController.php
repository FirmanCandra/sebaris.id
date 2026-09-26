<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminResource;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AdminManagementController extends Controller
{
    public function index(): JsonResponse
    {
        $admins = Admin::orderBy('created_at', 'desc')->get();
        return response()->json(['data' => AdminResource::collection($admins)]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:admins,email'],
            'password' => ['required', Password::min(8)],
            'role'     => ['nullable', 'in:superadmin,operator'],
        ]);

        $admin = Admin::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'] ?? 'operator',
            'is_active'=> true,
        ]);

        return response()->json([
            'message' => 'Admin baru berhasil ditambahkan.',
            'data'    => new AdminResource($admin),
        ], 201);
    }

    public function update(Request $request, Admin $admin): JsonResponse
    {
        $validated = $request->validate([
            'name'      => ['sometimes', 'string', 'max:255'],
            'role'      => ['sometimes', 'in:superadmin,operator'],
            'is_active' => ['sometimes', 'boolean'],
            'password'  => ['nullable', Password::min(8)],
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $admin->update($validated);

        return response()->json([
            'message' => 'Data admin berhasil diperbarui.',
            'data'    => new AdminResource($admin->fresh()),
        ]);
    }

    public function destroy(Request $request, Admin $admin): JsonResponse
    {
        // Prevent self-deletion
        if ($admin->id === $request->user()->id) {
            return response()->json(['message' => 'Tidak dapat menghapus akun yang sedang aktif.'], 422);
        }

        $admin->tokens()->delete();
        $admin->delete();

        return response()->json(['message' => 'Admin berhasil dihapus.']);
    }
}
