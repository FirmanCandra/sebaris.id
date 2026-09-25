<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\FinalistController;
use App\Http\Controllers\PublicCategoryController;
use App\Http\Controllers\PublicFinalistController;
use App\Http\Controllers\VoteController;
use Illuminate\Support\Facades\Route;

Route::get('categories', [PublicCategoryController::class, 'index']);
Route::get('categories/{category}', [PublicCategoryController::class, 'show']);
Route::get('categories/{category}/finalists', [PublicFinalistController::class, 'index']);
Route::get('categories/{category}/leaderboard', [PublicFinalistController::class, 'leaderboard']);

// Voting endpoints (slug/id aliases)
Route::get('voting/{category}', [PublicCategoryController::class, 'show']);
Route::get('voting/{category}/finalists', [PublicFinalistController::class, 'index']);
Route::get('voting/{category}/leaderboard', [PublicFinalistController::class, 'leaderboard']);
Route::post('votes', [VoteController::class, 'store'])->middleware('throttle:5,1');

Route::prefix('admin')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('google-login', [AuthController::class, 'googleLogin'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('finalists', FinalistController::class);
    });
});
