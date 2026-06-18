@extends('emails.layouts.base')

@section('title', 'Certificate Ready for Collection')

@section('header-title')
    📜 Certificate Ready
@endsection

@section('header-subtitle', 'Your Certificate is Available')

@section('content')
    <div class="greeting">
        Hello {{ $recipientName ?? 'Dear Parishioner' }},
    </div>

    <div class="message-content">
        <p>🎉 <strong>Great news!</strong> Your certificate is now ready for collection.</p>
        <p>We are pleased to inform you that your {{ $certificateType }} certificate has been processed and is available for pickup at the parish office.</p>
    </div>

    <div class="details-box">
        <h3 style="color: #3F2E1E; margin-bottom: 15px;">📋 Certificate Details:</h3>
        <ul class="details-list">
            <li>
                <strong>Certificate Type:</strong> 
                {{ $certificateType }}
            </li>
            <li>
                <strong>Recipient Name:</strong> 
                {{ $certificateRelease->recipient_name }}
            </li>
            <li>
                <strong>Certificate Date:</strong> 
                {{ $certificateRelease->certificate_date ? \Carbon\Carbon::parse($certificateRelease->certificate_date)->format('F j, Y') : 'N/A' }}
            </li>
            <li>
                <strong>Priest:</strong> 
                {{ $certificateRelease->priest_name }}
            </li>
            <li>
                <strong>Reference Number:</strong> 
                <span style="font-family: monospace; background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px;">{{ $certificateRelease->unique_reference }}</span>
            </li>
            <li>
                <strong>Status:</strong> 
                <span class="status-badge status-completed">Ready for Collection</span>
            </li>
        </ul>
    </div>

    <div class="message-content">
        <h3 style="color: #3F2E1E; margin-bottom: 15px;">📋 Collection Instructions:</h3>
        <ul style="padding-left: 20px;">
            <li><strong>Bring a valid ID</strong> when collecting your certificate</li>
            <li><strong>Reference Number:</strong> {{ $certificateRelease->unique_reference }} (keep this for your records)</li>
            <li>Collection hours: <strong>Monday to Friday, 8:00 AM - 5:00 PM</strong></li>
            <li>Collection location: <strong>Parish Office</strong></li>
            <li>If you cannot collect in person, please contact the parish office to arrange alternative collection methods</li>
        </ul>
    </div>

    <div class="message-content">
        <h3 style="color: #3F2E1E; margin-bottom: 15px;">📞 Contact Information:</h3>
        <p>If you have any questions or need assistance, please contact us:</p>
        <ul style="padding-left: 20px;">
            <li><strong>Phone:</strong> [Parish Office Phone Number]</li>
            <li><strong>Email:</strong> [Parish Office Email]</li>
            <li><strong>Office Hours:</strong> Monday to Friday, 8:00 AM - 5:00 PM</li>
        </ul>
    </div>

    <hr class="divider">

    <div class="message-content">
        <p style="font-style: italic; color: #5C4B38;">
            "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future." - Jeremiah 29:11
        </p>
        <p>Thank you for your patience during the processing period. We are honored to provide this certificate as part of your spiritual journey and parish records.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #0369a1; margin: 0 0 10px 0;">🔒 Important Security Note</h4>
            <p style="color: #0369a1; margin: 0; font-size: 14px;">
                This certificate contains sensitive information. Please keep it secure and only share copies when necessary for official purposes.
            </p>
        </div>
    </div>

    <div class="message-content">
        <p style="text-align: center; color: #5C4B38; font-size: 14px;">
            <strong>Blessings,</strong><br>
            The Parish Office Team
        </p>
    </div>
@endsection
