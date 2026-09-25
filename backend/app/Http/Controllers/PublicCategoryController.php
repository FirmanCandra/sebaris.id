<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Models\Event;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicCategoryController extends Controller
{
    public function index(Event $event): AnonymousResourceCollection
    {
        abort_unless($event->status === 'active', 404);

        return CategoryResource::collection(
            $event->categories()->withCount('finalists')->orderBy('name')->get(),
        );
    }
}
