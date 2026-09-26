<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedInteger('price_per_vote')->default(1000)->after('status');
            $table->boolean('allow_free_vote')->default(true)->after('price_per_vote');
            $table->boolean('freeze_leaderboard')->default(false)->after('allow_free_vote');
        });

        Schema::table('votes', function (Blueprint $table) {
            $table->string('reference_id')->nullable()->unique()->after('id');
            $table->string('payment_method')->nullable()->after('type');
            $table->unsignedInteger('total_price')->default(0)->after('vote_amount');
            $table->timestamp('paid_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['price_per_vote', 'allow_free_vote', 'freeze_leaderboard']);
        });

        Schema::table('votes', function (Blueprint $table) {
            $table->dropColumn(['reference_id', 'payment_method', 'total_price', 'paid_at']);
        });
    }
};
