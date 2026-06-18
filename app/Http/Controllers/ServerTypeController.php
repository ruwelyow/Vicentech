<?php

namespace App\Http\Controllers;

use App\Models\ServerType;

class ServerTypeController extends Controller
{
    // List only enabled server types
    public function index()
    {
        return response()->json(ServerType::where('enabled', true)->orderBy('name')->get());
    }
} 