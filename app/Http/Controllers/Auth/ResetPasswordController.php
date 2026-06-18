<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PasswordHistory;
use App\Models\User;
use App\Rules\NotInPasswordHistory;
use Illuminate\Foundation\Auth\ResetsPasswords;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class ResetPasswordController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Password Reset Controller
    |--------------------------------------------------------------------------
    |
    | This controller is responsible for handling password reset requests
    | and uses a simple trait to include this behavior. You're free to
    | explore this trait and override any methods you wish to tweak.
    |
    */

    use ResetsPasswords;

    /**
     * Where to redirect users after resetting their password.
     *
     * @var string
     */
    protected $redirectTo = '/home';

    protected function sendResetResponse(Request $request, $response)
    {
        if ($request->expectsJson()) {
            return new JsonResponse(['message' => trans($response)], 200);
        }
        return redirect($this->redirectPath())
            ->with('status', trans($response));
    }

    protected function sendResetFailedResponse(Request $request, $response)
    {
        if ($request->expectsJson()) {
            return new JsonResponse(['message' => trans($response)], 422);
        }
        return redirect()->back()
            ->withInput($request->only('email'))
            ->withErrors(['email' => trans($response)]);
    }

    /**
     * Get the password reset validation rules.
     */
    protected function rules()
    {
        $email = request()->input('email');
        
        return [
            'token' => 'required',
            'email' => 'required|email',
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                function ($attribute, $value, $fail) use ($email) {
                    // Get user by email to check password history
                    $user = User::where('email', $email)->first();
                    if ($user && PasswordHistory::hasUsedPassword($user->id, $value)) {
                        $fail('The password cannot be the same as a previously used password.');
                    }
                }
            ],
        ];
    }

    /**
     * Reset the given user's password.
     */
    protected function resetPassword($user, $password)
    {
        // Store current password in history before updating (need to get the plain text)
        // Since we can't reverse the hash, we'll store the new password after validation
        // and before updating the user
        
        // Update user's password
        $user->password = Hash::make($password);
        $user->setRememberToken(Str::random(60));
        $user->save();

        // Store the new password in history after successful update
        PasswordHistory::storePassword($user->id, $password);

        // Clean up old password history (keep only last 5 passwords)
        PasswordHistory::cleanupOldPasswords($user->id, 5);

        event(new \Illuminate\Auth\Events\PasswordReset($user));
    }

    /**
     * Reset the given user's password.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
     */
    public function reset(Request $request)
    {
        // Get the email before validation
        $email = $request->input('email');
        
        // Create custom validation rules with email
        $rules = [
            'token' => 'required',
            'email' => 'required|email',
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                function ($attribute, $value, $fail) use ($email) {
                    // Get user by email to check password history
                    $user = User::where('email', $email)->first();
                    if ($user && PasswordHistory::hasUsedPassword($user->id, $value)) {
                        $fail('The password cannot be the same as a previously used password.');
                    }
                }
            ],
        ];
        
        $request->validate($rules, $this->validationErrorMessages());

        // Here we will attempt to reset the user's password. If it is successful we
        // will update the password on an actual user model and persist it to the
        // database. Otherwise we will parse the error and return the response.
        $response = $this->broker()->reset(
            $this->credentials($request), function ($user, $password) {
                $this->resetPassword($user, $password);
            }
        );

        // If the password was successfully reset, we will redirect the user back to
        // the application's home authenticated view. If there is an error we can
        // redirect them back to where they came from with their error message.
        return $response == Password::PASSWORD_RESET
                    ? $this->sendResetResponse($request, $response)
                    : $this->sendResetFailedResponse($request, $response);
    }
}
