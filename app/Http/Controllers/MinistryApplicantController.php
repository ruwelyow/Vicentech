<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MinistryApplicant;

class MinistryApplicantController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255', 'regex:/^[\p{L}\s.]+$/u'],
            'last_name' => ['required', 'string', 'max:255', 'regex:/^[\p{L}\s.]+$/u'],
            'birthdate' => 'required|date|before:today',
            'gender' => 'required|string',
            'email' => 'required|email',
            'phone' => 'required|string',
            'address' => ['required', 'string', 'max:500', 'regex:/^[\p{L}0-9\s,.\-#\/()]+$/u'],
            'server_type' => 'required|string',
            'motivation' => 'required|string',
            'commitment' => 'required|boolean',
        ], [
            'first_name.regex' => 'First Name may only contain letters, spaces, and periods (for middle initials). Numbers and other special characters are not allowed.',
            'last_name.regex' => 'Last Name may only contain letters, spaces, and periods. Numbers and other special characters are not allowed.',
            'address.regex' => 'Address may only contain letters, numbers, spaces, and common address characters (comma, period, hyphen, hash, slash, parentheses).',
        ]);

        // Calculate age from birthdate and validate minimum age of 10 years
        $birthdate = new \DateTime($validated['birthdate']);
        $today = new \DateTime();
        $age = $today->diff($birthdate)->y;

        if ($age < 10) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => [
                    'age' => ['Minimum age requirement is 10 years old. Your age is ' . $age . ' years.']
                ]
            ], 422);
        }

        $validated['status'] = 'pending';

        $applicant = MinistryApplicant::create($validated);

        return response()->json($applicant, 201);
    }
}
