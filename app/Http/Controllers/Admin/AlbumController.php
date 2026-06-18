<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Album;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AlbumController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Eager load images to prevent N+1 problem
        return Album::with('images')->latest()->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $album = Album::create($validated);

        return response()->json($album, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Album $album)
    {
        // Eager load images
        return $album->load('images');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Album $album)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $album->update($validated);

        return response()->json($album);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Album $album)
    {
        // Logic to delete images associated with the album if needed
        foreach ($album->images as $image) {
            // Only try to delete the file if path is set (for file-based images)
            if (!empty($image->path)) {
                Storage::disk('public')->delete($image->path);
            }
            $image->delete();
        }

        $album->delete();

        return response()->json(null, 204);
    }

    /**
     * Upload images to a specific album.
     */
    public function uploadImages(Request $request, Album $album)
    {
        $validated = $request->validate([
            'images' => 'required',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,svg|max:10240',
            'captions' => 'nullable|array',
            'captions.*' => 'nullable|string',
        ]);

        $images = $request->file('images');
        if (!is_array($images)) {
            $images = [$images];
        }
        $captions = $request->input('captions', []);

        foreach ($images as $index => $file) {
            $imageData = base64_encode(file_get_contents($file->getRealPath()));
            $imageMime = $file->getMimeType();
            $album->images()->create([
                'image_data' => $imageData,
                'image_mime' => $imageMime,
                'caption' => $captions[$index] ?? null,
            ]);
        }
        return response()->json($album->load('images'), 201);
    }

    /**
     * Delete a specific image from an album.
     */
    public function deleteImage(Album $album, $imageId)
    {
        $image = $album->images()->findOrFail($imageId);

        // Only try to delete the file if path is set
        if (!empty($image->path)) {
            Storage::disk('public')->delete($image->path);
        }

        $image->delete();

        return response()->json(null, 204);
    }

    public function updateImage(Request $request, $imageId)
    {
        $image = \App\Models\Image::findOrFail($imageId);

        $validated = $request->validate([
            'caption' => 'nullable|string',
        ]);

        $image->update($validated);

        return response()->json($image);
    }
} 