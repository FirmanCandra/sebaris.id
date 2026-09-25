<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicCategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection(
            Category::query()
                ->where('status', 'active')
                ->withCount('finalists')
                ->latest()
                ->get(),
        );
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
