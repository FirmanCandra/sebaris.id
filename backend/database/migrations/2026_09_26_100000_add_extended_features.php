<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add vote_packages (JSON) to categories
        Schema::table('categories', function (Blueprint $table) {
            $table->json('vote_packages')->nullable()->after('price_per_vote');
        });

        // Add extra_photos (JSON array of paths) to finalists
        Schema::table('finalists', function (Blueprint $table) {
            $table->json('extra_photos')->nullable()->after('photo');
            $table->string('bio')->nullable()->after('description');
            $table->string('social_ig')->nullable()->after('bio');
        });

        // Add role + is_active to admins for multi-admin
        Schema::table('admins', function (Blueprint $table) {
            $table->string('role')->default('operator')->change(); // superadmin | operator
            $table->boolean('is_active')->default(true)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('vote_packages');
        });

        Schema::table('finalists', function (Blueprint $table) {
            $table->dropColumn(['extra_photos', 'bio', 'social_ig']);
        });

        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
