<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class ListUsersWithEmails extends Command
{
    protected $signature = 'test:list-users';
    protected $description = 'List all users with email addresses';

    public function handle()
    {
        $this->info("📧 Users with email addresses:");
        
        $users = User::whereNotNull('email')
                    ->where('email', '!=', '')
                    ->where('email', 'REGEXP', '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
                    ->get(['id', 'name', 'email']);

        if ($users->isEmpty()) {
            $this->error("❌ No users with valid email addresses found.");
            return 1;
        }

        foreach ($users as $user) {
            $this->info("   • ID: {$user->id} | Name: {$user->name} | Email: {$user->email}");
        }

        $this->info("📊 Total users with emails: {$users->count()}");
        
        return 0;
    }
}
