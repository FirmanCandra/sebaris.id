<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vote extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference_id',
        'user_id',
        'finalist_id',
        'voter_name',
        'voter_contact',
        'message',
        'is_anonymous',
        'vote_amount',
        'total_price',
        'type',
        'payment_method',
        'status',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'vote_amount' => 'integer',
            'total_price' => 'integer',
            'is_anonymous' => 'boolean',
            'paid_at' => 'datetime',
        ];
    }

    public function finalist(): BelongsTo
    {
        return $this->belongsTo(Finalist::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
