<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateFreeVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'finalist_id' => ['required', 'integer', 'exists:finalists,id'],
            'voter_name' => ['required', 'string', 'max:255'],
            'voter_contact' => ['required', 'string', 'min:6', 'max:255'],
            'type' => ['required', 'in:free'],
        ];
    }
}
