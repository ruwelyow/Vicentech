<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\SendsPasswordResetEmails;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use App\Models\User;

class ForgotPasswordController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Password Reset Controller
    |--------------------------------------------------------------------------
    |
    | This controller is responsible for handling password reset emails and
    | includes a trait which assists in sending these notifications from
    | your application to your users. Feel free to explore this trait.
    |
    */

    use SendsPasswordResetEmails;

    /**
     * Send a reset link to the given user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
     */
    public function sendResetLinkEmail(Request $request)
    {
        $this->validateEmail($request);

        // Check if user exists
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            // User doesn't exist, return error
            \Log::warning('Password reset attempt for non-existent email', [
                'email' => $request->email,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            if ($request->expectsJson()) {
                return new JsonResponse(['message' => 'Email is not registered in our system.'], 422);
            }
            
            return back()->withErrors(['email' => 'Email is not registered in our system.']);
        }

        // User exists, send the reset email
        $response = $this->broker()->sendResetLink(
            $this->credentials($request)
        );
        
        // Log the password reset attempt
        \Log::info('Password reset email sent', [
            'email' => $request->email,
            'user_id' => $user->id,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        // Return success message
        if ($request->expectsJson()) {
            return new JsonResponse(['message' => 'Password reset email sent! Check your inbox for further instructions.'], 200);
        }
        
        return back()->with('status', 'Password reset email sent! Check your inbox for further instructions.');
    }

    protected function sendResetLinkResponse(Request $request, $response)
    {
        if ($request->expectsJson()) {
            return new JsonResponse(['message' => 'Password reset email sent! Check your inbox for further instructions.'], 200);
        }
        return back()->with('status', 'Password reset email sent! Check your inbox for further instructions.');
    }

    protected function sendResetLinkFailedResponse(Request $request, $response)
    {
        if ($request->expectsJson()) {
            return new JsonResponse(['message' => 'Password reset email sent! Check your inbox for further instructions.'], 200);
        }
        return back()->with('status', 'Password reset email sent! Check your inbox for further instructions.');
    }
}
