<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServerType;
use Illuminate\Http\Request;

class ServerTypeController extends Controller
{
    // List all server types
    public function index()
    {
        return response()->json(ServerType::orderBy('name')->get());
    }

    // Enable or disable a server type
    public function update(Request $request, $id)
    {
        $request->validate([
            'enabled' => 'required|boolean',
        ]);
        $type = ServerType::findOrFail($id);
        $type->enabled = $request->enabled;
        $type->save();
        return response()->json($type);
    }

    // Add a new server type
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:server_types,name',
        ]);
        $type = ServerType::create([
            'name' => $validated['name'],
            'enabled' => true,
        ]);
        return response()->json($type, 201);
    }

    // Delete a server type
    public function destroy($id)
    {
        \Log::info('Attempting to delete applicant', ['id' => $id]);
        $applicant = ServerType::find($id);
        \Log::info('Applicant found?', ['applicant' => $applicant]);
        $type = ServerType::findOrFail($id);
        $type->delete();
        return response()->json(['message' => 'Server type deleted']);
    }
} 