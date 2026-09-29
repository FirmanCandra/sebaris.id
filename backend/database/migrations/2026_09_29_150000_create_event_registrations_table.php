<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('registration_number')->unique();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('organization_name');
            $table->string('pic_name');
            $table->string('pic_email');
            $table->string('pic_phone', 50);
            $table->string('event_name');
            $table->text('event_description')->nullable();
            $table->json('category_names')->nullable();
            $table->string('estimated_finalists', 50)->nullable();
            $table->string('voting_type', 30)->default('hybrid'); // free, paid, hybrid
            $table->date('target_start_date')->nullable();
            $table->date('target_end_date')->nullable();
            $table->json('addons')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 30)->default('pending'); // pending, in_review, approved, rejected
            $table->text('admin_notes')->nullable();
            $table->unsignedBigInteger('created_event_id')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_registrations');
    }
};
