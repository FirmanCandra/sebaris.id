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
        'name',
        'slug',
        'thumbnail',
        'description',
        'organizer',
        'start_date',
        'end_date',
        'status',
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
            'start_date' => 'date',
            'end_date' => 'date',
        ];
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
