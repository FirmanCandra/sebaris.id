<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'tier',
        'sort_order',
        'name',
        'slug',
        'thumbnail',
        'description',
        'organizer',
        'start_date',
        'end_date',
        'status',
        'price_per_vote',
        'vote_packages',
        'allow_free_vote',
        'freeze_leaderboard',
        'theme_color',
    ];

    protected static function booted(): void
    {
        static::saving(function (Category $category) {
            if (empty($category->slug) && !empty($category->name)) {
                $base = \Illuminate\Support\Str::slug($category->name);
                $slug = $base;
                $counter = 1;
                while (static::where('slug', $slug)->where('id', '!=', $category->id ?? 0)->exists()) {
                    $slug = "{$base}-{$counter}";
                    $counter++;
                }
                $category->slug = $slug;
            }
        });
    }

    protected function casts(): array
    {
        return [
            'start_date'         => 'date',
            'end_date'           => 'date',
            'price_per_vote'     => 'integer',
            'sort_order'         => 'integer',
            'allow_free_vote'    => 'boolean',
            'freeze_leaderboard' => 'boolean',
            'vote_packages'      => 'array',
        ];
    }

    public function scopeOrdered($query)
    {
        return $query->orderByRaw("CASE 
            WHEN tier = 'premier' THEN 1 
            WHEN tier = 'sekunder' THEN 2 
            WHEN tier = 'tersier' THEN 3 
            ELSE 4 END")
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function finalists(): HasMany
    {
        return $this->hasMany(Finalist::class);
    }

    public function votes(): HasManyThrough
    {
        return $this->hasManyThrough(Vote::class, Finalist::class);
    }
}
