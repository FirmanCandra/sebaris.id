<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\ImageOptimizer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class CategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
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
        if ($category->thumbnail) {
            Storage::disk('public')->delete($category->thumbnail);
        }

        $category->delete();
        Cache::forget('public.categories.all');
        Cache::forget('public.categories');

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
