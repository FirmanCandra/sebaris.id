<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class CategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Category::query()->withCount('finalists')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return CategoryResource::collection($query->get());
    }

    public function store(CategoryRequest $request): CategoryResource
    {
        $data = $request->safe()->except('thumbnail');

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = $request->file('thumbnail')->store('categories', 'public');
        }

        $category = Category::create($data);
        Cache::forget('public.categories');

        return new CategoryResource($category->loadCount('finalists'));
    }

    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->loadCount('finalists'));
    }

    public function update(CategoryRequest $request, Category $category): CategoryResource
    {
        $data = $request->safe()->except('thumbnail');

        if ($request->hasFile('thumbnail')) {
            if ($category->thumbnail) {
                Storage::disk('public')->delete($category->thumbnail);
            }

            $data['thumbnail'] = $request->file('thumbnail')->store('categories', 'public');
        }

        $category->update($data);
        Cache::forget('public.categories');

        return new CategoryResource($category->fresh()->loadCount('finalists'));
    }

    public function destroy(Category $category): Response
    {
        if ($category->thumbnail) {
            Storage::disk('public')->delete($category->thumbnail);
        }

        $category->delete();
        Cache::forget('public.categories');

        return response()->noContent();
    }
}
