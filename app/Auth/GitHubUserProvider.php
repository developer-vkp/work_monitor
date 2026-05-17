<?php

namespace App\Auth;

use App\Services\GitHubStorageService;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class GitHubUserProvider implements UserProvider
{
    protected $github;

    public function __construct(GitHubStorageService $github)
    {
        $this->github = $github;
    }

    public function retrieveById($identifier)
    {
        $users = $this->getAllUsers();

        foreach ($users as $userData) {
            // Compare both as strings to handle type mismatches
            if ((string)$userData['id'] === (string)$identifier) {
                return $this->createUserModel($userData);
            }
        }

        return null;
    }

    public function retrieveByToken($identifier, $token)
    {
        return null;
    }

    public function updateRememberToken(Authenticatable $user, $token)
    {
        // Not implemented for GitHub storage
    }

    public function retrieveByCredentials(array $credentials)
    {
        if (empty($credentials['email'])) {
            return null;
        }

        $users = $this->getAllUsers();

        foreach ($users as $userData) {
            if ($userData['email'] === $credentials['email']) {
                return $this->createUserModel($userData);
            }
        }

        return null;
    }

    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        return Hash::check($credentials['password'], $user->getAuthPassword());
    }

    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false)
    {
        // Not implemented
    }

    protected function getAllUsers()
    {
        try {
            $data = $this->github->readFile('users.json');
            return $data['users'] ?? [];
        } catch (\Exception $e) {
            return [];
        }
    }

    protected function createUserModel(array $userData)
    {
        $user = new User();

        // Use forceFill to bypass mutators and casts
        $user->forceFill([
            'id' => $userData['id'],
            'name' => $userData['name'],
            'email' => $userData['email'],
            'role' => $userData['role'] ?? 'user',
            'password' => $userData['password'], // Already hashed
        ]);

        // Mark as existing to prevent save attempts
        $user->exists = true;
        $user->wasRecentlyCreated = false;
        $user->syncOriginal(); // Sync attributes to prevent dirty checks

        return $user;
    }
}
