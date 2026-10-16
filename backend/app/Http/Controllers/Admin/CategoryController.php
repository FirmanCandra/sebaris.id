<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Models\Finalist;
use App\Models\Vote;
use App\Services\ImageOptimizer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class CategoryController extends Controller
{
    private function ensureThemeColorColumnExists(): void
    {
        if (Schema::hasTable('categories') && !Schema::hasColumn('categories', 'theme_color')) {
            try {
                Schema::table('categories', function ($table) {
                    $table->string('theme_color', 50)->nullable()->after('thumbnail');
                });
            } catch (\Throwable) {
            }
        }
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->ensureThemeColorColumnExists();

        $query = Category::query()->with('event')->withCount('finalists')->ordered();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('event_id')) {
            $query->where('event_id', $request->integer('event_id'));
        }

        return CategoryResource::collection($query->get());
    }

    public function store(CategoryRequest $request): CategoryResource
    {
        $this->ensureThemeColorColumnExists();

        $data = $request->safe()->except('thumbnail');

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = ImageOptimizer::storeOptimized($request->file('thumbnail'), 'categories', 1000, 78);
        }

        $category = Category::create($data);
        Cache::forget('public.categories.all');

        return new CategoryResource($category->load('event')->loadCount('finalists'));
    }

    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->load('event')->loadCount('finalists'));
    }

    public function update(CategoryRequest $request, Category $category): CategoryResource
    {
        $this->ensureThemeColorColumnExists();

        $data = $request->safe()->except('thumbnail');

        if ($request->hasFile('thumbnail')) {
            if ($category->thumbnail) {
                Storage::disk('public')->delete($category->thumbnail);
            }

            $data['thumbnail'] = ImageOptimizer::storeOptimized($request->file('thumbnail'), 'categories', 1000, 78);
        }

        $category->update($data);
        Cache::forget('public.categories.all');

        return new CategoryResource($category->fresh()->load('event')->loadCount('finalists'));
    }

    public function destroy(Category $category): Response
    {
        DB::transaction(function () use ($category) {
            $finalists = $category->finalists()->get();
            $finalistIds = $finalists->pluck('id');

            // 1. Hapus semua vote yang mereferensikan finalis kategori ini
            if ($finalistIds->isNotEmpty()) {
                Vote::whereIn('finalist_id', $finalistIds)->delete();
            }

            // 2. Hapus file foto finalis dari storage
            foreach ($finalists as $finalist) {
                if ($finalist->photo) {
                    Storage::disk('public')->delete($finalist->photo);
                }
                foreach ($finalist->extra_photos ?? [] as $extraPhoto) {
                    Storage::disk('public')->delete($extraPhoto);
                }
            }

            // 3. Hapus thumbnail kategori
            if ($category->thumbnail) {
                Storage::disk('public')->delete($category->thumbnail);
            }

            // 4. Hapus finalis dan kategori
            if ($finalistIds->isNotEmpty()) {
                Finalist::whereIn('id', $finalistIds)->delete();
            }
            $category->delete();
        });

        Cache::forget('public.events');
        Cache::forget('public.categories.all');
        Cache::forget('public.categories');
        Cache::forget("public.finalists.{$category->id}");

        return response()->noContent();
    }

    public function toggleFreeze(Category $category): CategoryResource
    {
        $category->update([
            'freeze_leaderboard' => !$category->freeze_leaderboard,
        ]);
        Cache::forget('public.categories.all');
        Cache::forget('public.categories');
        Cache::forget("public.finalists.{$category->id}");

        return new CategoryResource($category->fresh()->loadCount('finalists'));
    }
}
