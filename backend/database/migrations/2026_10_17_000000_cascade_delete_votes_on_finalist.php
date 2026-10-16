<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('votes', function (Blueprint $table) {
                $table->dropForeign(['finalist_id']);
                $table->foreign('finalist_id')
                    ->references('id')
                    ->on('finalists')
                    ->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('votes', function (Blueprint $table) {
                $table->dropForeign(['finalist_id']);
                $table->foreign('finalist_id')
                    ->references('id')
                    ->on('finalists')
                    ->restrictOnDelete();
            });
        }
    }
};
