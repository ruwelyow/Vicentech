<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'message' => 'Admin dashboard access granted',
            'user' => auth()->user(),
        ]);
    }
}
