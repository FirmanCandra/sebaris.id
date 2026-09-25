<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\EventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class EventController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return EventResource::collection(Event::query()->withCount('categories')->latest()->get());
    }

    public function store(EventRequest $request): EventResource
    {
        return new EventResource(Event::create($request->validated()));
    }

    public function show(Event $event): EventResource
    {
        return new EventResource($event->loadCount('categories'));
    }

    public function update(EventRequest $request, Event $event): EventResource
    {
        $event->update($request->validated());

        return new EventResource($event->fresh()->loadCount('categories'));
    }

    public function destroy(Event $event): Response
    {
        $event->delete();

        return response()->noContent();
    }
}
