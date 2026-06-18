<?php

namespace App\Rules;

use App\Models\PasswordHistory;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NotInPasswordHistory implements ValidationRule
{
    protected $userId;

    public function __construct($userId)
    {
        $this->userId = $userId;
    }

    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (PasswordHistory::hasUsedPassword($this->userId, $value)) {
            $fail('The :attribute cannot be the same as a previously used password.');
        }
    }
}