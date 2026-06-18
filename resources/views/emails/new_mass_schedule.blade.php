@extends('emails.layouts.base')

@section('title', 'New Mass Schedule Notification')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 0 15px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 30px; font-family: Arial, sans-serif;">
        
        {{-- Header --}}
        <tr>
          <td align="center" style="background-color: #CD8B3E; color: #ffffff; padding: 20px 0; font-size: 24px; font-weight: bold;">
            New Mass Schedule Announcement
          </td>
        </tr>

        {{-- Body --}}
        <tr>
          <td style="padding: 20px; color: #333333;">
            <p style="font-size: 16px;">🙏 Hello <strong>{{ $user->name }}</strong>,</p>
            <p style="font-size: 15px;">A new mass schedule has been added to our parish calendar!</p>

            {{-- Mass Schedule Details --}}
            <table cellpadding="10" cellspacing="0" width="100%" style="background-color: #fdf8f2; border: 1px solid #e0c7aa; border-radius: 8px; margin: 20px 0;">
              <tr>
                <td><strong>⛪ Mass Type:</strong> {{ $massSchedule->type }}</td>
              </tr>
              <tr>
                <td><strong>📅 Day:</strong> {{ $massSchedule->day }}</td>
              </tr>
              <tr>
                <td><strong>⏰ Time:</strong> {{ $massSchedule->time }}</td>
              </tr>
              <tr>
                <td><strong>🕐 Duration:</strong> {{ $massSchedule->start_time }} - {{ $massSchedule->end_time }}</td>
              </tr>
              <tr>
                <td><strong>👨‍💼 Celebrant:</strong> {{ $massSchedule->celebrant }}</td>
              </tr>
            </table>

            {{-- Calendar Button --}}
            <div style="text-align: center; margin: 25px 0;">
              <a href="{{ url('/calendar') }}" 
                 style="display: inline-block; background: #CD8B3E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; margin-right: 10px;">
                 📅 View Calendar
              </a>
              <a href="{{ url('/mass-attendance/' . $massSchedule->id) }}" 
                 style="display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px;">
                 ✝️ Attend Mass
              </a>
            </div>

            {{-- Footer Message --}}
            <p style="margin-top: 30px; font-size: 15px;"><strong>We look forward to worshipping with you!</strong></p>
            <p style="font-size: 13px;"><em>Questions? Contact the parish office.</em></p>
            <p style="font-size: 14px;"><strong>— Parish Community Team</strong></p>

          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
@endsection