<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateVoteRequest extends FormRequest
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
            'voter_contact' => ['required', 'string', 'min:4', 'max:255'],
            'type' => ['required', 'in:free,paid'],
            'message' => ['nullable', 'string', 'max:500'],
            'is_anonymous' => ['nullable', 'boolean'],
            'vote_amount' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'payment_method' => ['nullable', 'string', 'in:qris,bca_va,bri_va,mandiri_va,gopay,free'],
        ];
    }

    public function messages(): array
    {
        return [
            'finalist_id.required' => 'Pilih kandidat finalis terlebih dahulu.',
            'voter_name.required' => 'Nama lengkap pemilih wajib diisi.',
            'voter_contact.required' => 'Nomor WhatsApp atau Email wajib diisi.',
            'type.in' => 'Tipe vote tidak valid.',
        ];
    }
}
