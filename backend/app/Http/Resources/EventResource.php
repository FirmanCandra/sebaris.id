<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $thumbnailUrl = null;
        $thumbnail = $this->thumbnail;

        // Auto fallback to first category's thumbnail if event thumbnail is not explicitly set
        if (empty($thumbnail) && $this->relationLoaded('categories') && $this->categories->isNotEmpty()) {
            $firstCat = $this->categories->first();
            $thumbnail = $firstCat->thumbnail ?? $firstCat->thumbnail_path;
        }

        if ($thumbnail) {
            if (filter_var($thumbnail, FILTER_VALIDATE_URL)) {
                $thumbnailUrl = $thumbnail;
            } else {
                $host = config('app.url') ?? $request->getSchemeAndHttpHost();
                $thumbnailUrl = rtrim($host, '/') . '/storage/' . ltrim($thumbnail, '/');
            }
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'thumbnail' => $thumbnailUrl,
            'thumbnail_url' => $thumbnailUrl,
            'thumbnail_path' => $this->thumbnail,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'status' => $this->status,
            'theme_color' => $this->theme_color,
            'categories_count' => $this->whenCounted('categories'),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
