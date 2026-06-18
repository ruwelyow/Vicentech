<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DonationPicture;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DonationPictureController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $pictures = DonationPicture::orderBy('created_at', 'desc')->get();
        
        // Ensure all image paths use the correct URL format and verify files exist
        $pictures->transform(function ($picture) {
            // Initialize file_exists flag
            $picture->file_exists = false;
            
            if ($picture->image_path && !str_starts_with($picture->image_path, 'http')) {
                $relativePath = null;
                
                // Convert old format (/storage/path) or relative paths to full URL
                if (str_starts_with($picture->image_path, '/storage/')) {
                    // Path is already in correct format, get relative path for checking
                    $relativePath = str_replace('/storage/', '', $picture->image_path);
                } else {
                    // Assume it's already a relative path
                    $relativePath = $picture->image_path;
                }
                
                // Check if file exists using the relative path
                if ($relativePath) {
                    // Check if file exists in storage (primary check)
                    $existsInStorage = Storage::disk('public')->exists($relativePath);
                    
                    if ($existsInStorage) {
                        // File exists in storage, mark as existing
                        $picture->file_exists = true;
                        
                        // Always use /storage/ path format (relative path)
                        // The route we added will serve it directly if symlink doesn't work
                        $picture->image_path = '/storage/' . $relativePath;
                    } else {
                        // File doesn't exist in storage
                        $picture->file_exists = false;
                        // Keep the original path but mark as not existing
                        \Log::warning('Donation picture file not found in storage', [
                            'id' => $picture->id,
                            'relative_path' => $relativePath,
                            'image_path' => $picture->getOriginal('image_path'),
                        ]);
                    }
                } else {
                    // No valid path, mark as not existing
                    $picture->file_exists = false;
                }
            } else {
                // For HTTP URLs, assume file exists (can't verify easily)
                $picture->file_exists = (bool)$picture->image_path;
            }
            return $picture;
        });
        
        return response()->json($pictures);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'image' => 'required|file|mimes:jpg,jpeg,png,gif,webp|max:5120' // 5MB max
        ]);

        try {
            $file = $request->file('image');
            $guessedExt = $file->guessExtension();
            $originalExt = $file->getClientOriginalExtension();
            $ext = $guessedExt ?: $originalExt ?: 'png';
            $filename = (string) Str::uuid() . '.' . strtolower($ext);
            $path = $file->storeAs('donation_pictures', $filename, 'public');
            
            // Verify the file was actually saved
            if (!Storage::disk('public')->exists($path)) {
                throw new \Exception('File was not saved to storage');
            }
            
            // Get the full path to verify file exists
            $fullPath = Storage::disk('public')->path($path);
            
            // Use consistent /storage/ path format
            // This ensures the route we added can serve it if symlink doesn't work
            $url = '/storage/' . $path;
            
            // Log for debugging
            \Log::info('Donation picture uploaded', [
                'path' => $path,
                'url' => $url,
                'full_path' => $fullPath,
                'exists' => file_exists($fullPath),
                'public_storage_exists' => file_exists(public_path('storage/donation_pictures/' . basename($path)))
            ]);
            
            $donationPicture = DonationPicture::create([
                'image_path' => $url,
                'original_name' => $file->getClientOriginalName(),
                'enabled' => true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully',
                'data' => $donationPicture
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $picture = DonationPicture::find($id);
        if (!$picture) {
            return response()->json(['error' => 'Image not found'], 404);
        }
        return response()->json($picture);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $picture = DonationPicture::find($id);
        if (!$picture) {
            return response()->json(['error' => 'Image not found'], 404);
        }

        $request->validate([
            'enabled' => 'boolean'
        ]);

        $picture->update($request->only(['enabled']));

        return response()->json([
            'success' => true,
            'message' => 'Image updated successfully',
            'data' => $picture
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $picture = DonationPicture::find($id);
        if (!$picture) {
            return response()->json(['error' => 'Image not found'], 404);
        }

        try {
            // Delete the file from storage if it exists
            if ($picture->image_path) {
                $relativePath = str_replace('/storage/', '', $picture->image_path);
                // Only try to delete if file exists
                if (Storage::disk('public')->exists($relativePath)) {
                    Storage::disk('public')->delete($relativePath);
                }
            }

            $picture->delete();

            return response()->json([
                'success' => true,
                'message' => 'Image deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle the enabled status of a donation picture
     */
    public function toggle(Request $request, string $id)
    {
        $picture = DonationPicture::find($id);
        if (!$picture) {
            return response()->json(['error' => 'Image not found'], 404);
        }

        $request->validate([
            'enabled' => 'required|boolean'
        ]);

        $picture->enabled = $request->enabled;
        $picture->save();

        return response()->json([
            'success' => true,
            'message' => 'Image status updated successfully',
            'data' => $picture
        ]);
    }
}
