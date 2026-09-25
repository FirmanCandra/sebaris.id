<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\FinalistRequest;
use App\Http\Resources\FinalistResource;
use App\Models\Finalist;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
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

        return new FinalistResource(Finalist::create($data)->load('category.event'));
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

        return new FinalistResource($finalist->fresh()->load('category.event'));
    }

    public function destroy(Finalist $finalist): Response
    {
        if ($finalist->photo) {
            Storage::disk('public')->delete($finalist->photo);
        }

        $finalist->delete();

        return response()->noContent();
    }
}
