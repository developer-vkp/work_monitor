<?php

namespace App\Http\Controllers;

use App\Services\GitHubStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

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
}
