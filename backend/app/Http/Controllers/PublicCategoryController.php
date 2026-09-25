<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

class PublicCategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $categories = Cache::remember('public.categories', 60, function () {
            return Category::query()
                ->where('status', 'active')
                ->withCount('finalists')
                ->latest()
                ->get();
        });

        return CategoryResource::collection($categories);
    }

    public function show(string $idOrSlug): CategoryResource
    {
        $category = Category::query()
            ->where('status', 'active')
            ->where(function ($query) use ($idOrSlug) {
                if (is_numeric($idOrSlug)) {
                    $query->where('id', (int) $idOrSlug);
                } else {
                    $query->where('slug', $idOrSlug);
                }
            })
            ->firstOrFail();

        return new CategoryResource($category->loadCount('finalists'));
    }
}
