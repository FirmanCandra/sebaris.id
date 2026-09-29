<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Automatically seed dummy events, categories, and finalists on migration
        Artisan::call('db:seed', [
            '--class' => 'DummyEventsAndBannersSeeder',
            '--force' => true,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No action needed on rollback
    }
};
