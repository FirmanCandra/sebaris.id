<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('categories') && !Schema::hasColumn('categories', 'theme_color')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->string('theme_color', 50)->nullable()->after('thumbnail');
            });
        }

        if (Schema::hasTable('events') && !Schema::hasColumn('events', 'theme_color')) {
            Schema::table('events', function (Blueprint $table) {
                $table->string('theme_color', 50)->nullable()->after('thumbnail');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('categories') && Schema::hasColumn('categories', 'theme_color')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropColumn('theme_color');
            });
        }

        if (Schema::hasTable('events') && Schema::hasColumn('events', 'theme_color')) {
            Schema::table('events', function (Blueprint $table) {
                $table->dropColumn('theme_color');
            });
        }
    }
};
