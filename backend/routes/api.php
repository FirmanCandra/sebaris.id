<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FinalistController;
use App\Http\Controllers\Admin\AdminManagementController;
use App\Http\Controllers\Admin\VoteAdjustController;
use App\Http\Controllers\PublicCategoryController;
use App\Http\Controllers\PublicFinalistController;
use App\Http\Controllers\UserAuthController;
use App\Http\Controllers\VoteController;
use Illuminate\Support\Facades\Route;

Route::get('categories', [PublicCategoryController::class, 'index']);
Route::get('categories/{category}', [PublicCategoryController::class, 'show']);
Route::get('categories/{category}/finalists', [PublicFinalistController::class, 'index']);
Route::get('categories/{category}/leaderboard', [PublicFinalistController::class, 'leaderboard']);
Route::get('categories/{category}/messages', [VoteController::class, 'messages']);

// Voting endpoints (slug/id aliases)
Route::get('voting/{category}', [PublicCategoryController::class, 'show']);
Route::get('voting/{category}/finalists', [PublicFinalistController::class, 'index']);
Route::get('voting/{category}/leaderboard', [PublicFinalistController::class, 'leaderboard']);
Route::get('voting/{category}/messages', [VoteController::class, 'messages']);

// Votes, Payments, Check, and Verification
Route::post('votes', [VoteController::class, 'store'])->middleware('throttle:30,1');
Route::post('votes/{referenceId}/simulate-pay', [VoteController::class, 'simulatePay']);
Route::get('votes/{referenceId}/status', [VoteController::class, 'checkStatus']);
Route::get('votes/check', [VoteController::class, 'checkVotes']);

// Unified Global Authentication (Email & Password, Registration, Google OAuth)
Route::prefix('auth')->group(function () {
    Route::post('login', [UserAuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('register', [UserAuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('google-login', [UserAuthController::class, 'googleLogin'])->middleware('throttle:10,1');
});

Route::middleware('auth:sanctum')->prefix('user')->group(function () {
    Route::get('me', [UserAuthController::class, 'me']);
    Route::get('votes', [UserAuthController::class, 'myVotes']);
    Route::post('logout', [UserAuthController::class, 'logout']);
});

Route::prefix('admin')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('google-login', [AuthController::class, 'googleLogin'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('dashboard', [DashboardController::class, 'index']);
        Route::post('categories/{category}/freeze', [CategoryController::class, 'toggleFreeze']);
        Route::get('categories/{category}/export', [VoteController::class, 'exportCsv']);
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('finalists', FinalistController::class);
        // Vote count adjustment
        Route::patch('finalists/{finalist}/adjust-votes', [VoteAdjustController::class, 'adjust']);
        // Multi-admin management
        Route::get('admins', [AdminManagementController::class, 'index']);
        Route::post('admins', [AdminManagementController::class, 'store']);
        Route::put('admins/{admin}', [AdminManagementController::class, 'update']);
        Route::delete('admins/{admin}', [AdminManagementController::class, 'destroy']);
    });
});

