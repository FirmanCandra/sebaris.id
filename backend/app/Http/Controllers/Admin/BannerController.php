<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class BannerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Banner::query()->ordered();

        if ($request->filled('status')) {
            $query->where('is_active', $request->boolean('status'));
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'image' => ['required', 'image', 'max:10240'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable'],
        ]);

        $data = [
            'title' => $validated['title'],
            'link_url' => $validated['link_url'] ?? null,
            'sort_order' => isset($validated['sort_order']) ? (int) $validated['sort_order'] : 1,
            'is_active' => isset($validated['is_active']) ? filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN) : true,
        ];

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('banners', 'public');
        }

        $banner = Banner::create($data);

        return response()->json([
            'data' => $banner,
        ], Response::HTTP_CREATED);
    }

    public function show(Banner $banner): JsonResponse
    {
        return response()->json([
            'data' => $banner,
        ]);
    }

    public function update(Request $request, Banner $banner): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'image' => ['nullable'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable'],
        ]);

        $data = [];
        if (isset($validated['title'])) {
            $data['title'] = $validated['title'];
        }
        if (array_key_exists('link_url', $validated)) {
            $data['link_url'] = $validated['link_url'];
        }
        if (isset($validated['sort_order'])) {
            $data['sort_order'] = (int) $validated['sort_order'];
        }
        if (isset($validated['is_active'])) {
            $data['is_active'] = filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->hasFile('image')) {
            if ($banner->image && Storage::disk('public')->exists($banner->image)) {
                Storage::disk('public')->delete($banner->image);
            }
            $data['image'] = $request->file('image')->store('banners', 'public');
        }

        $banner->update($data);

        return response()->json([
            'data' => $banner->fresh(),
        ]);
    }

    public function destroy(Banner $banner): Response
    {
        if ($banner->image && Storage::disk('public')->exists($banner->image)) {
            Storage::disk('public')->delete($banner->image);
        }

        $banner->delete();

        return response()->noContent();
    }
}
