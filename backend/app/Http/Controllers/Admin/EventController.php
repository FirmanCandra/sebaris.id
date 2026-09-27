<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\EventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Services\ImageOptimizer;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class EventController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return EventResource::collection(Event::query()->withCount('categories')->latest()->get());
    }

    public function store(EventRequest $request): EventResource
    {
        $data = $request->validated();
        if (empty($data['status'])) {
            $data['status'] = 'active';
        }

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = ImageOptimizer::storeOptimized($request->file('thumbnail'), 'events', 1000, 78);
        }

        return new EventResource(Event::create($data));
    }

    public function show(Event $event): EventResource
    {
        return new EventResource(
            $event->load([
                'categories' => function ($q) {
                    $q->ordered()->withCount('finalists');
                },
            ])->loadCount('categories')
        );
    }

    public function update(EventRequest $request, Event $event): EventResource
    {
        $data = $request->validated();

        if ($request->hasFile('thumbnail')) {
            if ($event->thumbnail) {
                Storage::disk('public')->delete($event->thumbnail);
            }
            $data['thumbnail'] = ImageOptimizer::storeOptimized($request->file('thumbnail'), 'events', 1000, 78);
        }

        $event->update($data);

        return new EventResource($event->fresh()->loadCount('categories'));
    }

    public function destroy(Event $event): Response
    {
        if ($event->thumbnail) {
            Storage::disk('public')->delete($event->thumbnail);
        }

        $event->delete();

        return response()->noContent();
    }
}
