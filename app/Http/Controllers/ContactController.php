<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class ContactController extends Controller
{
    public function sendMessage(Request $request)
    {
        // Validate the form data
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'message' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please check your form data.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Get form data
            $formData = $request->only(['name', 'email', 'phone', 'message']);
            
            // Create email content
            $emailContent = $this->createEmailContent($formData);
            
            // Send email to sanvicentech23@gmail.com
            Mail::raw($emailContent, function ($message) use ($formData) {
                $message->to('sanvicentech23@gmail.com')
                        ->subject('New Contact Form Message from ' . $formData['name'])
                        ->from('sanvicentech23@gmail.com', 'VICENTECH Contact Form')
                        ->replyTo($formData['email'], $formData['name']);
            });

            return response()->json([
                'success' => true,
                'message' => 'Your message has been sent successfully! We will get back to you soon.'
            ]);

        } catch (\Exception $e) {
            \Log::error('Contact form error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Sorry, there was an error sending your message. Please try again later.'
            ], 500);
        }
    }

    private function createEmailContent($formData)
    {
        $content = "New Contact Form Message\n";
        $content .= "========================\n\n";
        $content .= "Name: " . $formData['name'] . "\n";
        $content .= "Email: " . $formData['email'] . "\n";
        $content .= "Phone: " . ($formData['phone'] ?: 'Not provided') . "\n\n";
        $content .= "Message:\n";
        $content .= "--------\n";
        $content .= $formData['message'] . "\n\n";
        $content .= "========================\n";
        $content .= "Sent from: " . request()->getHttpHost() . "\n";
        $content .= "Date: " . now()->format('Y-m-d H:i:s') . "\n";

        return $content;
    }
}
