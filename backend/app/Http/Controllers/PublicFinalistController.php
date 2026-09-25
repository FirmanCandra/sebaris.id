<?php

namespace App\Http\Controllers;

use App\Http\Resources\FinalistResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicFinalistController extends Controller
{
    public function index(Category $category): AnonymousResourceCollection
    {
        abort_unless($category->status === 'active', 404);

        return FinalistResource::collection(
            $category->finalists()->orderByDesc('vote_count')->orderBy('name')->get(),
        );
    }

    public function leaderboard(Category $category): AnonymousResourceCollection
    {
        return $this->index($category);
    }
}
