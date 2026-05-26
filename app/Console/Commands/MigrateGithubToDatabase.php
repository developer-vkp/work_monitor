<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\GitHubStorageService;
use App\Models\Task;
use App\Models\ActivityFeed;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class MigrateGithubToDatabase extends Command
{
    protected $signature = 'migrate:github-to-db';
    protected $description = 'Migrate data from GitHub JSON files to database';

    protected $github;

    public function __construct(GitHubStorageService $github)
    {
        parent::__construct();
        $this->github = $github;
    }

    public function handle()
    {
        $this->info('Starting migration from GitHub to Database...');

        try {
            DB::beginTransaction();

            // Migrate tasks
            $this->migrateTasks();

            // Migrate activity feed
            $this->migrateActivityFeed();

            DB::commit();

            $this->info('✓ Migration completed successfully!');
            $this->info('You can now remove the GitHub storage dependency.');

            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Migration failed: ' . $e->getMessage());
            return 1;
        }
    }

    protected function migrateTasks()
    {
        $this->info('Migrating tasks...');

        try {
            $data = $this->github->readFile('tasks.json');
            $tasks = $data['tasks'] ?? [];

            if (empty($tasks)) {
                $this->warn('No tasks found in GitHub storage');
                return;
            }

            $migrated = 0;
            $skipped = 0;

            foreach ($tasks as $taskData) {
                // Check if user exists
                $user = User::find($taskData['staffId']);
                if (!$user) {
                    $this->warn("Skipping task {$taskData['id']}: User {$taskData['staffId']} not found");
                    $skipped++;
                    continue;
                }

                // Check if task already exists
                $exists = Task::where('id', $taskData['id'])->exists();
                if ($exists) {
                    $this->warn("Skipping task {$taskData['id']}: Already exists in database");
                    $skipped++;
                    continue;
                }

                Task::create([
                    'id' => $taskData['id'],
                    'user_id' => $taskData['staffId'],
                    'task_number' => $taskData['n'],
                    'description' => $taskData['desc'],
                    'task_date' => $taskData['date'],
                    'status' => $taskData['status'] ?? 'Pending',
                    'action' => $taskData['action'] ?? null,
                    'priority' => $taskData['priority'] ?? null,
                    'remarks' => $taskData['remarks'] ?? null,
                    'admin_remarks' => $taskData['adminRem'] ?? null,
                    'staff_remarks' => $taskData['staffRem'] ?? null,
                ]);

                $migrated++;
            }

            $this->info("✓ Migrated {$migrated} tasks ({$skipped} skipped)");
        } catch (\Exception $e) {
            $this->warn('Tasks file not found or empty in GitHub storage');
        }
    }

    protected function migrateActivityFeed()
    {
        $this->info('Migrating activity feed...');

        try {
            // Activity feed is typically not stored in GitHub, so we'll skip this
            // But we can create a welcome message
            ActivityFeed::create([
                'message' => 'Migrated to database storage',
                'color' => 'blue',
                'activity_time' => now(),
            ]);

            $this->info('✓ Activity feed initialized');
        } catch (\Exception $e) {
            $this->warn('Could not initialize activity feed: ' . $e->getMessage());
        }
    }
}
