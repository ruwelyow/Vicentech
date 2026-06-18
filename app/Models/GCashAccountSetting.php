<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GCashAccountSetting extends Model
{
    protected $table = 'gcash_account_settings';
    
    protected $fillable = [
        'account_name',
        'account_number',
        'enabled'
    ];

    protected $casts = [
        'enabled' => 'boolean'
    ];
}
