<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class FinalistResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $photoUrl = null;
        if ($this->photo) {
            if (filter_var($this->photo, FILTER_VALIDATE_URL)) {
                $photoUrl = $this->photo;
            } else {
                $host = $request ? $request->getSchemeAndHttpHost() : rtrim(config('app.url'), '/');
                $photoUrl = rtrim($host, '/') . '/storage/' . ltrim($this->photo, '/');
            }
        }

        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'photo' => $photoUrl,
            'photo_url' => $photoUrl,
            'photo_path' => $this->photo,
            'description' => $this->description,
            'vote_count' => $this->vote_count,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
