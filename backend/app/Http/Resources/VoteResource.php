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
            'reference_id' => $this->reference_id,
            'finalist_id' => $this->finalist_id,
            'voter_name' => $this->voter_name,
            'voter_contact' => $this->voter_contact,
            'vote_amount' => $this->vote_amount,
            'total_price' => $this->total_price ?? 0,
            'type' => $this->type,
            'payment_method' => $this->payment_method ?? ($this->type === 'free' ? 'Gratis' : 'QRIS'),
            'status' => $this->status,
            'paid_at' => $this->paid_at?->toISOString(),
            'finalist' => $this->relationLoaded('finalist') ? [
                'id' => $this->finalist->id,
                'name' => $this->finalist->name,
                'photo' => $this->finalist->photo,
                'category_name' => $this->finalist->category?->name,
            ] : null,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
