<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        // Accept either email or username (mapped to `name`) for login
        $request->validate([
            'email' => 'required_without:username|nullable|email',
            'username' => 'required_without:email|nullable|string',
            'password' => 'required|string',
        ]);

        $remember = $request->boolean('remember');

        $attempt = false;

        // If email is present and valid, try email login first
        if ($request->filled('email') && filter_var($request->email, FILTER_VALIDATE_EMAIL)) {
            $attempt = Auth::attempt(['email' => $request->email, 'password' => $request->password], $remember);
        }

        // If email attempt didn't happen or failed, try username (stored in `name`)
        if (!$attempt && $request->filled('username')) {
            $attempt = Auth::attempt(['name' => $request->username, 'password' => $request->password], $remember);
        }

        if (!$attempt) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        // Check if user is verified
        $user = Auth::user();
        if (is_null($user->email_verified_at)) {
            // Generate and send OTP
            $otp = rand(100000, 999999);
            $user->otp = $otp;
            $user->otp_expires_at = now()->addMinutes(10);
            $user->save();
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\OtpMail($otp));
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => 'You must verify your email before logging in.'
            ]);
        }

        // Check if user account is deactivated
        if ($user->status === 'inactive') {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => 'Your account has been deactivated. Please contact an administrator for assistance.'
            ]);
        }

        // Update last login time
        $user->last_login_at = now();
        $user->save();

        $request->session()->regenerate();

        return response()->json([
            'user' => $user,
            'message' => 'Login successful'
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
