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
    Route::get('/admin/users/template/download', [UserController::class, 'downloadTemplate'])->name('admin.users.template');
    Route::post('/admin/users/create', [UserController::class, 'store'])->name('admin.users.create');
    Route::post('/admin/users/import-excel', [UserController::class, 'importExcel'])->name('admin.users.import-excel');
    Route::post('/admin/users/bulk-import', [UserController::class, 'bulkImport'])->name('admin.users.bulk-import');
    Route::put('/admin/users/{id}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('/admin/users/{id}', [UserController::class, 'destroy'])->name('admin.users.destroy');

    // Profile Management
    Route::post('/admin/profile/change-password', [UserController::class, 'changePassword'])->name('admin.profile.change-password');

    // Database Storage - Tasks
    Route::prefix('api/tasks')->group(function () {
        Route::get('/', [TaskDataController::class, 'index'])->name('api.tasks.index');
        Route::get('/debug', [TaskDataController::class, 'debug'])->name('api.tasks.debug');
        Route::post('/', [TaskDataController::class, 'create'])->name('api.tasks.create');
        Route::put('/{id}', [TaskDataController::class, 'update'])->name('api.tasks.update');
        Route::post('/save', [TaskDataController::class, 'store'])->name('api.tasks.store'); // KEEP (deprecated)
        Route::delete('/{id}', [TaskDataController::class, 'destroy'])->name('api.tasks.destroy');
    });

    // Database Storage - Activity Feed
    Route::prefix('api/feed')->group(function () {
        Route::get('/', [TaskDataController::class, 'getActivityFeed'])->name('api.feed.index');
        Route::post('/', [TaskDataController::class, 'addActivityFeed'])->name('api.feed.store');
    });
});
