<?php

namespace App\Http\Controllers;

use App\Services\GitHubStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StaffDataController extends Controller
{
    protected $github;
    protected $filename = 'staff.json';

    public function __construct(GitHubStorageService $github)
    {
        $this->github = $github;
    }

    /**
     * Get all staff data
     */
    public function index()
    {
        $data = $this->github->readFile($this->filename);

        return response()->json([
            'success' => true,
            'data' => $data['staff'] ?? [],
        ]);
    }

    /**
     * Save complete staff data
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff' => 'required|array',
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
            ['staff' => $request->staff],
            'Update staff data'
        );

        return response()->json([
            'success' => $result,
            'message' => $result ? 'Staff data saved successfully' : 'Failed to save staff data',
        ], $result ? 200 : 500);
    }

    /**
     * Add a single staff member
     */
    public function addStaff(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|string',
            'name' => 'required|string',
            'email' => 'nullable|email',
            'role' => 'required|string',
            'department' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Read existing data
        $data = $this->github->readFile($this->filename);
        $staff = $data['staff'] ?? [];

        // Add new staff member
        $staff[] = [
            'id' => $request->id,
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'department' => $request->department,
            'inst' => $request->department,
            'active' => true,
        ];

        // Save back to GitHub
        $result = $this->github->writeFile(
            $this->filename,
            ['staff' => $staff],
            "Add staff member: {$request->name}"
        );

        return response()->json([
            'success' => $result,
            'message' => $result ? 'Staff member added successfully' : 'Failed to add staff member',
            'data' => $result ? end($staff) : null,
        ], $result ? 201 : 500);
    }

    /**
     * Update a staff member
     */
    public function updateStaff(Request $request, $id)
    {
        // Read existing data
        $data = $this->github->readFile($this->filename);
        $staff = $data['staff'] ?? [];

        // Find and update staff member
        $found = false;
        foreach ($staff as &$member) {
            if ($member['id'] === $id) {
                $member = array_merge($member, $request->only(['name', 'email', 'role', 'department', 'active']));
                $found = true;
                break;
            }
        }

        if (!$found) {
            return response()->json([
                'success' => false,
                'message' => 'Staff member not found',
            ], 404);
        }

        // Save back to GitHub
        $result = $this->github->writeFile(
            $this->filename,
            ['staff' => $staff],
            "Update staff member: {$id}"
        );

        return response()->json([
            'success' => $result,
            'message' => $result ? 'Staff member updated successfully' : 'Failed to update staff member',
        ], $result ? 200 : 500);
    }

    /**
     * Delete a staff member
     */
    public function deleteStaff($id)
    {
        // Read existing data
        $data = $this->github->readFile($this->filename);
        $staff = $data['staff'] ?? [];

        // Remove staff member
        $staff = array_values(array_filter($staff, function ($member) use ($id) {
            return $member['id'] !== $id;
        }));

        // Save back to GitHub
        $result = $this->github->writeFile(
            $this->filename,
            ['staff' => $staff],
            "Delete staff member: {$id}"
        );

        return response()->json([
            'success' => $result,
            'message' => $result ? 'Staff member deleted successfully' : 'Failed to delete staff member',
        ], $result ? 200 : 500);
    }

    /**
     * Test GitHub connection
     */
    public function testConnection()
    {
        $result = $this->github->testConnection();

        return response()->json($result, $result['success'] ? 200 : 500);
    }
}
