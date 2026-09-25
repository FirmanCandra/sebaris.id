<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vote extends Model
{
    use HasFactory;

    protected $fillable = [
        'finalist_id',
        'voter_name',
        'voter_contact',
        'vote_amount',
        'type',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'vote_amount' => 'integer',
        ];
    }

    public function finalist(): BelongsTo
    {
        return $this->belongsTo(Finalist::class);
    }
}
