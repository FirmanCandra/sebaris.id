<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('finalist_id')->constrained()->restrictOnDelete();
            $table->string('voter_name');
            $table->string('voter_contact');
            $table->unsignedInteger('vote_amount');
            $table->string('type');
            $table->string('status');
            $table->timestamps();

            $table->index(['voter_contact', 'type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};
