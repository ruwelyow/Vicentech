<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user.
     */
    public function index()
    {
        return Auth::user()->notifications;
    }

    /**
     * Get the count of unread notifications.
     */
    public function unreadCount()
    {
        return response()->json(['count' => Auth::user()->unreadNotifications->count()]);
    }

    /**
     * Mark all unread notifications as read.
     */
    public function markAllAsRead()
    {
        Auth::user()->unreadNotifications->markAsRead();
        return response()->json(['message' => 'All notifications marked as read.']);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead($id)
    {
        $notification = Auth::user()->notifications()->find($id);
        
        if (!$notification) {
            return response()->json(['message' => 'Notification not found.'], 404);
        }

        $notification->markAsRead();
        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * Get unread notifications only.
     */
    public function unread()
    {
        return Auth::user()->unreadNotifications;
    }
}
