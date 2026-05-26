<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('task_number'); // Task number (1-5)
            $table->text('description');
            $table->date('task_date');
            $table->string('status')->default('Pending'); // Done/Pending
            $table->string('action')->nullable(); // Approved/Rejected/null
            $table->string('priority')->nullable(); // High/Medium/Low
            $table->text('remarks')->nullable();
            $table->text('admin_remarks')->nullable();
            $table->text('staff_remarks')->nullable();
            $table->timestamps();

            // Index for faster queries
            $table->index(['user_id', 'task_date']);
            $table->index('action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
