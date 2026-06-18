<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StaffMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        if (!$user || !$user->is_staff) {
            return response()->json(['error' => 'Unauthorized. Staff only.'], 403);
        }
        return $next($request);
    }
} 