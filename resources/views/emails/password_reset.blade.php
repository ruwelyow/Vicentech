@extends('emails.layouts.base')

@section('title', 'Password Reset Request')

@section('header-title')
    🔐 Password Reset Request
@endsection

@section('header-subtitle', 'Secure Your Account')

@section('content')
    <div class="greeting">
        Hello {{ $userName ?? 'Dear User' }},
    </div>

    <div class="message-content">
        <p>🔒 <strong>Security Notice:</strong> We received a request to reset your password for your parish account.</p>
        <p>If you requested this password reset, please click the button below to proceed with setting a new password for your account.</p>
    </div>

    <div class="details-box">
        <h3 style="color: #3F2E1E; margin-bottom: 15px;">🔑 Reset Instructions:</h3>
        <ul class="details-list">
            <li>
                <strong>Account Email:</strong> 
                {{ $userEmail }}
            </li>
            <li>
                <strong>Request Time:</strong> 
                {{ now()->format('F j, Y \a\t g:i A') }}
            </li>
            <li>
                <strong>Reset Link Expires:</strong> 
                {{ now()->addMinutes(60)->format('F j, Y \a\t g:i A') }}
            </li>
            <li>
                <strong>Security Status:</strong> 
                <span class="status-badge status-pending">Reset Requested</span>
            </li>
        </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $resetUrl }}" class="action-button">
            🔐 Reset My Password
        </a>
    </div>

    <div class="message-content">
        <h3 style="color: #3F2E1E; margin-bottom: 15px;">📋 Password Requirements:</h3>
        <ul style="padding-left: 20px;">
            <li><strong>Minimum 8 characters</strong> in length</li>
            <li><strong>At least one uppercase letter</strong> (A-Z)</li>
            <li><strong>At least one lowercase letter</strong> (a-z)</li>
            <li><strong>At least one number</strong> (0-9)</li>
            <li><strong>At least one special character</strong> (!@#$%^&*)</li>
            <li><strong>Cannot be the same</strong> as your previous passwords</li>
        </ul>
    </div>

    <div class="message-content">
        <h3 style="color: #3F2E1E; margin-bottom: 15px;">⚠️ Important Security Information:</h3>
        <ul style="padding-left: 20px;">
            <li>This reset link will <strong>expire in 60 minutes</strong> for security reasons</li>
            <li>You can only use this link <strong>once</strong> to reset your password</li>
            <li>If you didn't request this reset, please <strong>ignore this email</strong></li>
            <li>Your current password will remain active until you complete the reset</li>
        </ul>
    </div>

    <hr class="divider">

    <div class="message-content">
        <h3 style="color: #3F2E1E; margin-bottom: 15px;">🛡️ Security Best Practices:</h3>
        <ul style="padding-left: 20px;">
            <li>Choose a <strong>unique password</strong> that you haven't used elsewhere</li>
            <li>Consider using a <strong>password manager</strong> to generate and store secure passwords</li>
            <li>Never share your password with anyone</li>
            <li>Log out from shared or public computers after use</li>
            <li>Contact us immediately if you suspect unauthorized access to your account</li>
        </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #92400e; margin: 0 0 10px 0;">🚨 Security Alert</h4>
            <p style="color: #92400e; margin: 0; font-size: 14px;">
                If you did NOT request this password reset, please contact the parish office immediately. Your account may be at risk.
            </p>
        </div>
    </div>

    <div class="message-content">
        <h3 style="color: #3F2E1E; margin-bottom: 15px;">📞 Need Help?</h3>
        <p>If you're having trouble with the password reset process or have any questions, please contact us:</p>
        <ul style="padding-left: 20px;">
            <li><strong>Phone:</strong> [Parish Office Phone Number]</li>
            <li><strong>Email:</strong> [Parish Office Email]</li>
            <li><strong>Office Hours:</strong> Monday to Friday, 8:00 AM - 5:00 PM</li>
        </ul>
    </div>

    <div class="message-content">
        <p style="font-style: italic; color: #5C4B38;">
            "The Lord is my strength and my shield; my heart trusts in him, and he helps me." - Psalm 28:7
        </p>
        <p>Thank you for helping us maintain the security of your parish account. We are committed to protecting your personal information and ensuring a safe online experience.</p>
    </div>

    <div class="message-content">
        <p style="text-align: center; color: #5C4B38; font-size: 14px;">
            <strong>Blessings,</strong><br>
            The Parish Office Team
        </p>
    </div>
@endsection
