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

    public function show(Category $category): CategoryResource
    {
        abort_unless($category->status === 'active', 404);

        return new CategoryResource($category->loadCount('finalists'));
    }
}
