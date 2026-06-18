<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        // If user is authenticated, check their status
        if ($user && $user->status === 'inactive') {
            // Log out the user
            Auth::logout();
            
            // Invalidate the session
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            // Return appropriate response
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Your account has been deactivated. Please contact an administrator for assistance.',
                    'error' => 'account_deactivated'
                ], 401);
            }
            
            return redirect('/login')->with('error', 'Your account has been deactivated. Please contact an administrator for assistance.');
        }

        return $next($request);
    }
}
