<?php

namespace App\Http\Controllers;

use App\Services\GitHubStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserDataController extends Controller
{
    protected $github;
    protected $filename = 'users.json';

    public function __construct(GitHubStorageService $github)
    {
        $this->github = $github;
    }

    /**
     * Get all users
     */
    public function index()
    {
        $data = $this->github->readFile($this->filename);

        return response()->json([
            'success' => true,
            'data' => $data['users'] ?? [],
        ]);
    }

    /**
     * Save complete users data
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'users' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->github->writeFile(
            $this->filename,
            ['users' => $request->users],
            'Update users data'
        );

        return response()->json([
            'success' => $result,
            'message' => $result ? 'Users data saved successfully' : 'Failed to save users data',
        ], $result ? 200 : 500);
    }

    /**
     * Create a new user
     */
    public function createUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'role' => 'required|in:admin,manager,user',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Read existing users
        $data = $this->github->readFile($this->filename);
        $users = $data['users'] ?? [];

        // Check if email already exists
        foreach ($users as $user) {
            if ($user['email'] === $request->email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email already exists',
                ], 422);
            }
        }

        // Create new user
        $newUser = [
            'id' => 'U' . time(),
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
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
                ],
            ], 201);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to create user',
        ], 500);
    }

    /**
     * Update user password
     */
    public function updatePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8',
            'new_password_confirmation' => 'required|string|same:new_password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Read existing users
        $data = $this->github->readFile($this->filename);
        $users = $data['users'] ?? [];

        // Find user by email
        $userIndex = -1;
        foreach ($users as $index => $user) {
            if ($user['email'] === $request->email) {
                $userIndex = $index;
                break;
            }
        }

        if ($userIndex === -1) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        // Verify current password
        if (!Hash::check($request->current_password, $users[$userIndex]['password'])) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect',
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
                'message' => 'Password updated successfully',
            ], 200);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to update password',
        ], 500);
    }

    /**
     * Delete user
     */
    public function deleteUser($id)
    {
        // Read existing users
        $data = $this->github->readFile($this->filename);
        $users = $data['users'] ?? [];

        // Filter out the user to delete
        $filteredUsers = array_values(array_filter($users, function ($user) use ($id) {
            return $user['id'] !== $id;
        }));

        if (count($filteredUsers) === count($users)) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        // Save to GitHub
        $result = $this->github->writeFile(
            $this->filename,
            ['users' => $filteredUsers],
            "Delete user: {$id}"
        );

        return response()->json([
            'success' => $result,
            'message' => $result ? 'User deleted successfully' : 'Failed to delete user',
        ], $result ? 200 : 500);
    }
}
