<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'finalist_id' => $this->finalist_id,
            'vote_amount' => $this->vote_amount,
            'type' => $this->type,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
