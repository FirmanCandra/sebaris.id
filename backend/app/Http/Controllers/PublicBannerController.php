<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use Illuminate\Http\JsonResponse;

class PublicBannerController extends Controller
{
    public function index(): JsonResponse
    {
        $banners = Banner::active()->get();

        return response()->json([
            'data' => $banners,
        ]);
    }
}
