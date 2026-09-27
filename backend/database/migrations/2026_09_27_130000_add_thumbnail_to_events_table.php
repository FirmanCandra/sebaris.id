<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('thumbnail')->nullable()->after('name');
        });

        try {
            $categories = \Illuminate\Support\Facades\DB::table('categories')
                ->whereNotNull('thumbnail')
                ->whereNotNull('event_id')
                ->get();

            foreach ($categories as $cat) {
                \Illuminate\Support\Facades\DB::table('events')
                    ->where('id', $cat->event_id)
                    ->whereNull('thumbnail')
                    ->update(['thumbnail' => $cat->thumbnail]);
            }
        } catch (\Throwable $e) {
            // Silently continue
        }
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('thumbnail');
        });
    }
};
