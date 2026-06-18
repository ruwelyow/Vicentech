<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class PasswordHistory extends Model
{
    use HasFactory;

    protected $table = 'password_history';

    protected $fillable = [
        'user_id',
        'password_hash',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Get the user that owns the password history record
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Store a password in history
     */
    public static function storePassword($userId, $password)
    {
        return self::create([
            'user_id' => $userId,
            'password_hash' => Hash::make($password),
        ]);
    }

    /**
     * Check if a password has been used before by this user
     */
    public static function hasUsedPassword($userId, $password)
    {
        $histories = self::where('user_id', $userId)->get();
        
        foreach ($histories as $history) {
            if (Hash::check($password, $history->password_hash)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Clean up old password history (keep only last N passwords)
     */
    public static function cleanupOldPasswords($userId, $keepCount = 5)
    {
        $passwords = self::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        if ($passwords->count() > $keepCount) {
            $toDelete = $passwords->skip($keepCount);
            foreach ($toDelete as $password) {
                $password->delete();
            }
        }
    }
}