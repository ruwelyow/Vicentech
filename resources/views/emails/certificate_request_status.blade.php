@extends('emails.layouts.base')

@section('title', 'Certificate Request ' . ucfirst($status))

@section('header-title')
    @if($status === 'approved')
        ✅ Certificate Approved
    @elseif($status === 'rejected')
        📋 Certificate Update
    @else
        📜 Certificate Status
    @endif
@endsection

@section('header-subtitle', 'Certificate Request Notification')

@section('content')
    <div class="greeting">
        Hello {{ $certificateRequest->first_name ?? 'Dear Parishioner' }},
    </div>

    <div class="message-content">
        @if($status === 'approved')
            <p>📜 <strong>Excellent news!</strong> Your certificate request has been <span class="status-badge status-approved">{{ $status }}</span>.</p>
            <p>Your certificate is now ready for processing and will be available for pickup or delivery soon.</p>
        @elseif($status === 'rejected')
            <p>We regret to inform you that your certificate request has been <span class="status-badge status-rejected">{{ $status }}</span>.</p>
            @if(isset($certificateRequest->rejection_reason) && !empty($certificateRequest->rejection_reason))
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 6px;">
                    <h4 style="color: #dc2626; margin: 0 0 8px 0; font-size: 16px;">📝 Reason for Rejection:</h4>
                    <p style="color: #7f1d1d; margin: 0; font-style: italic; line-height: 1.5;">{{ $certificateRequest->rejection_reason }}</p>
                </div>
            @else
                <p>This may be due to incomplete information, missing requirements, or other administrative reasons.</p>
            @endif
        @endif
    </div>

    <div class="details-box">
        <h3><span class="icon">📋</span>Certificate Request Details</h3>
        <ul class="details-list">
            <li>
                <strong>Full Name:</strong> 
                {{ $certificateRequest->first_name ?? 'N/A' }} {{ $certificateRequest->middle_name ?? '' }} {{ $certificateRequest->last_name ?? '' }}
            </li>
            <li>
                <strong>Certificate Type:</strong> 
                {{ $certificateRequest->certificate_type ?? 'N/A' }}
            </li>
            <li>
                <strong>Purpose:</strong> 
                {{ $certificateRequest->purpose ?? 'N/A' }}
            </li>
            <li>
                <strong>Status:</strong> 
                <span class="status-badge status-{{ $status }}">{{ ucfirst($status) }}</span>
            </li>
            <li>
                <strong>Request Date:</strong> 
                {{ $certificateRequest->created_at ? $certificateRequest->created_at->format('F j, Y \a\t g:i A') : 'N/A' }}
            </li>
            @if($certificateRequest->contact_number)
            <li>
                <strong>Contact Number:</strong> 
                {{ $certificateRequest->contact_number }}
            </li>
            @endif
        </ul>
    </div>

    @if($status === 'approved')
        <div class="message-content">
            <h3 style="color: #3F2E1E; margin-bottom: 15px;">📋 Next Steps:</h3>
            <ul style="padding-left: 20px;">
                <li>Your certificate will be processed within <strong>3-5 business days</strong></li>
                <li>You will receive another notification when it's ready for pickup</li>
                <li>Bring a valid ID when collecting your certificate</li>
                <li>Processing fee may apply - please inquire at the parish office</li>
            </ul>
        </div>
{{-- 
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ url('/certificates') }}" class="action-button">
                View My Certificates
            </a>
        </div> --}}

        <hr class="divider">

        <div class="message-content">
            <p style="font-style: italic; color: #5C4B38;">
                "Let your light shine before others, that they may see your good deeds and glorify your Father in heaven." - Matthew 5:16
            </p>
            <p>Thank you for your patience. We are honored to provide this certificate as part of your spiritual journey.</p>
        </div>

    @elseif($status === 'rejected')
        <div class="message-content">
            <h3 style="color: #3F2E1E; margin-bottom: 15px;">📞 What You Can Do:</h3>
            <ul style="padding-left: 20px;">
                @if(isset($certificateRequest->rejection_reason) && !empty($certificateRequest->rejection_reason))
                    <li>Review the specific reason provided above</li>
                    <li>Address the concerns mentioned in the rejection reason</li>
                    <li>Provide any missing documents or corrected information</li>
                    <li>Resubmit your request with the necessary corrections</li>
                @else
                    <li>Contact the parish office for specific reasons for rejection</li>
                    <li>Provide any missing documents or information</li>
                    <li>Resubmit your request with corrections</li>
                @endif
                <li>Schedule an appointment to discuss your requirements if needed</li>
            </ul>
        </div>
{{-- 
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ url('/contact') }}" class="action-button">
                Contact Parish Office
            </a>
        </div> --}}

        <hr class="divider">

        <div class="message-content">
            <p>We understand this may be disappointing. Our parish staff is here to help you understand the requirements and guide you through the process.</p>
            <p>Please don't hesitate to reach out for assistance.</p>
        </div>
    @endif

    <div style="background-color: #fff8e1; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #ffa726;">
        <p style="margin: 0; font-size: 14px; color: #e65100;">
            <strong>📍 Parish Office Hours:</strong> Monday - Friday: 8:00 AM - 5:00 PM | Saturday: 8:00 AM - 12:00 PM | Sunday: After Mass Services
        </p>
    </div>
@endsection