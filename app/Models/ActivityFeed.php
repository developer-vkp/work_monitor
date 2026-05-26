<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityFeed extends Model
{
    protected $table = 'activity_feed';

    protected $fillable = [
        'message',
        'color',
        'activity_time',
    ];

    protected $casts = [
        'activity_time' => 'datetime',
    ];
}
