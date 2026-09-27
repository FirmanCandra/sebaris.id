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
        $categories = Cache::remember('public.categories.all', 30, function () {
            return Category::query()
                ->with('event')
                ->withCount('finalists')
                ->ordered()
                ->get();
        });

        return CategoryResource::collection($categories);
    }

    public function show(string $idOrSlug): CategoryResource
    {
        $category = Category::query()
            ->with([
                'event.categories' => function ($query) {
                    $query->ordered();
                },
            ])
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

    /**
     * Efficiently get top #1 leading finalists across active categories in a single query.
     */
    public function topChampions(): \Illuminate\Http\JsonResponse
    {
        $champions = Cache::remember('public.categories.top_champions', 15, function () {
            $categories = Category::query()
                ->where('status', 'active')
                ->where(function ($q) {
                    $q->whereNull('event_id')
                      ->orWhereHas('event', function ($sq) {
                          $sq->where('status', 'active');
                      });
                })
                ->with(['event', 'finalists' => function ($q) {
                    $q->orderByDesc('vote_count')->orderBy('name');
                }])
                ->ordered()
                ->take(8)
                ->get();

            $result = [];
            foreach ($categories as $cat) {
                $finalists = $cat->finalists;
                if ($finalists->isEmpty()) continue;
                $leader = $finalists->first();
                $totalVotes = $finalists->sum('vote_count');
                $pct = $totalVotes > 0 ? (int) round(($leader->vote_count / $totalVotes) * 100) : 0;

                $result[] = [
                    'category' => [
                        'id' => $cat->id,
                        'name' => $cat->name,
                        'slug' => $cat->slug,
                        'tier' => $cat->tier,
                        'event' => $cat->event ? [
                            'id' => $cat->event->id,
                            'name' => $cat->event->name,
                        ] : null,
                    ],
                    'finalist' => [
                        'id' => $leader->id,
                        'name' => $leader->name,
                        'number' => $leader->number,
                        'photo' => $leader->photo,
                        'photo_url' => $leader->photo_url,
                        'vote_count' => $leader->vote_count,
                    ],
                    'totalVotes' => $totalVotes,
                    'percentage' => $pct,
                ];
            }
            return $result;
        });

        return response()->json(['data' => $champions]);
    }
}

