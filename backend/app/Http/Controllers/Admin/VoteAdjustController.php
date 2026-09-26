<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\FinalistResource;
use App\Models\Finalist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class VoteAdjustController extends Controller
{
    /**
     * Reset atau adjust vote count finalis secara manual.
     * PATCH /admin/finalists/{finalist}/adjust-votes
     */
    public function adjust(Request $request, Finalist $finalist): JsonResponse
    {
        $validated = $request->validate([
            'vote_count' => ['required', 'integer', 'min:0'],
            'reason'     => ['nullable', 'string', 'max:255'],
        ]);

        $oldCount = $finalist->vote_count;
        $finalist->update(['vote_count' => $validated['vote_count']]);

        Cache::forget("public.finalists.{$finalist->category_id}");

        return response()->json([
            'message'    => "Vote count diperbarui: {$oldCount} → {$validated['vote_count']}",
            'data'       => new FinalistResource($finalist->fresh(['category'])),
        ]);
    }
}
