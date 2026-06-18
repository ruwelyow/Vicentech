@extends('emails.layouts.base')

@section('title', 'Donation Update')

@section('header-title')
    📋 Donation Update
@endsection

@section('header-subtitle', 'Important Information About Your Donation')

@section('content')
    <div class="greeting">
        Hello {{ $donation->name ?? 'Dear Donor' }},
    </div>

    <div class="message-content">
        <p>We regret to inform you that your donation could not be accepted at this time.</p>
        <p>We sincerely appreciate your intention to support our parish, and we want to help resolve this matter.</p>
    </div>

    <div class="details-box">
        <h3><span class="icon">💰</span>Donation Details</h3>
        <ul class="details-list">
            <li>
                <strong>Amount:</strong> 
                ₱{{ number_format((float)$donation->amount, 2) }}
            </li>
            <li>
                <strong>Reference:</strong> 
                {{ $donation->reference ?? 'N/A' }}
            </li>
            <li>
                <strong>Purpose:</strong> 
                {{ $donation->purpose_name ?? ($donation->category ?? 'General Donation') }}
            </li>
            <li>
                <strong>Date:</strong> 
                {{ $donation->created_at ? $donation->created_at->format('F j, Y \a\t g:i A') : 'N/A' }}
            </li>
            <li>
                <strong>Status:</strong> 
                <span class="status-badge status-rejected">Rejected</span>
            </li>
        </ul>
    </div>

    @if(isset($donation->rejection_reason) && !empty($donation->rejection_reason))
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 6px;">
            <h4 style="color: #dc2626; margin: 0 0 8px 0; font-size: 16px;">📝 Reason for Rejection:</h4>
            <p style="color: #7f1d1d; margin: 0; font-style: italic; line-height: 1.5;">{{ $donation->rejection_reason }}</p>
        </div>
    @else
        <div class="message-content">
            <p>This may be due to incomplete information, payment verification issues, or other administrative reasons.</p>
        </div>
    @endif

    <div class="message-content">
        <h3 style="color: #3F2E1E; margin-bottom: 15px;">📞 What You Can Do:</h3>
        <ul style="padding-left: 20px;">
            @if(isset($donation->rejection_reason) && !empty($donation->rejection_reason))
                <li>Review the specific reason provided above</li>
                <li>Address the concerns mentioned in the rejection reason</li>
            @else
                <li>Contact the parish office for specific reasons for rejection</li>
            @endif
            <li>Provide any missing information or corrected details</li>
            <li>Resubmit your donation with the necessary corrections if applicable</li>
            <li>If you believe this is a mistake, please contact us immediately</li>
        </ul>
    </div>

    <hr class="divider">

    <div class="message-content">
        <p>We understand this may be disappointing. Our parish staff is here to help you understand the issue and guide you through the process.</p>
        <p>Please don't hesitate to reach out for assistance.</p>
    </div>

    <div style="background-color: #fff8e1; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #ffa726;">
        <p style="margin: 0; font-size: 14px; color: #e65100;">
            <strong>📧 Need Help?</strong> Please contact us at <a href="mailto:donations@sanvicenteferrer.com" style="color: #CD8B3E; text-decoration: none;">donations@sanvicenteferrer.com</a> if you believe this is a mistake or have any questions.
        </p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #e65100;">
            <strong>📍 Parish Office Hours:</strong> Monday - Friday: 8:00 AM - 5:00 PM | Saturday: 8:00 AM - 12:00 PM | Sunday: After Mass Services
        </p>
    </div>

    <p style="text-align: center; margin-top: 30px; color: #5C4B38; font-weight: 600;">
        — Diocesan Shrine of San Vicente Ferrer
    </p>
@endsection

