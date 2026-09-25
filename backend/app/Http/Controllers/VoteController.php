<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateFreeVoteRequest;
use App\Http\Resources\VoteResource;
use App\Models\Category;
use App\Models\Finalist;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VoteController extends Controller
{
    public function store(CreateFreeVoteRequest $request): JsonResponse
    {
        $vote = DB::transaction(function () use ($request) {
            $requestedFinalist = Finalist::query()
                ->with('category')
                ->findOrFail($request->integer('finalist_id'));

            $category = Category::query()
                ->lockForUpdate()
                ->findOrFail($requestedFinalist->category_id);

            $finalist = Finalist::query()
                ->lockForUpdate()
                ->findOrFail($requestedFinalist->id);

            if (($category->status ?? 'active') !== 'active') {
                throw ValidationException::withMessages([
                    'finalist_id' => 'Voting untuk kategori ini belum aktif.',
                ]);
            }

            $alreadyVoted = Vote::query()
                ->where('voter_contact', $request->string('voter_contact')->trim()->lower()->toString())
                ->where('type', 'free')
                ->where('status', 'confirmed')
                ->whereHas('finalist', fn ($query) => $query->where('category_id', $category->id))
                ->exists();

            if ($alreadyVoted) {
                throw ValidationException::withMessages([
                    'voter_contact' => 'Kontak ini sudah memakai vote gratis di kategori tersebut.',
                ]);
            }

            $vote = Vote::create([
                'finalist_id' => $finalist->id,
                'voter_name' => $request->string('voter_name')->trim()->toString(),
                'voter_contact' => $request->string('voter_contact')->trim()->lower()->toString(),
                'vote_amount' => 1,
                'type' => 'free',
                'status' => 'confirmed',
            ]);

            $finalist->increment('vote_count');

            return $vote;
        });

        return (new VoteResource($vote))
            ->response()
            ->setStatusCode(201);
    }
}
