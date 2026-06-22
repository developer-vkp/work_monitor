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

            // Check if user is admin
            $isAdmin = in_array(strtolower($user->role ?? ''), ['admin', 'administrator']);

            $query = Task::with('user:id,name,email,role,department');

            // Optional date range filter (only if explicitly provided)
            if ($request->has('from_date') && $request->has('to_date')) {
                $query->whereBetween('task_date', [
                    $request->input('from_date'),
                    $request->input('to_date')
                ]);
            }

            // Optional priority filter
            if ($request->has('priority') && $request->input('priority') !== 'all') {
                $query->where('priority', $request->input('priority'));
            }

            // Optional status filter
            if ($request->has('status') && $request->input('status') !== 'all') {
                $statusFilter = $request->input('status');
                if ($statusFilter === 'Done') {
                    $query->where('status', 'Done');
                } elseif ($statusFilter === 'Pending') {
                    $query->whereNull('action')->where('status', '!=', 'Done');
                } elseif ($statusFilter === 'Approved') {
                    $query->where('action', 'Approved');
                } elseif ($statusFilter === 'Rejected') {
                    $query->where('action', 'Rejected');
                }
            }

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
     * Create a new task
     */
    public function create(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staffId' => 'required|exists:users,id',
            'n' => 'required|integer',
            'desc' => 'required|string',
            'date' => 'required|date',
            'status' => 'nullable|string',
            'action' => 'nullable|string',
            'priority' => 'nullable|string',
            'remarks' => 'nullable|string',
            'adminRem' => 'nullable|string',
            'staffRem' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = auth()->user();
            $isAdmin = in_array(strtolower($user->role ?? ''), ['admin', 'administrator']);

            // Authorization: Users can only create their own tasks, admins can create for anyone
            if (!$isAdmin && $request->staffId != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to create task for another user',
                ], 403);
            }

            $task = Task::create([
                'user_id' => $request->staffId,
                'task_number' => $request->n,
                'description' => $request->desc,
                'task_date' => $request->date,
                'status' => $request->status ?? 'Pending',
                'action' => $request->action ?? null,
                'priority' => $request->priority ?? 'Medium',
                'remarks' => $request->remarks ?? null,
                'admin_remarks' => $request->adminRem ?? null,
                'staff_remarks' => $request->staffRem ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Task created successfully',
                'data' => [
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
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create task: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an existing task
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'staffId' => 'nullable|exists:users,id',
            'n' => 'nullable|integer',
            'desc' => 'nullable|string',
            'date' => 'nullable|date',
            'status' => 'nullable|string',
            'action' => 'nullable|string',
            'priority' => 'nullable|string',
            'remarks' => 'nullable|string',
            'adminRem' => 'nullable|string',
            'staffRem' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $task = Task::find($id);

            if (!$task) {
                return response()->json([
                    'success' => false,
                    'message' => 'Task not found',
                ], 404);
            }

            $user = auth()->user();
            $isAdmin = in_array(strtolower($user->role ?? ''), ['admin', 'administrator']);

            // Authorization: Users can only edit their own pending tasks, admins can edit any task
            if (!$isAdmin) {
                if ($task->user_id != $user->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized to edit this task',
                    ], 403);
                }

                // Users cannot edit approved/rejected tasks
                if ($task->action && in_array($task->action, ['Approved', 'Rejected'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot edit task that has been ' . strtolower($task->action),
                    ], 403);
                }
            }

            // Update only provided fields
            $updateData = [];
            if ($request->has('staffId')) $updateData['user_id'] = $request->staffId;
            if ($request->has('n')) $updateData['task_number'] = $request->n;
            if ($request->has('desc')) $updateData['description'] = $request->desc;
            if ($request->has('date')) $updateData['task_date'] = $request->date;
            if ($request->has('status')) $updateData['status'] = $request->status;
            if ($request->has('action')) $updateData['action'] = $request->action;
            if ($request->has('priority')) $updateData['priority'] = $request->priority;
            if ($request->has('remarks')) $updateData['remarks'] = $request->remarks;
            if ($request->has('adminRem')) $updateData['admin_remarks'] = $request->adminRem;
            if ($request->has('staffRem')) $updateData['staff_remarks'] = $request->staffRem;

            $task->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Task updated successfully',
                'data' => [
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
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update task: ' . $e->getMessage(),
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

            $user = auth()->user();
            $isAdmin = in_array(strtolower($user->role ?? ''), ['admin', 'administrator']);

            // Authorization: Only admin or task owner can delete
            if (!$isAdmin && $task->user_id != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to delete this task',
                ], 403);
            }

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
