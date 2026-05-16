<?php

namespace App\Http\Controllers;

use App\Services\GitHubStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TaskDataController extends Controller
{
    protected $github;
    protected $filename = 'tasks.json';

    public function __construct(GitHubStorageService $github)
    {
        $this->github = $github;
    }

    /**
     * Get all tasks data
     */
    public function index()
    {
        $data = $this->github->readFile($this->filename);

        return response()->json([
            'success' => true,
            'data' => $data['tasks'] ?? [],
        ]);
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

        $result = $this->github->writeFile(
            $this->filename,
            ['tasks' => $request->tasks],
            'Update tasks data'
        );

        return response()->json([
            'success' => $result,
            'message' => $result ? 'Tasks data saved successfully' : 'Failed to save tasks data',
        ], $result ? 200 : 500);
    }
}
