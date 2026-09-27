<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $thumbnailUrl = null;
        if ($this->thumbnail) {
            if (filter_var($this->thumbnail, FILTER_VALIDATE_URL)) {
                $thumbnailUrl = $this->thumbnail;
            } else {
                $host = $request ? $request->getSchemeAndHttpHost() : rtrim(config('app.url'), '/');
                $thumbnailUrl = rtrim($host, '/') . '/storage/' . ltrim($this->thumbnail, '/');
            }
        }

        return [
            'id' => $this->id,
            'event_id' => $this->event_id,
            'tier' => $this->tier ?? 'premier',
            'sort_order' => $this->sort_order ?? 1,
            'name' => $this->name,
            'slug' => $this->slug ?? \Illuminate\Support\Str::slug($this->name),
            'thumbnail' => $thumbnailUrl,
            'thumbnail_url' => $thumbnailUrl,
            'thumbnail_path' => $this->thumbnail,
            'description' => $this->description,
            'organizer' => $this->organizer,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'status' => $this->status ?? 'active',
            'price_per_vote' => $this->price_per_vote ?? 1000,
            'allow_free_vote' => (bool) ($this->allow_free_vote ?? true),
            'vote_packages'   => $this->vote_packages ?? [],
            'freeze_leaderboard' => (bool) ($this->freeze_leaderboard ?? false),
            'finalists_count' => $this->whenCounted('finalists'),
            'event' => $this->event ? [
                'id' => $this->event->id,
                'name' => $this->event->name,
                'status' => $this->event->status,
                'start_date' => $this->event->start_date?->toDateString(),
                'end_date' => $this->event->end_date?->toDateString(),
            ] : null,
            'sibling_categories' => $this->when(
                $this->event_id !== null,
                function () {
                    if ($this->relationLoaded('event') && $this->event && $this->event->relationLoaded('categories')) {
                        $cats = $this->event->categories;
                    } else {
                        $cats = \App\Models\Category::where('event_id', $this->event_id)->ordered()->get();
                    }
                    return $cats->map(function ($cat) {
                        return [
                            'id' => $cat->id,
                            'name' => $cat->name,
                            'slug' => $cat->slug,
                            'tier' => $cat->tier ?? 'premier',
                            'sort_order' => $cat->sort_order ?? 1,
                            'status' => $cat->status,
                            'is_current' => $cat->id === $this->id,
                        ];
                    })->values()->all();
                },
                []
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
