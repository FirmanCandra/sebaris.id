<?php

namespace App\Http\Controllers;

use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicEventController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return EventResource::collection(
            Event::query()
                ->withCount('categories')
                ->with(['categories' => function ($query) {
                    $query->ordered()->withCount('finalists');
                }])
                ->orderBy('start_date')
                ->get(),
        );
    }
}
