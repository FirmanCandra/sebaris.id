<?php

namespace App\Http\Controllers;

use App\Http\Resources\FinalistResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicFinalistController extends Controller
{
    protected function resolveCategory(string $idOrSlug): Category
    {
        return Category::query()
            ->where('status', 'active')
            ->where(function ($query) use ($idOrSlug) {
                if (is_numeric($idOrSlug)) {
                    $query->where('id', (int) $idOrSlug);
                } else {
                    $query->where('slug', $idOrSlug);
                }
            })
            ->firstOrFail();
    }

    public function index(string $category): AnonymousResourceCollection
    {
        $cat = $this->resolveCategory($category);

        return FinalistResource::collection(
            $cat->finalists()->orderByDesc('vote_count')->orderBy('name')->get(),
        );
    }

    public function leaderboard(string $category): AnonymousResourceCollection
    {
        return $this->index($category);
    }
}
