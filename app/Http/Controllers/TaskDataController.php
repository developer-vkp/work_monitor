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
     * Get all tasks data with filters
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();

            // Default date range: yesterday and today only
            $fromDate = $request->input('from_date', now()->subDay()->format('Y-m-d'));
            $toDate = $request->input('to_date', now()->format('Y-m-d'));

            // Check if user is admin
            $isAdmin = in_array(strtolower($user->role ?? ''), ['admin', 'administrator']);

            // Debug: Check total tasks in database for this user
            $totalTasksForUser = Task::where('user_id', $user->id)->count();
            $allTaskDates = Task::where('user_id', $user->id)
                ->pluck('task_date')
                ->map(function($date) {
                    return $date->format('Y-m-d');
                })
                ->unique()
                ->values();

            \Log::info('Tasks API Debug', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_role' => $user->role,
                'is_admin' => $isAdmin,
                'server_time' => now()->format('Y-m-d H:i:s'),
                'filter_from' => $fromDate,
                'filter_to' => $toDate,
                'total_tasks_for_user' => $totalTasksForUser,
                'all_task_dates_for_user' => $allTaskDates,
            ]);

            $query = Task::with('user:id,name,email,role,department')
                ->whereBetween('task_date', [$fromDate, $toDate]);

            // If user is not admin, only show their own tasks
            // If admin, show all tasks (or filter by user_id if provided)
            if (!$isAdmin) {
                $query->where('user_id', $user->id);
            } elseif ($request->has('user_id')) {
                $query->where('user_id', $request->input('user_id'));
            }

            $tasks = $query->orderBy('task_date', 'desc')
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

            \Log::info('Tasks API Result', [
                'filtered_tasks' => $tasks->count(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $tasks,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch tasks', ['error' => $e->getMessage()]);
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

            // No deletion logic here - tasks are only deleted via dedicated DELETE endpoint

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

    /**
     * Debug endpoint - Get ALL tasks without filters (temporary)
     */
    public function debug()
    {
        try {
            $user = auth()->user();

            $allTasks = Task::with('user:id,name,email,role,department')
                ->orderBy('task_date', 'desc')
                ->orderBy('task_number', 'asc')
                ->get()
                ->map(function ($task) {
                    return [
                        'id' => $task->id,
                        'staffId' => $task->user_id,
                        'staffName' => $task->user->name ?? 'N/A',
                        'n' => $task->task_number,
                        'desc' => $task->description,
                        'date' => $task->task_date->format('Y-m-d'),
                        'status' => $task->status,
                        'created_at' => $task->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Debug endpoint - showing ALL tasks',
                'server_time' => now()->format('Y-m-d H:i:s'),
                'logged_in_user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                ],
                'total_tasks' => $allTasks->count(),
                'data' => $allTasks,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a specific task
     */
    public function destroy($id)
    {
        try {
            $task = Task::find($id);

            if (!$task) {
                return response()->json([
                    'success' => false,
                    'message' => 'Task not found',
                ], 404);
            }

            // Optional: Add authorization check here
            // For example, only allow admin or task owner to delete
            // if (Auth::id() !== $task->user_id && !Auth::user()->isAdmin) {
            //     return response()->json([
            //         'success' => false,
            //         'message' => 'Unauthorized to delete this task',
            //     ], 403);
            // }

            $task->delete();

            return response()->json([
                'success' => true,
                'message' => 'Task deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete task: ' . $e->getMessage(),
            ], 500);
        }
    }
}
