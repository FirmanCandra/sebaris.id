<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Finalist extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'photo',
        'extra_photos',
        'bio',
        'social_ig',
        'description',
        'vote_count',
    ];

    protected function casts(): array
    {
        return [
            'vote_count'   => 'integer',
            'extra_photos' => 'array',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }
}
