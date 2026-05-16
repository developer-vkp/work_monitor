<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminLoginController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\StaffDataController;
use App\Http\Controllers\TaskDataController;

Route::get('/', function () {
    return view('welcome');
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
    Route::post('/admin/users/create', [UserController::class, 'store'])->name('admin.users.create');

    // Profile Management
    Route::post('/admin/profile/change-password', [UserController::class, 'changePassword'])->name('admin.profile.change-password');

    // GitHub Data Storage - Staff
    Route::prefix('api/staff')->group(function () {
        Route::get('/', [StaffDataController::class, 'index'])->name('api.staff.index');
        Route::post('/save', [StaffDataController::class, 'store'])->name('api.staff.store');
        Route::post('/add', [StaffDataController::class, 'addStaff'])->name('api.staff.add');
        Route::put('/{id}', [StaffDataController::class, 'updateStaff'])->name('api.staff.update');
        Route::delete('/{id}', [StaffDataController::class, 'deleteStaff'])->name('api.staff.delete');
    });

    // GitHub Data Storage - Tasks
    Route::prefix('api/tasks')->group(function () {
        Route::get('/', [TaskDataController::class, 'index'])->name('api.tasks.index');
        Route::post('/save', [TaskDataController::class, 'store'])->name('api.tasks.store');
    });

    // Test GitHub Connection
    Route::get('/api/github/test', [StaffDataController::class, 'testConnection'])->name('api.github.test');
});
