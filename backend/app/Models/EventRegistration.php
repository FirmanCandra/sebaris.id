<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_number',
        'user_id',
        'organization_name',
        'pic_name',
        'pic_email',
        'pic_phone',
        'event_name',
        'event_description',
        'category_names',
        'estimated_finalists',
        'voting_type',
        'target_start_date',
        'target_end_date',
        'addons',
        'notes',
        'status',
        'admin_notes',
        'created_event_id',
    ];

    protected function casts(): array
    {
        return [
            'category_names' => 'array',
            'addons' => 'array',
            'target_start_date' => 'date',
            'target_end_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function createdEvent(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'created_event_id');
    }
}
