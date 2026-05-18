<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminLoginController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TaskDataController;

Route::get('/', function () {
    return redirect()->route('admin.login');
});

// Admin Login Routes
Route::get('/admin/login', [AdminLoginController::class, 'showLoginForm'])->name('admin.login');
Route::post('/admin/login', [AdminLoginController::class, 'login'])->name('admin.login.submit');
Route::post('/admin/logout', [AdminLoginController::class, 'logout'])->name('admin.logout');

// Admin Dashboard (Protected)
Route::middleware('auth')->group(function () {
    Route::get('/admin/dashboard', function () {
        return view('index');
    })->name('admin.dashboard');

    // User Management
    Route::get('/admin/users', [UserController::class, 'index'])->name('admin.users.index');
    Route::post('/admin/users/create', [UserController::class, 'store'])->name('admin.users.create');
    Route::put('/admin/users/{id}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('/admin/users/{id}', [UserController::class, 'destroy'])->name('admin.users.destroy');

    // Profile Management
    Route::post('/admin/profile/change-password', [UserController::class, 'changePassword'])->name('admin.profile.change-password');

    // GitHub Data Storage - Tasks
    Route::prefix('api/tasks')->group(function () {
        Route::get('/', [TaskDataController::class, 'index'])->name('api.tasks.index');
        Route::post('/save', [TaskDataController::class, 'store'])->name('api.tasks.store');
    });
});
