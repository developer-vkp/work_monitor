<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    protected $fillable = [
        'user_id',
        'task_number',
        'description',
        'task_date',
        'status',
        'action',
        'priority',
        'remarks',
        'admin_remarks',
        'staff_remarks',
    ];

    protected $casts = [
        'task_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
