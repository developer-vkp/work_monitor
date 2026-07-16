<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use App\Models\ActivityFeed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

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

    /**
     * Export task attendance report to Excel format with date-wise breakdown
     */
    public function exportTaskAttendance(Request $request)
    {
        try {
            $user = auth()->user();
            $isAdmin = in_array(strtolower($user->role ?? ''), ['admin', 'administrator']);

            // Only admins can access this report
            if (!$isAdmin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            // Get date range from request
            $fromDate = $request->input('from_date');
            $toDate = $request->input('to_date');

            // Generate array of dates between from and to
            $dates = [];
            if ($fromDate && $toDate) {
                $currentDate = new \DateTime($fromDate);
                $endDate = new \DateTime($toDate);
                while ($currentDate <= $endDate) {
                    $dates[] = $currentDate->format('Y-m-d');
                    $currentDate->modify('+1 day');
                }
            }

            // Create new Spreadsheet
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Task Attendance');

            // Build header row with user info columns + date columns
            $headers = [
                'S.No',
                'Staff ID',
                'Staff Name',
                'Email',
                'Role/Designation',
                'Department',
            ];

            // Add date headers
            foreach ($dates as $date) {
                $headers[] = date('d-M-Y', strtotime($date));
            }

            // Add summary columns
            $headers[] = 'Total Tasks';
            $headers[] = 'Total Days Updated';
            $headers[] = 'Total Days Not Updated';
            $headers[] = 'Attendance %';

            $sheet->fromArray($headers, null, 'A1');

            // Style header row
            $headerStyle = [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 11,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '3B82F6'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
            ];

            $lastColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($headers));
            $sheet->getStyle('A1:' . $lastColumn . '1')->applyFromArray($headerStyle);

            // Get all users
            $users = User::orderBy('name', 'asc')->get();

            $rowIndex = 2;
            $serialNo = 1;

            foreach ($users as $staffUser) {
                // Build row data starting with user info
                $rowData = [
                    $serialNo,
                    $staffUser->id,
                    $staffUser->name,
                    $staffUser->email,
                    $staffUser->role ?? 'User',
                    $staffUser->department ?? 'N/A',
                ];

                $daysUpdated = 0;
                $daysNotUpdated = 0;
                $totalTasksCount = 0;

                // For each date, check if user has tasks
                $dateColumnIndex = 7; // Starting column for dates (G = 7)
                foreach ($dates as $date) {
                    $taskCount = Task::where('user_id', $staffUser->id)
                        ->whereDate('task_date', $date)
                        ->count();

                    $status = $taskCount > 0 ? 'Updated' : 'Not Updated';
                    $rowData[] = $status;

                    if ($taskCount > 0) {
                        $daysUpdated++;
                        $totalTasksCount += $taskCount;
                    } else {
                        $daysNotUpdated++;
                    }

                    $dateColumnIndex++;
                }

                // Add summary data
                $totalDays = count($dates);
                $attendancePercent = $totalDays > 0 ? round(($daysUpdated / $totalDays) * 100, 2) : 0;
                $rowData[] = $totalTasksCount;
                $rowData[] = $daysUpdated;
                $rowData[] = $daysNotUpdated;
                $rowData[] = $attendancePercent . '%';

                $sheet->fromArray($rowData, null, 'A' . $rowIndex);

                // Apply color coding to date columns
                $dateColumnIndex = 7; // Starting column for dates
                foreach ($dates as $date) {
                    $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($dateColumnIndex);
                    $cellAddress = $columnLetter . $rowIndex;
                    $cellValue = $sheet->getCell($cellAddress)->getValue();

                    if ($cellValue === 'Updated') {
                        $sheet->getStyle($cellAddress)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'D4EDDA'], // Light green
                            ],
                            'font' => [
                                'color' => ['rgb' => '155724'],
                                'bold' => true,
                                'size' => 9,
                            ],
                            'alignment' => [
                                'horizontal' => Alignment::HORIZONTAL_CENTER,
                            ],
                        ]);
                    } else {
                        $sheet->getStyle($cellAddress)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'F8D7DA'], // Light red
                            ],
                            'font' => [
                                'color' => ['rgb' => '721C24'],
                                'bold' => true,
                                'size' => 9,
                            ],
                            'alignment' => [
                                'horizontal' => Alignment::HORIZONTAL_CENTER,
                            ],
                        ]);
                    }

                    $dateColumnIndex++;
                }

                $rowIndex++;
                $serialNo++;
            }

            // Style all data rows
            if ($rowIndex > 2) {
                $dataStyle = [
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'CCCCCC'],
                        ],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ];
                $sheet->getStyle('A2:' . $lastColumn . ($rowIndex - 1))->applyFromArray($dataStyle);

                // Center align specific columns
                $sheet->getStyle('A2:A' . ($rowIndex - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // S.No
                $sheet->getStyle('B2:B' . ($rowIndex - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Staff ID

                // Center align summary columns (last 4 columns)
                $summaryStartCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($headers) - 3);
                $summaryEndCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($headers));
                $sheet->getStyle($summaryStartCol . '2:' . $summaryEndCol . ($rowIndex - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }

            // Set column widths
            $sheet->getColumnDimension('A')->setWidth(8);   // S.No
            $sheet->getColumnDimension('B')->setWidth(10);  // Staff ID
            $sheet->getColumnDimension('C')->setWidth(25);  // Staff Name
            $sheet->getColumnDimension('D')->setWidth(30);  // Email
            $sheet->getColumnDimension('E')->setWidth(20);  // Role
            $sheet->getColumnDimension('F')->setWidth(20);  // Department

            // Set width for date columns
            for ($i = 7; $i <= 6 + count($dates); $i++) {
                $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i);
                $sheet->getColumnDimension($columnLetter)->setWidth(14);
            }

            // Set width for summary columns (last 4 columns)
            for ($i = count($headers) - 3; $i <= count($headers); $i++) {
                $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i);
                $sheet->getColumnDimension($columnLetter)->setWidth(16);
            }

            // Set row height for header
            $sheet->getRowDimension(1)->setRowHeight(25);

            // Freeze panes (freeze first 6 columns and first row)
            $sheet->freezePane('G2');

            // Generate filename
            $dateRange = ($fromDate && $toDate) ? "{$fromDate}_to_{$toDate}" : date('Y-m-d');
            $filename = 'Task_Attendance_' . $dateRange . '.xlsx';

            // Create writer and output
            $writer = new Xlsx($spreadsheet);

            // Set headers for download
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment;filename="' . $filename . '"');
            header('Cache-Control: max-age=0');
            header('Cache-Control: max-age=1');
            header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
            header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
            header('Cache-Control: cache, must-revalidate');
            header('Pragma: public');

            $writer->save('php://output');
            exit;

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export Task Attendance: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export tasks report to Excel format with all user details (one row per user)
     */
    public function exportExcel(Request $request)
    {
        try {
            $user = auth()->user();
            $isAdmin = in_array(strtolower($user->role ?? ''), ['admin', 'administrator']);

            // Get date range from request
            $fromDate = $request->input('from_date');
            $toDate = $request->input('to_date');

            // Create new Spreadsheet
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Work Monitor Report');

            // Set header row
            $headers = [
                'Staff ID',
                'Staff Name',
                'Email',
                'Role/Designation',
                'Department',
                'Date Range',
                'Total Tasks',
                'Completed',
                'Pending',
                'Approved',
                'Rejected',
                'All Tasks Details'
            ];
            $sheet->fromArray($headers, null, 'A1');

            // Style header row
            $headerStyle = [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 12,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '3B82F6'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
            ];
            $sheet->getStyle('A1:L1')->applyFromArray($headerStyle);

            // Get all users or just the current user based on role
            if ($isAdmin) {
                $users = User::orderBy('name', 'asc')->get();
            } else {
                $users = User::where('id', $user->id)->get();
            }

            $rowIndex = 2;

            foreach ($users as $staffUser) {
                // Get tasks for this user within date range
                $tasksQuery = Task::where('user_id', $staffUser->id);

                if ($fromDate && $toDate) {
                    $tasksQuery->whereBetween('task_date', [$fromDate, $toDate]);
                }

                $tasks = $tasksQuery->orderBy('task_date', 'desc')
                    ->orderBy('task_number', 'asc')
                    ->get();

                // Calculate statistics
                $totalTasks = $tasks->count();
                $completed = $tasks->where('status', 'Done')->count();
                $approved = $tasks->where('action', 'Approved')->count();
                $rejected = $tasks->where('action', 'Rejected')->count();
                $pending = $totalTasks - $completed - $approved - $rejected;

                // Build task details string (all tasks in one cell)
                $taskDetails = '';
                if ($tasks->isEmpty()) {
                    $taskDetails = 'No tasks for this period';
                } else {
                    $taskDetailsList = [];
                    foreach ($tasks as $index => $task) {
                        // Determine task status
                        $taskStatus = 'Pending';
                        if ($task->status === 'Done') {
                            $taskStatus = 'Completed';
                        } elseif ($task->action === 'Approved') {
                            $taskStatus = 'Approved';
                        } elseif ($task->action === 'Rejected') {
                            $taskStatus = 'Rejected';
                        }

                        $taskDetail = sprintf(
                            "[%d] Date: %s | Task #%d\nDescription: %s\nStatus: %s | Priority: %s%s%s%s",
                            $index + 1,
                            $task->task_date->format('Y-m-d'),
                            $task->task_number,
                            $task->description,
                            $taskStatus,
                            $task->priority ?? 'Medium',
                            $task->remarks ? "\nRemarks: " . $task->remarks : '',
                            $task->admin_remarks ? "\nAdmin Remarks: " . $task->admin_remarks : '',
                            $task->staff_remarks ? "\nStaff Remarks: " . $task->staff_remarks : ''
                        );
                        $taskDetailsList[] = $taskDetail;
                    }
                    $taskDetails = implode("\n\n" . str_repeat("-", 50) . "\n\n", $taskDetailsList);
                }

                $dateRangeText = ($fromDate && $toDate) ? "$fromDate to $toDate" : 'All Dates';

                $data = [
                    $staffUser->id,
                    $staffUser->name,
                    $staffUser->email,
                    $staffUser->role ?? 'User',
                    $staffUser->department ?? 'N/A',
                    $dateRangeText,
                    $totalTasks,
                    $completed,
                    $pending,
                    $approved,
                    $rejected,
                    $taskDetails
                ];
                $sheet->fromArray($data, null, 'A' . $rowIndex);
                $rowIndex++;
            }

            // Style data rows
            if ($rowIndex > 2) {
                $dataStyle = [
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'CCCCCC'],
                        ],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_TOP,
                    ],
                ];
                $sheet->getStyle('A2:L' . ($rowIndex - 1))->applyFromArray($dataStyle);

                // Wrap text for task details column
                $sheet->getStyle('L2:L' . ($rowIndex - 1))->getAlignment()->setWrapText(true);

                // Center align the count columns
                $sheet->getStyle('G2:K' . ($rowIndex - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }

            // Set column widths
            $sheet->getColumnDimension('A')->setWidth(10);  // Staff ID
            $sheet->getColumnDimension('B')->setWidth(25);  // Staff Name
            $sheet->getColumnDimension('C')->setWidth(30);  // Email
            $sheet->getColumnDimension('D')->setWidth(20);  // Role
            $sheet->getColumnDimension('E')->setWidth(20);  // Department
            $sheet->getColumnDimension('F')->setWidth(20);  // Date Range
            $sheet->getColumnDimension('G')->setWidth(12);  // Total Tasks
            $sheet->getColumnDimension('H')->setWidth(12);  // Completed
            $sheet->getColumnDimension('I')->setWidth(12);  // Pending
            $sheet->getColumnDimension('J')->setWidth(12);  // Approved
            $sheet->getColumnDimension('K')->setWidth(12);  // Rejected
            $sheet->getColumnDimension('L')->setWidth(80);  // All Tasks Details

            // Set row height for header
            $sheet->getRowDimension(1)->setRowHeight(25);

            // Generate filename
            $dateRange = ($fromDate && $toDate) ? "{$fromDate}_to_{$toDate}" : date('Y-m-d');
            $filename = 'WorkMonitor_Report_' . $dateRange . '.xlsx';

            // Create writer and output
            $writer = new Xlsx($spreadsheet);

            // Set headers for download
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment;filename="' . $filename . '"');
            header('Cache-Control: max-age=0');
            header('Cache-Control: max-age=1');
            header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
            header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
            header('Cache-Control: cache, must-revalidate');
            header('Pragma: public');

            $writer->save('php://output');
            exit;

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export Excel: ' . $e->getMessage()
            ], 500);
        }
    }
}
