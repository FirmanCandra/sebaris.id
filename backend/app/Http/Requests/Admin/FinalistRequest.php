<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class FinalistRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id'  => ['required', 'integer', 'exists:categories,id'],
            'name'         => ['required', 'string', 'max:255'],
            'photo'        => ['nullable', 'image', 'max:2048'],
            'bio'          => ['nullable', 'string', 'max:500'],
            'social_ig'    => ['nullable', 'string', 'max:100'],
            'description'  => ['nullable', 'string'],
            'extra_photos' => ['nullable'],
            'extra_photos.*'=> ['nullable', 'image', 'max:3072'],
        ];
    }
}
