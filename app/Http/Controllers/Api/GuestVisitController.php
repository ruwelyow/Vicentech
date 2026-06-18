<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\GuestVisit;

class GuestVisitController extends Controller
{
    private function getClientIpV4(Request $request): string
    {
        // Prefer proxy headers if present
        $forwarded = $request->headers->get('x-forwarded-for') ?? $request->headers->get('X-Forwarded-For');
        if ($forwarded) {
            $parts = array_map('trim', explode(',', $forwarded));
            foreach ($parts as $ip) {
                // Extract IPv4 from possible IPv6-mapped address
                if (preg_match('/^::ffff:(\d+\.\d+\.\d+\.\d+)$/', $ip, $m)) {
                    return $m[1];
                }
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                    return $ip;
                }
            }
        }

        $ip = $request->ip();
        if ($ip === '::1') {
            return '127.0.0.1';
        }
        if (preg_match('/^::ffff:(\d+\.\d+\.\d+\.\d+)$/', $ip, $m)) {
            return $m[1];
        }
        // As a last resort, try REMOTE_ADDR
        $remote = $request->server('REMOTE_ADDR');
        if (filter_var($remote, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return $remote;
        }
        return $ip;
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'cookie_id' => 'required|string|max:255',
            'accepted' => 'required|boolean',
            'url_path' => 'nullable|string|max:255',
            'visit_start' => 'nullable|date',
            'visit_end' => 'nullable|date',
            'pages_viewed' => 'nullable|array',
            'session_duration' => 'nullable|integer',
        ]);

        $visit = GuestVisit::create([
            'cookie_id' => $data['cookie_id'],
            'ip_address' => $this->getClientIpV4($request),
            'user_agent' => $request->userAgent(),
            'referer' => $request->headers->get('referer'),
            'url_path' => $data['url_path'] ?? $request->path(),
            'accepted' => $data['accepted'],
            'accepted_at' => $data['accepted'] ? now() : null,
            'visit_start' => $data['visit_start'] ?? now(),
            'visit_end' => $data['visit_end'] ?? null,
            'pages_viewed' => $data['pages_viewed'] ?? [],
            'session_duration' => $data['session_duration'] ?? null,
        ]);

        return response()->json(['success' => true, 'data' => $visit]);
    }

    public function updateVisit(Request $request, $id)
    {
        $data = $request->validate([
            'visit_end' => 'nullable|date',
            'pages_viewed' => 'nullable|array',
            'session_duration' => 'nullable|integer',
        ]);

        $visit = GuestVisit::findOrFail($id);
        $visit->update($data);

        return response()->json(['success' => true, 'data' => $visit]);
    }

    public function trackPageView(Request $request)
    {
        $data = $request->validate([
            'cookie_id' => 'required|string|max:255',
            'url_path' => 'required|string|max:255',
        ]);

        // Find the most recent visit for this cookie_id
        $visit = GuestVisit::where('cookie_id', $data['cookie_id'])
            ->orderBy('created_at', 'desc')
            ->first();

        if ($visit) {
            $pagesViewed = $visit->pages_viewed ?? [];
            $currentPage = $data['url_path'];
            
            // Add page if not already in the list
            if (!in_array($currentPage, $pagesViewed)) {
                $pagesViewed[] = $currentPage;
                $visit->update(['pages_viewed' => $pagesViewed]);
            }
        }

        return response()->json(['success' => true]);
    }

    public function index(Request $request)
    {
        // Support both paginated and non-paginated responses
        if ($request->has('all') && $request->get('all') === 'true') {
            // Return all records for client-side pagination
            $visits = GuestVisit::orderByDesc('id')->get();
            return response()->json($visits);
        }
        // Default: paginated response
        $visits = GuestVisit::orderByDesc('id')->paginate(50);
        return response()->json($visits);
    }
}


