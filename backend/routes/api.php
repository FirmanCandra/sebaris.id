<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BannerController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FinalistController;
use App\Http\Controllers\Admin\AdminManagementController;
use App\Http\Controllers\Admin\VoteAdjustController;
use App\Http\Controllers\PublicBannerController;
use App\Http\Controllers\PublicCategoryController;
use App\Http\Controllers\PublicEventController;
use App\Http\Controllers\PublicFinalistController;
use App\Http\Controllers\UserAuthController;
use App\Http\Controllers\VoteController;
use Illuminate\Support\Facades\Route;

Route::get('banners', [PublicBannerController::class, 'index']);

// Auto Deploy Helper (Run migrations, storage link, and cache clear directly from browser without SSH)
Route::get('deploy-migrate', function (\Illuminate\Http\Request $request) {
    if ($request->query('key') !== 'sebaris-deploy-2026') {
        return response()->json(['error' => 'Akses ditolak'], 403);
    }

    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $migrateOut = \Illuminate\Support\Facades\Artisan::output();

        $storageLinkOut = 'Skipped';
        try {
            \Illuminate\Support\Facades\Artisan::call('storage:link');
            $storageLinkOut = \Illuminate\Support\Facades\Artisan::output();
        } catch (\Throwable $storageErr) {
            $storageLinkOut = 'Notice: ' . $storageErr->getMessage();
        }

        $seedOut = 'Skipped (gunakan &seed=1 jika ingin memuat dummy)';
        if ($request->query('seed') === '1') {
            \Illuminate\Support\Facades\Artisan::call('db:seed', [
                '--class' => 'DummyEventsAndBannersSeeder',
                '--force' => true,
            ]);
            $seedOut = \Illuminate\Support\Facades\Artisan::output();
        }

        \Illuminate\Support\Facades\Artisan::call('optimize:clear');
        $clearOut = \Illuminate\Support\Facades\Artisan::output();

        return response()->json([
            'status' => 'success',
            'message' => 'Backend berhasil diperbarui, migrasi database dan clear cache sukses!',
            'migrate_output' => $migrateOut,
            'storage_link_output' => $storageLinkOut,
            'seed_output' => $seedOut,
            'optimize_output' => $clearOut,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
        ], 500);
    }
});

Route::get('events', [PublicEventController::class, 'index']);
Route::get('categories', [PublicCategoryController::class, 'index']);
Route::get('top-champions', [PublicCategoryController::class, 'topChampions']);
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
        Route::apiResource('events', EventController::class);
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('finalists', FinalistController::class);
        Route::apiResource('banners', BannerController::class);
        // Vote count adjustment
        Route::patch('finalists/{finalist}/adjust-votes', [VoteAdjustController::class, 'adjust']);
        // Multi-admin management
        Route::get('admins', [AdminManagementController::class, 'index']);
        Route::post('admins', [AdminManagementController::class, 'store']);
        Route::put('admins/{admin}', [AdminManagementController::class, 'update']);
        Route::delete('admins/{admin}', [AdminManagementController::class, 'destroy']);
    });
});

