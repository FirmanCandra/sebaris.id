<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->foreignId('event_id')->nullable()->change();
            $table->string('thumbnail')->nullable()->after('name');
            $table->text('description')->nullable()->after('thumbnail');
            $table->string('organizer')->nullable()->after('description');
            $table->date('start_date')->nullable()->after('organizer');
            $table->date('end_date')->nullable()->after('start_date');
            $table->string('status')->default('active')->after('end_date');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['thumbnail', 'description', 'organizer', 'start_date', 'end_date', 'status']);
        });
    }
};
