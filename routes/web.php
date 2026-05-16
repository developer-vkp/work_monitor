<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminLoginController;
use App\Http\Controllers\UserController;

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
});
