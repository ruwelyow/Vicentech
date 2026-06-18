<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ministry;
use Illuminate\Http\Request;

class MinistryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $ministries = Ministry::orderBy('order', 'asc')->get();
            return response()->json($ministries);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch ministries: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ministries'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'order' => 'nullable|integer|min:0',
            ]);

            $ministry = new Ministry();
            $ministry->name = $validated['name'];
            $ministry->description = $validated['description'] ?? null;
            $ministry->order = $validated['order'] ?? 0;

            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $ministry->image_data = base64_encode(file_get_contents($file->getRealPath()));
                $ministry->image_mime = $file->getMimeType();
            }

            $ministry->save();

            return response()->json([
                'success' => true,
                'message' => 'Ministry created successfully',
                'ministry' => $ministry->fresh()
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Ministry creation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create ministry: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $ministry = Ministry::findOrFail($id);
            return response()->json($ministry);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ministry not found'
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $ministry = Ministry::findOrFail($id);

            \Log::info('Ministry update request received', [
                'id' => $id,
                'request_data' => $request->all(),
                'has_image' => $request->hasFile('image'),
            ]);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'order' => 'nullable|integer|min:0',
            ]);

            $ministry->name = $validated['name'];
            $ministry->description = $validated['description'] ?? null;
            if (isset($validated['order'])) {
                $ministry->order = (int)$validated['order'];
            }

            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $ministry->image_data = base64_encode(file_get_contents($file->getRealPath()));
                $ministry->image_mime = $file->getMimeType();
            }

            $ministry->save();

            return response()->json([
                'success' => true,
                'message' => 'Ministry updated successfully',
                'ministry' => $ministry->fresh()
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Ministry update validation failed', [
                'id' => $id,
                'errors' => $e->errors(),
                'request_all' => $request->all(),
                'request_input' => $request->input(),
                'request_method' => $request->method(),
                'content_type' => $request->header('Content-Type'),
                'name' => $request->input('name'),
                'description' => $request->input('description'),
                'order' => $request->input('order'),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Ministry update failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update ministry: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $ministry = Ministry::findOrFail($id);
            $ministry->delete();

            return response()->json([
                'success' => true,
                'message' => 'Ministry deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Ministry deletion failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete ministry: ' . $e->getMessage()
            ], 500);
        }
    }
}
