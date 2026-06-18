@extends('emails.layouts.base')

@section('title', 'Prayer Request ' . ucfirst($status))

@section('header-title')
    @if($status === 'approved')
        🙏 Prayer Request Approved
    @elseif($status === 'rejected')
        📋 Prayer Request Update
    @else
        🕊️ Prayer Request Status
    @endif
@endsection

@section('header-subtitle', 'Prayer Request Notification')

@section('content')
    <div class="greeting">
        Hello {{ $prayerRequest->user->name ?? 'Dear Friend in Faith' }},
    </div>

    <div class="message-content">
        @if($status === 'approved')
            <p>🙏 <strong>Your prayer request has been received and approved.</strong></p>
            <p>Our parish community will join you in prayer, lifting up your intentions to our loving God. Your faith and trust in prayer inspire us all.</p>
        @elseif($status === 'rejected')
            <p>Thank you for sharing your prayer request with us. After review, your request has been <span class="status-badge status-rejected">{{ $status }}</span>.</p>
            @if(isset($prayerRequest->rejection_reason) && !empty($prayerRequest->rejection_reason))
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 6px;">
                    <h4 style="color: #dc2626; margin: 0 0 8px 0; font-size: 16px;">📝 Reason for Rejection:</h4>
                    <p style="color: #7f1d1d; margin: 0; font-style: italic; line-height: 1.5;">{{ $prayerRequest->rejection_reason }}</p>
                </div>
            @else
                <p>This may be due to content guidelines or other considerations. Please know that we still hold you in our prayers.</p>
            @endif
        @else
            <p>Thank you for submitting your prayer request. The status has been updated to <span class="status-badge status-{{ $status }}">{{ ucfirst($status) }}</span>.</p>
        @endif
    </div>

    <div class="details-box">
        <h3><span class="icon">🙏</span>Prayer Request Details</h3>
        <ul class="details-list">
            <li>
                <strong>Request:</strong> 
                <div style="margin-top: 8px; padding: 10px; background-color: #f8f9fa; border-radius: 5px; font-style: italic;">
                    "{{ Str::limit($prayerRequest->request ?? 'N/A', 200) }}"
                </div>
            </li>
            <li>
                <strong>Status:</strong> 
                <span class="status-badge status-{{ $status }}">{{ ucfirst($status) }}</span>
            </li>
            <li>
                <strong>Submitted:</strong> 
                {{ $prayerRequest->created_at ? $prayerRequest->created_at->format('F j, Y \a\t g:i A') : 'N/A' }}
            </li>
            @if($prayerRequest->updated_at && $prayerRequest->updated_at != $prayerRequest->created_at)
            <li>
                <strong>Last Updated:</strong> 
                {{ $prayerRequest->updated_at->format('F j, Y \a\t g:i A') }}
            </li>
            @endif
        </ul>
    </div>

    @if($status === 'approved')
        <div class="message-content">
            <h3 style="color: #3F2E1E; margin-bottom: 15px;">🕊️ How We Pray Together:</h3>
            <ul style="padding-left: 20px;">
                <li>Your intention will be included in our <strong>community prayer list</strong></li>
                <li>Our prayer groups will remember your request in their gatherings</li>
                <li>The parish will offer special intentions during Mass</li>
                <li>You are welcome to join our prayer circles and support groups</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ url('/prayerRequest') }}" class="action-button">
                View Prayer Request
            </a>
        </div>

        <hr class="divider">

        <div class="message-content">
            <p style="font-style: italic; color: #5C4B38;">
                "Therefore I tell you, whatever you ask for in prayer, believe that you have received it, and it will be yours." - Mark 11:24
            </p>
            <p>We are honored to join you in prayer. May God's peace and comfort be with you during this time.</p>
        </div>

    @elseif($status === 'rejected')
        <div class="message-content">
            <h3 style="color: #3F2E1E; margin-bottom: 15px;">🤝 We're Still Here for You:</h3>
            <ul style="padding-left: 20px;">
                @if(isset($prayerRequest->rejection_reason) && !empty($prayerRequest->rejection_reason))
                    <li>Review the specific feedback provided above</li>
                    <li>Consider revising your request to address the concerns mentioned</li>
                    <li>Speak with our pastoral care team for guidance on resubmission</li>
                    <li>Submit a revised prayer request that aligns with our guidelines</li>
                @else
                    <li>Contact our pastoral care team to understand the specific reasons</li>
                    <li>Submit a revised prayer request if appropriate</li>
                @endif
                <li>You can always pray privately - God hears every prayer</li>
                <li>Consider joining our prayer groups for personal support</li>
                <li>Attend our prayer services and healing Masses</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ url('/contact') }}" class="action-button">
                Contact Pastoral Care
            </a>
        </div>

        <hr class="divider">

        <div class="message-content">
            <p>Please know that our decision does not diminish the value of your prayer or your place in our community. We continue to hold you in our hearts and prayers.</p>
            <p>God's love for you is unchanging and eternal.</p>
        </div>

    @else
        <div class="message-content">
            <p>We are reviewing your prayer request with care and consideration. Thank you for your patience as we ensure all requests align with our community guidelines.</p>
            <p>You will receive another notification once a decision has been made.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ url('/prayerRequest') }}" class="action-button">
                View Prayer Request
            </a>
        </div>
    @endif

    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #4caf50;">
        <p style="margin: 0; font-size: 14px; color: #2e7d32;">
            <strong>🕯️ Daily Prayer:</strong> Join us for daily prayer at 6:00 AM and 6:00 PM. All are welcome to participate in person or in spirit.
        </p>
    </div>
@endsection