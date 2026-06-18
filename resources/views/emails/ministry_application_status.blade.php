@extends('emails.layouts.base')

@section('title', 'Ministry Application ' . ucfirst($status))

@section('header-title')
    @if($status === 'approved')
        🎉 Welcome to Ministry!
    @elseif($status === 'rejected')
        📋 Application Update
    @else
        ⛪ Ministry Application
    @endif
@endsection

@section('header-subtitle', 'Ministry Application Notification')

@section('content')
    <div class="greeting">
        Hello {{ $applicant->first_name ?? 'Dear Applicant' }} {{ $applicant->last_name ?? '' }},
    </div>

    <div class="message-content">
        @if($status === 'approved')
            <p>🙏 <strong>Congratulations!</strong> Your ministry application has been <span class="status-badge status-approved">{{ $status }}</span>.</p>
            <p>We are thrilled to welcome you to our ministry team! Your dedication to serve our Lord and community is truly appreciated.</p>
        @elseif($status === 'rejected')
            <p>Thank you for your interest in serving in our ministry. After careful consideration, your application has been <span class="status-badge status-rejected">{{ $status }}</span>.</p>
            @if(isset($applicant->rejection_reason) && !empty($applicant->rejection_reason))
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 6px;">
                    <h4 style="color: #dc2626; margin: 0 0 8px 0; font-size: 16px;">📝 Reason for Rejection:</h4>
                    <p style="color: #7f1d1d; margin: 0; font-style: italic; line-height: 1.5;">{{ $applicant->rejection_reason }}</p>
                </div>
            @else
                <p>This decision does not reflect your worth or commitment to our faith community.</p>
            @endif
        @else
            <p>Thank you for your application to serve in our ministry. Your application status has been updated to <span class="status-badge status-{{ $status }}">{{ ucfirst($status) }}</span>.</p>
        @endif
    </div>

    <div class="details-box">
        <h3><span class="icon">📋</span>Application Summary</h3>
        <ul class="details-list">
            <li>
                <strong>Full Name:</strong> 
                {{ $applicant->first_name ?? 'N/A' }} {{ $applicant->last_name ?? '' }}
            </li>
            <li>
                <strong>Ministry Type:</strong> 
                {{ $applicant->server_type ?? 'N/A' }}
            </li>
            <li>
                <strong>Status:</strong> 
                <span class="status-badge status-{{ $status }}">{{ ucfirst($status) }}</span>
            </li>
            <li>
                <strong>Application Date:</strong> 
                {{ $applicant->created_at ? $applicant->created_at->format('F j, Y \a\t g:i A') : 'N/A' }}
            </li>
            @if($applicant->email)
            <li>
                <strong>Email:</strong> 
                {{ $applicant->email }}
            </li>
            @endif
            @if($applicant->phone)
            <li>
                <strong>Phone:</strong> 
                {{ $applicant->phone }}
            </li>
            @endif
        </ul>
    </div>

    @if($status === 'approved')
        <div class="message-content">
            <h3 style="color: #3F2E1E; margin-bottom: 15px;">🎯 Next Steps:</h3>
            <ul style="padding-left: 20px;">
                <li>Attend the <strong>orientation session</strong> (date will be communicated separately)</li>
                <li>Complete any required training programs</li>
                <li>Receive your ministry schedule and assignments</li>
                <li>Connect with your ministry coordinator</li>
                <li>Participate in the ministry blessing ceremony</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ url('/notifications') }}" class="action-button">
                View Ministry Information
            </a>
        </div>

        <hr class="divider">

        <div class="message-content">
            <p style="font-style: italic; color: #5C4B38;">
                "Each of you should use whatever gift you have to serve others, as faithful stewards of God's grace in its various forms." - 1 Peter 4:10
            </p>
            <p>Your willingness to serve is a blessing to our community. We look forward to working together in God's vineyard!</p>
        </div>

    @elseif($status === 'rejected')
        <div class="message-content">
            <h3 style="color: #3F2E1E; margin-bottom: 15px;">🤝 Moving Forward:</h3>
            <ul style="padding-left: 20px;">
                @if(isset($applicant->rejection_reason) && !empty($applicant->rejection_reason))
                    <li>Review the specific feedback provided above</li>
                    <li>Address the concerns mentioned in the rejection reason</li>
                    <li>Consider reapplying once you've addressed the requirements</li>
                    <li>Contact the ministry coordinator for guidance and support</li>
                @else
                    <li>Contact the ministry coordinator for more specific feedback</li>
                    <li>Consider other ministry opportunities that may be available</li>
                @endif
                <li>Participate in parish volunteer activities</li>
                <li>Join prayer groups and spiritual communities</li>
                <li>Support parish events and fundraising activities</li>
                <li>Continue growing in faith through parish programs</li>
            </ul>
        </div>

        {{-- <div style="text-align: center; margin: 30px 0;">
            <a href="{{ url('/volunteer') }}" class="action-button">
                Explore Volunteer Opportunities
            </a>
        </div> --}}

        <hr class="divider">

        <div class="message-content">
            <p>Please know that there are many ways to serve our Lord and community. We encourage you to stay connected and explore other opportunities to contribute your talents and gifts.</p>
            <p>Your heart for service is valued and appreciated.</p>
        </div>

    @else
        <div class="message-content">
            <p>We are currently reviewing your application. Thank you for your patience as we carefully consider all applicants.</p>
            <p>You will receive another notification once a final decision has been made.</p>
        </div>

        {{-- <div style="text-align: center; margin: 30px 0;">
            <a href="{{ url('/applications') }}" class="action-button">
                Check Application Status
            </a>
        </div> --}}
    @endif

    <div style="background-color: #f3e5f5; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #9c27b0;">
        <p style="margin: 0; font-size: 14px; color: #4a148c;">
            <strong>🙏 Prayer Request:</strong> We invite you to join us in prayer for our ministry and all those who serve. Your spiritual support is just as valuable as your active participation.
        </p>
    </div>
@endsection