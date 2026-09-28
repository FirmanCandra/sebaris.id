<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\EventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Services\ImageOptimizer;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class EventController extends Controller
{
    private function ensureThumbnailColumnExists(): void
    {
        if (!Schema::hasColumn('events', 'thumbnail')) {
            try {
                Schema::table('events', function ($table) {
                    $table->string('thumbnail')->nullable()->after('name');
                });
            } catch (\Throwable) {
                // Column might have been added concurrently
            }

            try {
                $categories = DB::table('categories')
                    ->whereNotNull('thumbnail')
                    ->whereNotNull('event_id')
                    ->get();

                foreach ($categories as $cat) {
                    DB::table('events')
                        ->where('id', $cat->event_id)
                        ->whereNull('thumbnail')
                        ->update(['thumbnail' => $cat->thumbnail]);
                }
            } catch (\Throwable) {
                // Silently ignore backfill errors
            }
        }

        if (!Schema::hasColumn('events', 'theme_color')) {
            try {
                Schema::table('events', function ($table) {
                    $table->string('theme_color', 50)->nullable()->after('status');
                });
            } catch (\Throwable) {
            }
        }
    }

    public function index(): AnonymousResourceCollection
    {
        $this->ensureThumbnailColumnExists();

        return EventResource::collection(
            Event::query()
                ->withCount('categories')
                ->with(['categories' => function ($q) {
                    $q->ordered();
                }])
                ->latest()
                ->get()
        );
    }

    public function store(EventRequest $request): EventResource
    {
        $this->ensureThumbnailColumnExists();

        $data = $request->safe()->except('thumbnail');
        if (empty($data['status'])) {
            $data['status'] = 'active';
        }

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = ImageOptimizer::storeOptimized($request->file('thumbnail'), 'events', 1000, 78);
        }

        $event = Event::create($data);

        return new EventResource($event->load(['categories']));
    }

    public function show(Event $event): EventResource
    {
        $this->ensureThumbnailColumnExists();

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
        $this->ensureThumbnailColumnExists();

        $data = $request->safe()->except('thumbnail');

        if ($request->hasFile('thumbnail')) {
            if ($event->thumbnail) {
                Storage::disk('public')->delete($event->thumbnail);
            }
            $data['thumbnail'] = ImageOptimizer::storeOptimized($request->file('thumbnail'), 'events', 1000, 78);
        }

        $event->update($data);

        return new EventResource($event->fresh()->loadCount('categories')->load(['categories']));
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
