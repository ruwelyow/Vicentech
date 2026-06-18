<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\News;
use Illuminate\Support\Facades\Storage;

class NewsController extends Controller
{
    public function index()
    {
        return response()->json(News::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'image' => 'nullable|string',
            'title' => 'required|string|max:255',
            'date' => 'required|string|max:255',
            'quote' => 'nullable|string|max:255',
            'content' => 'nullable|string',
        ]);
        $news = News::create($validated);
        return response()->json($news, 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'image' => 'nullable|string',
            'title' => 'required|string|max:255',
            'date' => 'required|string|max:255',
            'quote' => 'nullable|string|max:255',
            'content' => 'nullable|string',
        ]);
        $news = News::findOrFail($id);
        $news->update($validated);
        return response()->json($news);
    }

    public function destroy($id)
    {
        $news = News::findOrFail($id);
        $news->delete();
        return response()->json(['message' => 'News deleted successfully.']);
    }

    public function show($id)
    {
        return response()->json(News::findOrFail($id));
    }
}
