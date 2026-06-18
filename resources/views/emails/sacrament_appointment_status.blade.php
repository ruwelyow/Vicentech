@extends('emails.layouts.base')

@section('title', 'Sacrament Appointment ' . ucfirst($status))

@section('header-title')
    @if($status === 'approved')
        🎉 Appointment Approved
    @elseif($status === 'rejected')
        📋 Appointment Update
    @else
        📅 Appointment Status
    @endif
@endsection

@section('header-subtitle', 'Sacrament Appointment Notification')

@section('content')
    <div class="greeting">
        Hello {{ $appointment->user->name ?? 'Dear Parishioner' }},
    </div>

    <div class="message-content">
        @if($status === 'approved')
            <p>🙏 <strong>Great news!</strong> Your sacrament appointment request has been <span class="status-badge status-approved">{{ $status }}</span>.</p>
            <p>We are delighted to confirm your appointment and look forward to celebrating this sacred moment with you.</p>
        @elseif($status === 'rejected')
            <p>We regret to inform you that your sacrament appointment request has been <span class="status-badge status-rejected">{{ $status }}</span>.</p>
            @if(isset($appointment->rejection_reason) && !empty($appointment->rejection_reason))
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 6px;">
                    <h4 style="color: #dc2626; margin: 0 0 8px 0; font-size: 16px;">📝 Reason for Rejection:</h4>
                    <p style="color: #7f1d1d; margin: 0; font-style: italic; line-height: 1.5;">{{ $appointment->rejection_reason }}</p>
                </div>
            @else
                <p>This may be due to scheduling conflicts or other administrative reasons. We sincerely apologize for any inconvenience.</p>
            @endif
        @endif
    </div>

    <div class="details-box">
        <h3><span class="icon">📋</span>Appointment Details</h3>
        <ul class="details-list">
            <li>
                <strong>Sacrament Type:</strong> 
                {{ $appointment->sacramentType->name ?? 'N/A' }}
            </li>
            <li>
                <strong>Requested Date:</strong> 
                {{ $appointment->date ? \Carbon\Carbon::parse($appointment->date)->format('F j, Y') : 'TBD' }}
            </li>
            @if($appointment->timeSlot)
            <li>
                <strong>Time Slot:</strong> 
                {{ $appointment->timeSlot->time }}
            </li>
            @endif
            <li>
                <strong>Status:</strong> 
                <span class="status-badge status-{{ $status }}">{{ ucfirst($status) }}</span>
            </li>
            <li>
                <strong>Request Date:</strong> 
                {{ $appointment->created_at->format('F j, Y \a\t g:i A') }}
            </li>
        </ul>
    </div>

    @if($status === 'approved')
        @if(isset($requirements) && !empty($requirements))
        <div class="message-content">
            <h3 style="color: #3F2E1E; margin-bottom: 15px;">📋 Required Documents & Requirements:</h3>
            <div style="background-color: #FFF6E5; border-left: 4px solid #CD8B3E; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <ul style="padding-left: 20px; margin: 0; color: #3F2E1E;">
                    @foreach($requirements as $requirement)
                        <li style="margin-bottom: 10px; line-height: 1.6;">{{ $requirement }}</li>
                    @endforeach
                </ul>
            </div>
        </div>
        @endif
        
        <div class="message-content">
            <h3 style="color: #3F2E1E; margin-bottom: 15px;">📝 Important Reminders:</h3>
            <ul style="padding-left: 20px;">
                <li>Please arrive <strong>15 minutes before</strong> your scheduled time</li>
                <li>Bring all required documents or certificates listed above</li>
                <li>If you need to make changes, contact the parish office immediately</li>
                <li>Dress appropriately for the sacred ceremony</li>
            </ul>
        </div>

        {{-- <div style="text-align: center; margin: 30px 0;">
            <a href="{{ url('/appointments') }}" class="action-button">
                View My Appointments
            </a>
        </div> --}}

        <hr class="divider">

        <div class="message-content">
            <p style="font-style: italic; color: #5C4B38;">
                "For where two or three gather in my name, there am I with them." - Matthew 18:20
            </p>
            <p>We are honored to be part of your spiritual journey and look forward to celebrating this sacred moment with you and your loved ones.</p>
        </div>

    @elseif($status === 'rejected')
        <div class="message-content">
            <h3 style="color: #3F2E1E; margin-bottom: 15px;">📞 Next Steps:</h3>
            <ul style="padding-left: 20px;">
                @if(isset($appointment->rejection_reason) && !empty($appointment->rejection_reason))
                    <li>Review the specific reason provided above</li>
                    <li>Address the concerns mentioned in the rejection reason</li>
                    <li>Contact the parish office to discuss the requirements</li>
                    <li>Reschedule your appointment once the issues are resolved</li>
                @else
                    <li>Contact the parish office for more information</li>
                    <li>Discuss alternative dates and times</li>
                    <li>Reschedule your appointment when convenient</li>
                @endif
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
            <p>We understand this may be disappointing, and we sincerely apologize. Our parish staff is committed to helping you find a suitable alternative that works for everyone.</p>
            <p>Thank you for your understanding and patience.</p>
        </div>
    @endif

    <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #4a90e2;">
        <p style="margin: 0; font-size: 14px; color: #2c5aa0;">
            <strong>💡 Need Help?</strong> If you have any questions or concerns, please don't hesitate to contact our parish office during business hours or visit us in person.
        </p>
    </div>
@endsection