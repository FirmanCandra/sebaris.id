<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\FinalistRequest;
use App\Http\Resources\FinalistResource;
use App\Models\Finalist;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class FinalistController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Finalist::query()->with('category.event')->latest();

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        return FinalistResource::collection($query->get());
    }

    public function store(FinalistRequest $request): FinalistResource
    {
        $data = $request->safe()->except('photo');

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('finalists', 'public');
        }

        $finalist = Finalist::create($data)->load('category');
        Cache::forget("public.finalists.{$finalist->category_id}");
        Cache::forget('public.categories');

        return new FinalistResource($finalist);
    }

    public function show(Finalist $finalist): FinalistResource
    {
        return new FinalistResource($finalist->load('category.event'));
    }

    public function update(FinalistRequest $request, Finalist $finalist): FinalistResource
    {
        $data = $request->safe()->except('photo');

        if ($request->hasFile('photo')) {
            if ($finalist->photo) {
                Storage::disk('public')->delete($finalist->photo);
            }

            $data['photo'] = $request->file('photo')->store('finalists', 'public');
        }

        $finalist->update($data);
        Cache::forget("public.finalists.{$finalist->category_id}");
        Cache::forget('public.categories');

        return new FinalistResource($finalist->fresh()->load('category'));
    }

    public function destroy(Finalist $finalist): Response
    {
        if ($finalist->photo) {
            Storage::disk('public')->delete($finalist->photo);
        }

        $categoryId = $finalist->category_id;
        $finalist->delete();
        Cache::forget("public.finalists.{$categoryId}");
        Cache::forget('public.categories');

        return response()->noContent();
    }
}
