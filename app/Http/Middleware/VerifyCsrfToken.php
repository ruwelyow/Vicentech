<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;
use Illuminate\Support\Facades\Log;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle($request, \Closure $next)
    {
        // Log CSRF token information for debugging
        if ($request->isMethod('POST')) {
            Log::info('CSRF Token Check', [
                'url' => $request->url(),
                'has_token' => $request->hasHeader('X-CSRF-TOKEN'),
                'token_length' => strlen($request->header('X-CSRF-TOKEN', '')),
                'session_token' => $request->session()->token(),
                'session_id' => $request->session()->getId(),
            ]);
        }

        try {
            return parent::handle($request, $next);
        } catch (\Illuminate\Session\TokenMismatchException $e) {
            Log::warning('CSRF Token Mismatch', [
                'url' => $request->url(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'CSRF token mismatch. Please refresh the page and try again.',
                    'error' => 'csrf_token_mismatch'
                ], 419);
            }

            return redirect()->back()->withErrors(['csrf' => 'CSRF token mismatch. Please refresh the page and try again.']);
        }
    }
} 