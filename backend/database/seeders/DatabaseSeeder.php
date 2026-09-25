<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Admin::query()->firstOrCreate(
            ['email' => 'admin@sebaris.test'],
            [
                'name' => 'Admin Sebaris',
                'password' => 'password',
                'role' => 'admin',
            ],
        );
    }
}
