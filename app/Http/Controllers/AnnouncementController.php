<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use App\Notifications\AnnouncementCreated;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Announcement::orderBy('created_at', 'desc')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'date' => 'required|date',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:4096',
            ]);

            $imageData = null;
            $imageMime = null;
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $imageData = base64_encode(file_get_contents($file->getRealPath()));
                $imageMime = $file->getMimeType();
            }

            $announcement = Announcement::create([
                'title' => $request->title,
                'description' => $request->description,
                'date' => $request->date,
                'image_data' => $imageData,
                'image_mime' => $imageMime,
            ]);

            // Notify all users (optional)
            try {
                $users = \App\Models\User::all();
                \Illuminate\Support\Facades\Notification::send($users, new \App\Notifications\AnnouncementCreated($announcement));
            } catch (\Exception $e) {
                // Log the error but don't fail the announcement creation
                \Log::error('Failed to send announcement notifications: ' . $e->getMessage());
            }

            return response()->json($announcement, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating announcement: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create announcement'], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $announcement = Announcement::find($id);
            if (!$announcement) {
                return response()->json(['error' => 'Announcement not found'], 404);
            }

            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'date' => 'required|date',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:4096',
            ]);

            // Handle image update
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $imageData = base64_encode(file_get_contents($file->getRealPath()));
                $imageMime = $file->getMimeType();
                
                $announcement->update([
                    'title' => $request->title,
                    'description' => $request->description,
                    'date' => $request->date,
                    'image_data' => $imageData,
                    'image_mime' => $imageMime,
                ]);
            } else {
                // Update without changing the image
                $announcement->update([
                    'title' => $request->title,
                    'description' => $request->description,
                    'date' => $request->date,
                ]);
            }

            return response()->json($announcement, 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating announcement: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update announcement'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $announcement = Announcement::find($id);
        if (!$announcement) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $announcement->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
