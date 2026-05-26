<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class UserController extends Controller
{
    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'role' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'role' => $request->role,
                'department' => $request->department,
                'password' => Hash::make($request->password),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'department' => $user->department,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all users.
     */
    public function index()
    {
        try {
            $users = User::select('id', 'name', 'email', 'role', 'department', 'created_at')
                ->get();

            return response()->json([
                'success' => true,
                'users' => $users
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users: ' . $e->getMessage(),
                'users' => []
            ], 500);
        }
    }

    /**
     * Update a user.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $id],
            'role' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::findOrFail($id);

            $user->name = $request->name;
            $user->email = $request->email;
            $user->role = $request->role;
            $user->department = $request->department;

            // Update password only if provided
            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }

            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'department' => $user->department,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a user.
     */
    public function destroy($id)
    {
        try {
            $currentUser = Auth::user();

            // Prevent deleting yourself
            if ($currentUser->id == $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot delete your own account'
                ], 400);
            }

            $user = User::findOrFail($id);
            $userName = $user->name;

            // Delete related tasks
            $user->tasks()->delete();

            // Delete user
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change user password.
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8'],
            'new_password_confirmation' => ['required', 'string', 'same:new_password'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();

            // Check if current password is correct
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 400);
            }

            // Update password
            $user->password = Hash::make($request->new_password);
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Password updated successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update password: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import users from Excel file.
     */
    public function importExcel(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'excel_file' => ['required', 'file', 'mimes:xlsx,xls', 'max:2048'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('excel_file');

            // Load the Excel file
            $spreadsheet = IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();

            // Remove header row
            $headers = array_shift($rows);

            // Validate headers - support both formats
            $normalizedHeaders = array_map('trim', array_map('strtolower', $headers));

            // Format 1: Name, Email, Role, Department (4 columns)
            $format1 = ['name', 'email', 'role', 'department'];
            // Format 2: Name, Email, Password, Role, Department (5 columns)
            $format2 = ['name', 'email', 'password', 'role', 'department'];

            $hasPasswordColumn = false;

            if ($normalizedHeaders === $format1) {
                $hasPasswordColumn = false;
            } elseif ($normalizedHeaders === $format2) {
                $hasPasswordColumn = true;
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid Excel file format. Expected columns: "Name, Email, Role, Department" OR "Name, Email, Password, Role, Department"'
                ], 400);
            }

            // Process data rows
            $users = [];
            $invalidRows = [];
            $rowNumber = 2; // Start from 2 (1 is header)

            foreach ($rows as $row) {
                // Skip empty rows
                if (empty(array_filter($row))) {
                    $rowNumber++;
                    continue;
                }

                if ($hasPasswordColumn) {
                    // Format with password: Name, Email, Password, Role, Department
                    $name = trim($row[0] ?? '');
                    $email = trim($row[1] ?? '');
                    $password = trim($row[2] ?? '');
                    $role = trim($row[3] ?? '');
                    $department = trim($row[4] ?? '');
                } else {
                    // Format without password: Name, Email, Role, Department
                    $name = trim($row[0] ?? '');
                    $email = trim($row[1] ?? '');
                    $password = ''; // Will use default
                    $role = trim($row[2] ?? '');
                    $department = trim($row[3] ?? '');
                }

                // Validate required fields
                if (empty($name) || empty($email)) {
                    $invalidRows[] = [
                        'row' => $rowNumber,
                        'error' => 'Name and Email are required'
                    ];
                    $rowNumber++;
                    continue;
                }

                // Validate email format
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $invalidRows[] = [
                        'row' => $rowNumber,
                        'error' => 'Invalid email format: ' . $email
                    ];
                    $rowNumber++;
                    continue;
                }

                // Validate password if provided
                if ($hasPasswordColumn && !empty($password) && strlen($password) < 8) {
                    $invalidRows[] = [
                        'row' => $rowNumber,
                        'error' => 'Password must be at least 8 characters'
                    ];
                    $rowNumber++;
                    continue;
                }

                $users[] = [
                    'name' => $name,
                    'email' => $email,
                    'password' => $password, // Empty string if not provided
                    'role' => $role,
                    'department' => $department,
                ];

                $rowNumber++;
            }

            if (empty($users) && !empty($invalidRows)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No valid users found in the Excel file',
                    'invalid_rows' => $invalidRows
                ], 400);
            }

            if (empty($users)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No users found in the Excel file'
                ], 400);
            }

            // Import users using bulk import logic
            DB::beginTransaction();

            $existingEmails = User::pluck('email')->toArray();
            $newUsers = [];
            $skippedEmails = [];

            foreach ($users as $userData) {
                $email = $userData['email'];

                // Check if email already exists
                if (in_array($email, $existingEmails) || in_array($email, array_column($newUsers, 'email'))) {
                    $skippedEmails[] = $email;
                    continue;
                }

                // Use password from Excel if provided, otherwise default to 12345678
                $password = !empty($userData['password']) ? $userData['password'] : '12345678';

                $newUsers[] = [
                    'name' => $userData['name'],
                    'email' => $email,
                    'role' => !empty($userData['role']) ? $userData['role'] : 'user',
                    'department' => !empty($userData['department']) ? $userData['department'] : '',
                    'password' => Hash::make($password),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if (empty($newUsers)) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'No new users to import. All emails already exist.',
                    'skipped' => $skippedEmails,
                    'invalid_rows' => $invalidRows
                ], 400);
            }

            // Insert all users
            User::insert($newUsers);

            DB::commit();

            $message = 'Successfully imported ' . count($newUsers) . ' user(s)';
            if (!empty($skippedEmails)) {
                $message .= '. Skipped ' . count($skippedEmails) . ' duplicate email(s)';
            }
            if (!empty($invalidRows)) {
                $message .= '. ' . count($invalidRows) . ' invalid row(s)';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'count' => count($newUsers),
                'skipped' => $skippedEmails,
                'invalid_rows' => $invalidRows
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to import Excel file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk import users from Excel.
     */
    public function bulkImport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'users' => ['required', 'array', 'min:1'],
            'users.*.name' => ['required', 'string', 'max:255'],
            'users.*.email' => ['required', 'string', 'email', 'max:255'],
            'users.*.role' => ['nullable', 'string', 'max:255'],
            'users.*.department' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $existingEmails = User::pluck('email')->toArray();
            $newUsers = [];
            $skippedEmails = [];

            foreach ($request->users as $userData) {
                $email = $userData['email'];

                // Check if email already exists
                if (in_array($email, $existingEmails) || in_array($email, array_column($newUsers, 'email'))) {
                    $skippedEmails[] = $email;
                    continue;
                }

                $newUsers[] = [
                    'name' => $userData['name'],
                    'email' => $email,
                    'role' => !empty($userData['role']) ? $userData['role'] : 'user',
                    'department' => !empty($userData['department']) ? $userData['department'] : '',
                    'password' => Hash::make('12345678'), // Default password
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if (empty($newUsers)) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'No new users to import. All emails already exist.',
                    'skipped' => $skippedEmails
                ], 400);
            }

            // Insert all users
            User::insert($newUsers);

            DB::commit();

            $message = 'Successfully imported ' . count($newUsers) . ' user(s)';
            if (!empty($skippedEmails)) {
                $message .= '. Skipped ' . count($skippedEmails) . ' duplicate email(s)';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'count' => count($newUsers),
                'skipped' => $skippedEmails
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to import users: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download Excel template for bulk user import.
     */
    public function downloadTemplate()
    {
        try {
            // Create new Spreadsheet
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Users');

            // Set header row (with optional Password column)
            $headers = ['Name', 'Email', 'Password', 'Role', 'Department'];
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
            $sheet->getStyle('A1:E1')->applyFromArray($headerStyle);

            // Add sample data (with passwords)
            $sampleData = [
                ['John Doe', 'john.doe@example.com', 'password123', 'Developer', 'Engineering'],
                ['Jane Smith', 'jane.smith@example.com', 'securePass456', 'Designer', 'Design'],
                ['Mike Johnson', 'mike.johnson@example.com', '', 'Manager', 'Operations'],
                ['Sarah Williams', 'sarah.williams@example.com', '', 'Analyst', 'Finance'],
            ];
            $sheet->fromArray($sampleData, null, 'A2');

            // Style data rows
            $dataStyle = [
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'CCCCCC'],
                    ],
                ],
            ];
            $sheet->getStyle('A2:E5')->applyFromArray($dataStyle);

            // Set column widths
            $sheet->getColumnDimension('A')->setWidth(25); // Name
            $sheet->getColumnDimension('B')->setWidth(35); // Email
            $sheet->getColumnDimension('C')->setWidth(20); // Password
            $sheet->getColumnDimension('D')->setWidth(25); // Role
            $sheet->getColumnDimension('E')->setWidth(25); // Department

            // Set row height for header
            $sheet->getRowDimension(1)->setRowHeight(25);

            // Add instructions in a separate sheet
            $instructionSheet = $spreadsheet->createSheet(1);
            $instructionSheet->setTitle('Instructions');

            $instructions = [
                ['User Import Template - Instructions'],
                [''],
                ['Required Fields:'],
                ['- Name: Full name of the user (required)'],
                ['- Email: Valid email address (required, must be unique)'],
                [''],
                ['Optional Fields:'],
                ['- Password: User password (optional, min 8 characters)'],
                ['- Role: User role/designation (optional, defaults to "user")'],
                ['- Department: User department (optional, can be empty)'],
                [''],
                ['Password Policy:'],
                ['- If Password column is PROVIDED and NOT empty: Uses the password from Excel'],
                ['- If Password column is EMPTY or MISSING: Defaults to "12345678"'],
                ['- Password must be at least 8 characters if provided'],
                ['- Users should change their password after first login'],
                [''],
                ['Supported Formats:'],
                ['- Format 1: Name, Email, Role, Department (without Password)'],
                ['- Format 2: Name, Email, Password, Role, Department (with Password)'],
                [''],
                ['Notes:'],
                ['- Delete the sample data rows before importing'],
                ['- Each row represents one user'],
                ['- Duplicate emails will be skipped'],
                ['- Invalid email formats will cause import to fail'],
            ];
            $instructionSheet->fromArray($instructions, null, 'A1');

            // Style instructions
            $instructionSheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
            $instructionSheet->getStyle('A3')->getFont()->setBold(true);  // Required Fields
            $instructionSheet->getStyle('A7')->getFont()->setBold(true);  // Optional Fields
            $instructionSheet->getStyle('A12')->getFont()->setBold(true); // Password Policy
            $instructionSheet->getStyle('A17')->getFont()->setBold(true); // Supported Formats
            $instructionSheet->getStyle('A21')->getFont()->setBold(true); // Notes
            $instructionSheet->getColumnDimension('A')->setWidth(70);

            // Set active sheet to Users
            $spreadsheet->setActiveSheetIndex(0);

            // Generate filename
            $filename = 'User_Import_Template_' . date('Y-m-d') . '.xlsx';

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
                'message' => 'Failed to generate template: ' . $e->getMessage()
            ], 500);
        }
    }
}
