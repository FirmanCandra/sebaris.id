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
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
