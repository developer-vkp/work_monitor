<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GitHubStorageService
{
    protected $username;
    protected $repository;
    protected $token;
    protected $baseUrl = 'https://api.github.com';

    public function __construct()
    {
        $this->username = env('GITHUB_USERNAME');
        $this->repository = env('GITHUB_REPOSITORY');
        $this->token = env('GITHUB_TOKEN');
    }

    /**
     * Read JSON file from GitHub repository
     */
    public function readFile(string $filename): array
    {
        try {
            $url = "{$this->baseUrl}/repos/{$this->username}/{$this->repository}/contents/data/{$filename}";

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->token}",
                'Accept' => 'application/vnd.github.v3+json',
            ])->get($url);

            if ($response->successful()) {
                $content = base64_decode($response->json('content'));
                return json_decode($content, true) ?? [];
            }

            // If file doesn't exist, return empty array
            if ($response->status() === 404) {
                return [];
            }

            Log::error('GitHub read error', ['response' => $response->json()]);
            return [];
        } catch (\Exception $e) {
            Log::error('GitHub read exception', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Write JSON file to GitHub repository
     */
    public function writeFile(string $filename, array $data, string $message = 'Update data'): bool
    {
        try {
            $url = "{$this->baseUrl}/repos/{$this->username}/{$this->repository}/contents/data/{$filename}";

            // First, check if file exists to get the SHA
            $existingFile = Http::withHeaders([
                'Authorization' => "Bearer {$this->token}",
                'Accept' => 'application/vnd.github.v3+json',
            ])->get($url);

            $content = base64_encode(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            $payload = [
                'message' => $message,
                'content' => $content,
                'branch' => 'main',
            ];

            // If file exists, include SHA for update
            if ($existingFile->successful()) {
                $payload['sha'] = $existingFile->json('sha');
            }

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->token}",
                'Accept' => 'application/vnd.github.v3+json',
            ])->put($url, $payload);

            if ($response->successful()) {
                return true;
            }

            Log::error('GitHub write error', ['response' => $response->json()]);
            return false;
        } catch (\Exception $e) {
            Log::error('GitHub write exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Delete file from GitHub repository
     */
    public function deleteFile(string $filename, string $message = 'Delete data'): bool
    {
        try {
            $url = "{$this->baseUrl}/repos/{$this->username}/{$this->repository}/contents/data/{$filename}";

            // Get file SHA
            $existingFile = Http::withHeaders([
                'Authorization' => "Bearer {$this->token}",
                'Accept' => 'application/vnd.github.v3+json',
            ])->get($url);

            if (!$existingFile->successful()) {
                return false;
            }

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->token}",
                'Accept' => 'application/vnd.github.v3+json',
            ])->delete($url, [
                'message' => $message,
                'sha' => $existingFile->json('sha'),
                'branch' => 'main',
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('GitHub delete exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Check if repository and authentication are working
     */
    public function testConnection(): array
    {
        try {
            $url = "{$this->baseUrl}/repos/{$this->username}/{$this->repository}";

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->token}",
                'Accept' => 'application/vnd.github.v3+json',
            ])->get($url);

            return [
                'success' => $response->successful(),
                'status' => $response->status(),
                'message' => $response->successful() ? 'Connection successful' : 'Connection failed',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'status' => 500,
                'message' => $e->getMessage(),
            ];
        }
    }
}
