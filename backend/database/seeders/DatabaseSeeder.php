<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => env('SEED_APPLICANT_EMAIL', 'applicant@example.com')],
            [
                'name' => 'サンプル申請者',
                'role' => 'applicant',
                'password' => Hash::make(env('SEED_APPLICANT_PASSWORD', 'password')),
            ],
        );

        User::query()->updateOrCreate(
            ['email' => env('SEED_REVIEWER_EMAIL', 'reviewer@example.com')],
            [
                'name' => 'サンプル審査担当者',
                'role' => 'reviewer',
                'password' => Hash::make(env('SEED_REVIEWER_PASSWORD', 'password')),
            ],
        );
    }
}
