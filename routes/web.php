<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\EventController;

// Group for web middleware and React entry
Route::middleware('web')->group(function () {
    // Authentication for React SPA
    Route::get('/login', fn () => view('welcome'))->name('login');
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::post('/register', [RegisterController::class, 'register']);

    // CSRF token endpoint for SPA
    Route::get('/csrf-token', fn () => response()->json(['csrf_token' => csrf_token()]));

    // Staff Donation Pictures Management (session auth)
    Route::middleware('auth')->prefix('api/admin')->group(function () {
        Route::get('/donation-pictures', [\App\Http\Controllers\Admin\DonationPictureController::class, 'index']);
        Route::post('/donation-pictures', [\App\Http\Controllers\Admin\DonationPictureController::class, 'store']);
        Route::put('/donation-pictures/{id}/toggle', [\App\Http\Controllers\Admin\DonationPictureController::class, 'toggle']);
        Route::delete('/donation-pictures/{id}', [\App\Http\Controllers\Admin\DonationPictureController::class, 'destroy']);
        
        // GCash Account Management
        Route::get('/gcash-accounts', [\App\Http\Controllers\Admin\GCashAccountController::class, 'index']);
        Route::post('/gcash-accounts', [\App\Http\Controllers\Admin\GCashAccountController::class, 'store']);
        Route::put('/gcash-accounts/{id}', [\App\Http\Controllers\Admin\GCashAccountController::class, 'update']);
        Route::put('/gcash-accounts/{id}/toggle', [\App\Http\Controllers\Admin\GCashAccountController::class, 'toggle']);
        Route::delete('/gcash-accounts/{id}', [\App\Http\Controllers\Admin\GCashAccountController::class, 'destroy']);
    });

    // Public fallback (React handles rendering)
    Route::get('/', fn () => view('welcome'))->name('home');
    Route::get('/search', [SearchController::class, 'search'])->name('search');
        Route::get('/virtual-tour', function () {
            return response()->file(public_path('virtual-tour/index.html'));
        });

    // Password reset
    Route::post('/password/email', [ForgotPasswordController::class, 'sendResetLinkEmail']);
    Route::post('/password/reset', [\App\Http\Controllers\Auth\ResetPasswordController::class, 'reset']);

    // Event routes (removed - using API routes instead for React frontend)
    // Route::get('/events/{event}/join', [EventController::class, 'showJoinForm'])->name('events.join');
    // Route::post('/events/{event}/join', [EventController::class, 'joinEvent'])->name('events.join.submit');

    // Optional: Debug/Test route
    Route::get('/test-user', function () {
        $user = \App\Models\User::where('email', 'staff@church.com')->first();
        return response()->json($user ? [
            'exists' => true,
            'user' => $user,
            'password_check' => Hash::check('password', $user->password),
        ] : ['exists' => false]);
    });

    // Specific routes for React SPA
    Route::get('/admin', fn () => view('welcome'));
    Route::get('/staff', fn () => view('welcome'));
    Route::get('/parishioner', fn () => view('welcome'));
    Route::get('/priest', fn () => view('welcome'));
    Route::get('/events', fn () => view('welcome'));
    Route::get('/donations', fn () => view('welcome'));
    Route::get('/sacraments', fn () => view('welcome'));
    Route::get('/families', fn () => view('welcome'));
    Route::get('/analytics', fn () => view('welcome'));
    Route::get('/mortuary', fn () => view('welcome'));
    Route::get('/records', fn () => view('welcome'));
    Route::get('/certificates', fn () => view('welcome'));
    Route::get('/announcements', fn () => view('welcome'));
    Route::get('/news', fn () => view('welcome'));
    Route::get('/prayers', fn () => view('welcome'));
    Route::get('/calendar', fn () => view('welcome'));
    Route::get('/profile', fn () => view('welcome'));
    Route::get('/settings', fn () => view('welcome'));
    
    // Serve storage files for rectors (bypass symlink issues on Windows)
    // This route must be before the catch-all route
    Route::get('/storage/rectors/{filename}', function ($filename) {
        // Security: sanitize filename to prevent directory traversal
        $filename = basename($filename);
        
        $path = 'rectors/' . $filename;
        
        if (!Storage::disk('public')->exists($path)) {
            abort(404);
        }
        
        return Storage::disk('public')->response($path);
    })->where('filename', '.*');
    
    // Serve donation pictures directly from storage (bypass symlink issues)
    // This route must be before the catch-all route
    Route::get('/storage/donation_pictures/{filename}', function ($filename) {
        try {
            // Security: sanitize filename to prevent directory traversal
            $filename = basename($filename);
            
            // Construct the storage path
            $path = 'donation_pictures/' . $filename;
            
            // Check if file exists
            if (!Storage::disk('public')->exists($path)) {
                \Log::warning('Donation picture not found in storage', [
                    'filename' => $filename,
                    'path' => $path,
                    'requested_url' => request()->fullUrl()
                ]);
                abort(404, 'Image not found');
            }
            
            // Get the file and return it with proper headers
            return Storage::disk('public')->response($path);
        } catch (\Exception $e) {
            \Log::error('Error serving donation picture', [
                'filename' => $filename ?? 'unknown',
                'error' => $e->getMessage()
            ]);
            abort(500, 'Error serving image');
        }
    })->where('filename', '[^/]+');
    
    // Catch-all route for React SPA
    Route::get('/{any}', fn () => view('welcome'))->where('any', '.*');
});

Auth::routes(['register' => false, 'login' => false]);
