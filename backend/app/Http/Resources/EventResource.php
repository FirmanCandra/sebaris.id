<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $thumbnailUrl = null;
        if ($this->thumbnail) {
            if (filter_var($this->thumbnail, FILTER_VALIDATE_URL)) {
                $thumbnailUrl = $this->thumbnail;
            } else {
                $host = config('app.url') ?? $request->getSchemeAndHttpHost();
                $thumbnailUrl = rtrim($host, '/') . '/storage/' . ltrim($this->thumbnail, '/');
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
            'categories_count' => $this->whenCounted('categories'),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
