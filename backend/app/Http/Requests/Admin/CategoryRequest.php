<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'thumbnail' => ['nullable', 'image', 'max:2048'],
            'description' => ['nullable', 'string'],
            'organizer' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:active,inactive'],
            'event_id' => ['nullable', 'integer'],
        ];
    }
}
