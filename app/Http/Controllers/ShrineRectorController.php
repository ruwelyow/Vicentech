<?php

namespace App\Http\Controllers;

use App\Models\ShrineRector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ShrineRectorController extends Controller
{
    // Public: List all rectors
    public function index()
    {
        return ShrineRector::orderBy('type')->orderBy('years', 'desc')->get();
    }

    // Admin: Store new rector
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'years' => 'nullable|string|max:255',
            'ordination_date' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:current,past',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:4096',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('rectors', 'public');
            $validated['image'] = $path;
        }

        $rector = ShrineRector::create($validated);
        return response()->json($rector, 201);
    }

    // Admin: Update rector
    public function update(Request $request, $id)
    {
        $rector = ShrineRector::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'years' => 'nullable|string|max:255',
            'ordination_date' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:current,past',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:4096',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($rector->image) {
                Storage::disk('public')->delete($rector->image);
            }
            $path = $request->file('image')->store('rectors', 'public');
            $validated['image'] = $path;
        }

        $rector->update($validated);
        return response()->json($rector);
    }

    // Admin: Delete rector
    public function destroy($id)
    {
        $rector = ShrineRector::findOrFail($id);
        if ($rector->image) {
            Storage::disk('public')->delete($rector->image);
        }
        $rector->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
