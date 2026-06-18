<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PasswordHistory;
use Illuminate\Foundation\Auth\RegistersUsers;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;
use Carbon\Carbon;

class RegisterController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Register Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles the registration of new users as well as their
    | validation and creation. By default, this controller uses a trait to
    | provide this functionality without requiring any additional code.
    |
    */

    // Optional: you can remove this if you're fully overriding behavior
    // use RegistersUsers;

    /**
     * Where to redirect users after registration.
     *
     * @var string
     */
    protected $redirectTo = '/home';

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    // public function __construct()
    // {
    //     // $this->middleware('guest');
    // }

    /**
     * Handle a registration request for the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        \Log::info('RegisterController@register called');

        try {
            $this->validator($request->all())->validate();
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed:', $e->errors());
            return response()->json(['errors' => $e->errors()], 422);
        }

        $user = $this->create($request->all());

        \Log::info('User successfully logged in');

        return response()->json([
            'message' => 'User registered successfully.',
            'user' => $user,
        ], 201);
    }

    /**
     * Get a validator for an incoming registration request.
     * Accepts either a single `name` field OR separated fields: first_name, middle_name, last_name, suffix.
     *
     * @param  array  $data
     * @return \Illuminate\Contracts\Validation\Validator
     */
    protected function validator(array $data)
    {
        return Validator::make($data, [
            // Either provide full name or separate fields
            'name' => ['sometimes', 'string', 'max:255'],
            'first_name' => ['required_without:name', 'string', 'max:100', 'regex:/^[\p{L}\s.]+$/u'],
            'middle_name' => ['nullable', 'string', 'max:100', 'regex:/^[\p{L}\s.]*$/u'],
            'last_name' => ['required_without:name', 'string', 'max:100', 'regex:/^[\p{L}\s.]+$/u'],
            'suffix' => ['nullable', 'string', 'max:20', 'regex:/^[\p{L}.]*$/u'],

            // make email optional for staff/admin/priest created from admin UI
            'email' => ['sometimes', 'nullable', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['required', 'string', 'max:20'],
            'gender' => ['required', 'string', 'in:male,female'],
            'birthdate' => ['required', 'date', 'before:today'],
            'address' => ['required', 'string', 'max:500', 'regex:/^[\p{L}0-9\s,.\-#\/()]+$/u'],
            // Add role field validation (optional fields)
            'is_admin' => ['sometimes', 'boolean'],
            'is_staff' => ['sometimes', 'boolean'],
            'is_priest' => ['sometimes', 'boolean'],
        ], [
            'first_name.regex' => 'First Name may only contain letters, spaces, and periods (for middle initials). Numbers and other special characters are not allowed.',
            'middle_name.regex' => 'Middle Name may only contain letters, spaces, and periods (for middle initials). Numbers and other special characters are not allowed.',
            'last_name.regex' => 'Last Name may only contain letters, spaces, and periods. Numbers and other special characters are not allowed.',
            'suffix.regex' => 'Suffix may only contain letters and periods (e.g., Jr., Sr.).',
            'address.regex' => 'Address may only contain letters, numbers, spaces, and common address characters (comma, period, hyphen, hash, slash, parentheses).',
        ]);
    }

    /**
     * Build displayable full name from either a single name or parts.
     */
    protected function makeFullName(array $data): string
    {
        if (!empty($data['name'] ?? null)) {
            return trim($data['name']);
        }

        $parts = [];
        if (!empty($data['first_name'] ?? null)) $parts[] = trim($data['first_name']);
        if (!empty($data['middle_name'] ?? null)) $parts[] = trim($data['middle_name']);
        if (!empty($data['last_name'] ?? null)) $parts[] = trim($data['last_name']);
        if (!empty($data['suffix'] ?? null)) $parts[] = trim($data['suffix']);

        return trim(implode(' ', array_filter($parts, fn($p) => $p !== '')));
    }

    /**
     * Create a new user instance after a valid registration.
     *
     * @param  array  $data
     * @return \App\Models\User
     */
    protected function create(array $data)
    {
        \Log::info('Trying to create user:', $data);
        \Log::info('Role fields received:', [
            'is_admin' => $data['is_admin'] ?? 'not set',
            'is_staff' => $data['is_staff'] ?? 'not set', 
            'is_priest' => $data['is_priest'] ?? 'not set'
        ]);
    
        // Calculate age from birthdate
        $birthdate = new \DateTime($data['birthdate']);
        $today = new \DateTime();
        $age = $today->diff($birthdate)->y;
        
        // Generate OTP
        $otp = rand(100000, 999999);

        $fullName = $this->makeFullName($data);
    
        $user = User::create([
            'name' => $fullName,
            'email' => $data['email'] ?? null,
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'],
            'gender' => $data['gender'],
            'birthdate' => $data['birthdate'],
            'address' => $data['address'],
            'age' => $age,
            'otp' => $otp,
            'otp_expires_at' => Carbon::now()->addMinutes(10),
            // Add role fields
            'is_admin' => $data['is_admin'] ?? false,
            'is_staff' => $data['is_staff'] ?? false,
            'is_priest' => $data['is_priest'] ?? false,
        ]);

        // Store the initial password in history
        PasswordHistory::storePassword($user->id, $data['password']);
    
        \Log::info('Created user object:', $user->toArray());

        // Send OTP email only when email exists
        if (!empty($user->email)) {
            Mail::to($user->email)->send(new OtpMail($otp));
        } else {
            \Log::info('No email provided for user, skipping OTP email send', ['user_id' => $user->id]);
        }
    
        return $user;
    }
    
    public function showRegistrationForm()
    {
        return view('auth.register'); // This will look for resources/views/auth/register.blade.php
    }
}
