<?php

namespace App\Http\Controllers;

use App\Services\GitHubStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class UserController extends Controller
{
    protected $github;
    protected $filename = 'users.json';

    public function __construct(GitHubStorageService $github)
    {
        $this->github = $github;
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
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
            // Read existing users from GitHub
            $data = $this->github->readFile($this->filename);
            $users = $data['users'] ?? [];

            // Check if email already exists
            foreach ($users as $user) {
                if ($user['email'] === $request->email) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Email already exists'
                    ], 422);
                }
            }

            // Create new user
            $newUser = [
                'id' => 'U' . time(),
                'name' => $request->name,
                'email' => $request->email,
                'role' => $request->role,
                'department' => $request->department,
                'password' => Hash::make($request->password),
                'created_at' => date('Y-m-d H:i:s'),
            ];

            $users[] = $newUser;

            // Save to GitHub
            $result = $this->github->writeFile(
                $this->filename,
                ['users' => $users],
                "Add new user: {$request->name}"
            );

            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'User created successfully',
                    'user' => [
                        'id' => $newUser['id'],
                        'name' => $newUser['name'],
                        'email' => $newUser['email'],
                        'role' => $newUser['role'],
                    ]
                ], 201);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to save user to GitHub'
            ], 500);

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
            // Read existing users from GitHub
            $data = $this->github->readFile($this->filename);
            $users = $data['users'] ?? [];

            // Remove password field from response
            $users = array_map(function($user) {
                unset($user['password']);
                return $user;
            }, $users);

            return response()->json([
                'success' => true,
                'users' => array_values($users)
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a user.
     */
    public function update(Request $request, $id)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
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
            // Read existing users from GitHub
            $data = $this->github->readFile($this->filename);
            $users = $data['users'] ?? [];

            // Find user
            $userIndex = -1;
            foreach ($users as $index => $user) {
                if ($user['id'] === $id) {
                    $userIndex = $index;
                    break;
                }
            }

            if ($userIndex === -1) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Check if email is being changed and already exists
            if ($users[$userIndex]['email'] !== $request->email) {
                foreach ($users as $user) {
                    if ($user['email'] === $request->email) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Email already exists'
                        ], 422);
                    }
                }
            }

            // Update user data
            $users[$userIndex]['name'] = $request->name;
            $users[$userIndex]['email'] = $request->email;
            $users[$userIndex]['role'] = $request->role;
            $users[$userIndex]['department'] = $request->department;

            // Update password only if provided
            if ($request->filled('password')) {
                $users[$userIndex]['password'] = Hash::make($request->password);
            }

            $users[$userIndex]['updated_at'] = date('Y-m-d H:i:s');

            // Save to GitHub
            $result = $this->github->writeFile(
                $this->filename,
                ['users' => $users],
                "Update user: {$request->name}"
            );

            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'User updated successfully',
                    'user' => [
                        'id' => $users[$userIndex]['id'],
                        'name' => $users[$userIndex]['name'],
                        'email' => $users[$userIndex]['email'],
                        'role' => $users[$userIndex]['role'],
                        'department' => $users[$userIndex]['department'],
                    ]
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to update user in GitHub'
            ], 500);

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
            if ($currentUser->id === $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot delete your own account'
                ], 400);
            }

            // Read existing users from GitHub
            $data = $this->github->readFile($this->filename);
            $users = $data['users'] ?? [];

            // Find and remove user
            $userIndex = -1;
            $deletedUserName = null;
            foreach ($users as $index => $user) {
                if ($user['id'] === $id) {
                    $userIndex = $index;
                    $deletedUserName = $user['name'];
                    break;
                }
            }

            if ($userIndex === -1) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Remove user from array
            array_splice($users, $userIndex, 1);

            // Save to GitHub
            $result = $this->github->writeFile(
                $this->filename,
                ['users' => $users],
                "Delete user: {$deletedUserName}"
            );

            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'User deleted successfully'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user from GitHub'
            ], 500);

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
        // Validate the request
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
            $currentUser = Auth::user();

            // Read existing users from GitHub
            $data = $this->github->readFile($this->filename);
            $users = $data['users'] ?? [];

            // Find user by email
            $userIndex = -1;
            foreach ($users as $index => $user) {
                if ($user['email'] === $currentUser->email) {
                    $userIndex = $index;
                    break;
                }
            }

            if ($userIndex === -1) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found in GitHub storage'
                ], 404);
            }

            // Check if current password is correct
            if (!Hash::check($request->current_password, $users[$userIndex]['password'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 400);
            }

            // Update password
            $users[$userIndex]['password'] = Hash::make($request->new_password);
            $users[$userIndex]['updated_at'] = date('Y-m-d H:i:s');

            // Save to GitHub
            $result = $this->github->writeFile(
                $this->filename,
                ['users' => $users],
                "Update password for user: {$users[$userIndex]['name']}"
            );

            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'Password updated successfully'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to save password to GitHub'
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update password: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk import users from Excel.
     */
    public function bulkImport(Request $request)
    {
        // Validate the request
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
            // Read existing users from GitHub
            $data = $this->github->readFile($this->filename);
            $existingUsers = $data['users'] ?? [];

            // Build a list of existing emails
            $existingEmails = array_column($existingUsers, 'email');

            $newUsers = [];
            $skippedEmails = [];
            $timestamp = time();

            foreach ($request->users as $index => $userData) {
                $email = $userData['email'];

                // Check if email already exists
                if (in_array($email, $existingEmails) || in_array($email, array_column($newUsers, 'email'))) {
                    $skippedEmails[] = $email;
                    continue;
                }

                // Create new user with default password: 12345678
                $newUser = [
                    'id' => 'U' . ($timestamp + $index),
                    'name' => $userData['name'],
                    'email' => $email,
                    'role' => !empty($userData['role']) ? $userData['role'] : 'user',
                    'department' => !empty($userData['department']) ? $userData['department'] : '',
                    'password' => Hash::make('12345678'), // Always use default password
                    'created_at' => date('Y-m-d H:i:s'),
                ];

                $newUsers[] = $newUser;
            }

            if (empty($newUsers)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No new users to import. All emails already exist.',
                    'skipped' => $skippedEmails
                ], 400);
            }

            // Merge with existing users
            $allUsers = array_merge($existingUsers, $newUsers);

            // Save to GitHub
            $result = $this->github->writeFile(
                $this->filename,
                ['users' => $allUsers],
                "Bulk import: Added " . count($newUsers) . " user(s)"
            );

            if ($result) {
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
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to save users to GitHub'
            ], 500);

        } catch (\Exception $e) {
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

            // Set header row
            $headers = ['Name', 'Email', 'Role', 'Department'];
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
            $sheet->getStyle('A1:D1')->applyFromArray($headerStyle);

            // Add sample data
            $sampleData = [
                ['John Doe', 'john.doe@example.com', 'Developer', 'Engineering'],
                ['Jane Smith', 'jane.smith@example.com', 'Designer', 'Design'],
                ['Mike Johnson', 'mike.johnson@example.com', 'Manager', 'Operations'],
                ['Sarah Williams', 'sarah.williams@example.com', 'Analyst', 'Finance'],
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
            $sheet->getStyle('A2:D5')->applyFromArray($dataStyle);

            // Set column widths
            $sheet->getColumnDimension('A')->setWidth(25); // Name
            $sheet->getColumnDimension('B')->setWidth(35); // Email
            $sheet->getColumnDimension('C')->setWidth(25); // Role
            $sheet->getColumnDimension('D')->setWidth(25); // Department

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
                ['- Role: User role/designation (optional, defaults to "user")'],
                ['- Department: User department (optional, can be empty)'],
                [''],
                ['Password Policy:'],
                ['- ALL imported users will automatically get password: 12345678'],
                ['- Password cannot be customized in the Excel file'],
                ['- This is a system default for all bulk imports'],
                ['- Users should change their password after first login'],
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
            $instructionSheet->getStyle('A3')->getFont()->setBold(true);
            $instructionSheet->getStyle('A7')->getFont()->setBold(true);
            $instructionSheet->getStyle('A11')->getFont()->setBold(true);
            $instructionSheet->getStyle('A14')->getFont()->setBold(true);
            $instructionSheet->getColumnDimension('A')->setWidth(60);

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
