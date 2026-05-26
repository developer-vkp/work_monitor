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
        Schema::create('activity_feed', function (Blueprint $table) {
            $table->id();
            $table->text('message');
            $table->string('color')->default('blue'); // blue/green/red/amber
            $table->timestamp('activity_time');
            $table->timestamps();

            // Index for faster queries
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_feed');
    }
};
