<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\ActivityFeed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TaskDataController extends Controller
{
    /**
     * Get all tasks data
     */
    public function index()
    {
        try {
            $tasks = Task::with('user:id,name,email,role,department')
                ->orderBy('task_date', 'desc')
                ->orderBy('task_number', 'asc')
                ->get()
                ->map(function ($task) {
                    return [
                        'id' => $task->id,
                        'staffId' => $task->user_id,
                        'n' => $task->task_number,
                        'desc' => $task->description,
                        'date' => $task->task_date->format('Y-m-d'),
                        'status' => $task->status,
                        'action' => $task->action,
                        'priority' => $task->priority,
                        'remarks' => $task->remarks,
                        'adminRem' => $task->admin_remarks,
                        'staffRem' => $task->staff_remarks,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $tasks,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch tasks: ' . $e->getMessage(),
                'data' => [],
            ], 500);
        }
    }

    /**
     * Save complete tasks data
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tasks' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Get all task IDs from the request
            $taskIds = collect($request->tasks)->pluck('id')->filter();

            // Get unique user IDs and dates from the request to scope deletion
            $userIds = collect($request->tasks)->pluck('staffId')->unique();
            $dates = collect($request->tasks)->pluck('date')->unique();

            // Delete tasks that are not in the request (they were deleted in the frontend)
            // but ONLY for the specific users and dates being saved
            if ($taskIds->isNotEmpty() && $userIds->isNotEmpty() && $dates->isNotEmpty()) {
                Task::whereIn('user_id', $userIds)
                    ->whereIn('task_date', $dates)
                    ->whereNotIn('id', $taskIds)
                    ->delete();
            }

            // Upsert all tasks
            foreach ($request->tasks as $taskData) {
                $data = [
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
                ];

                if (isset($taskData['id'])) {
                    // Check if task exists in database
                    $existingTask = Task::find($taskData['id']);

                    if ($existingTask) {
                        // Update existing task
                        $existingTask->update($data);
                    } else {
                        // Task has client-side ID but doesn't exist in DB, create new
                        Task::create($data);
                    }
                } else {
                    // Create new task
                    Task::create($data);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tasks saved successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to save tasks: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get activity feed
     */
    public function getActivityFeed()
    {
        try {
            $feed = ActivityFeed::orderBy('created_at', 'desc')
                ->limit(50)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'msg' => $item->message,
                        'col' => $item->color,
                        'time' => $item->activity_time->format('H:i'),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $feed,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch activity feed',
                'data' => [],
            ], 500);
        }
    }

    /**
     * Add activity feed item
     */
    public function addActivityFeed(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string',
            'color' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
            ], 422);
        }

        try {
            $feed = ActivityFeed::create([
                'message' => $request->message,
                'color' => $request->color,
                'activity_time' => now(),
            ]);

            // Keep only last 50 items
            $count = ActivityFeed::count();
            if ($count > 50) {
                ActivityFeed::orderBy('created_at', 'asc')
                    ->limit($count - 50)
                    ->delete();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $feed->id,
                    'msg' => $feed->message,
                    'col' => $feed->color,
                    'time' => $feed->activity_time->format('H:i'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add activity feed',
            ], 500);
        }
    }
}
