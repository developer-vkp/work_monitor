<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\GitHubStorageService;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class MigrateUsersFromGithub extends Command
{
    protected $signature = 'migrate:users-from-github';
    protected $description = 'Migrate users from GitHub JSON to database';

    protected $github;

    public function __construct(GitHubStorageService $github)
    {
        parent::__construct();
        $this->github = $github;
    }

    public function handle()
    {
        $this->info('Starting migration of users from GitHub to Database...');

        try {
            // Read users from GitHub
            $data = $this->github->readFile('users.json');
            $githubUsers = $data['users'] ?? [];

            if (empty($githubUsers)) {
                $this->warn('No users found in GitHub storage');
                return 1;
            }

            $this->info('Found ' . count($githubUsers) . ' users in GitHub storage');

            DB::beginTransaction();

            $migrated = 0;
            $skipped = 0;

            foreach ($githubUsers as $userData) {
                // Check if user already exists by email
                $exists = User::where('email', $userData['email'])->exists();

                if ($exists) {
                    $this->warn("Skipping user {$userData['email']}: Already exists in database");
                    $skipped++;
                    continue;
                }

                // Create user in database
                User::create([
                    'name' => $userData['name'],
                    'email' => $userData['email'],
                    'role' => $userData['role'] ?? 'user',
                    'department' => $userData['department'] ?? '',
                    'password' => $userData['password'], // Already hashed
                ]);

                $this->info("✓ Migrated: {$userData['name']} ({$userData['email']})");
                $migrated++;
            }

            DB::commit();

            $this->info('');
            $this->info('═══════════════════════════════════════');
            $this->info("✓ Migration completed successfully!");
            $this->info("  Migrated: {$migrated} users");
            $this->info("  Skipped: {$skipped} users");
            $this->info('═══════════════════════════════════════');
            $this->info('');
            $this->info('Next steps:');
            $this->info('1. Clear browser cache (Ctrl+Shift+R)');
            $this->info('2. Clear localStorage: Open DevTools > Application > Local Storage > Clear');
            $this->info('3. Reload the application');

            return 0;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Migration failed: ' . $e->getMessage());
            return 1;
        }
    }
}
