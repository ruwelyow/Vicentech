@extends('emails.layouts.base')

@section('title', 'Daily Mass Reminder')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 0 15px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 30px; font-family: Arial, sans-serif;">
        
        {{-- Header --}}
        <tr>
          <td align="center" style="background-color: #CD8B3E; color: #ffffff; padding: 20px 0; font-size: 24px; font-weight: bold;">
            Daily Mass Reminder - {{ $today }}
          </td>
        </tr>

        {{-- Body --}}
        <tr>
          <td style="padding: 20px; color: #333333;">
            <p style="font-size: 16px;">🙏 Good morning <strong>{{ $user->name }}</strong>,</p>
            <p style="font-size: 15px;">Here are today's mass schedules for your spiritual journey:</p>

            @if($massSchedules->count() > 0)
              {{-- Mass Schedules List --}}
              @foreach($massSchedules as $index => $schedule)
                <table cellpadding="15" cellspacing="0" width="100%" style="background-color: #fdf8f2; border: 1px solid #e0c7aa; border-radius: 8px; margin: 15px 0;">
                  <tr>
                    <td style="border-bottom: 1px solid #e0c7aa;">
                      <strong style="color: #CD8B3E; font-size: 18px;">⛪ {{ $schedule->type }}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>🕐 Time:</strong> {{ date('g:i A', strtotime($schedule->start_time)) }} - {{ date('g:i A', strtotime($schedule->end_time)) }}</td>
                  </tr>
                  <tr>
                    <td><strong>👨‍💼 Celebrant:</strong> {{ $schedule->celebrant }}</td>
                  </tr>
                </table>
              @endforeach

              {{-- Call to Action --}}
              <div style="text-align: center; margin: 25px 0;">
                <a href="{{ url('/mass-schedule') }}" 
                   style="display: inline-block; background: #CD8B3E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; margin-right: 10px;">
                   📅 View Full Schedule
                </a>
                <a href="{{ url('/mass-attendance/' . $massSchedules->first()->id) }}" 
                   style="display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px;">
                   ✝️ Attend Mass
                </a>
              </div>

            @else
              {{-- No Mass Today --}}
              <table cellpadding="15" cellspacing="0" width="100%" style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="text-align: center; color: #6c757d;">
                    <p style="font-size: 16px;">📅 No masses scheduled for today</p>
                    <p style="font-size: 14px;">Please check our weekly schedule for other days.</p>
                  </td>
                </tr>
              </table>
            @endif

            {{-- Spiritual Message --}}
            <div style="background-color: #f0f8ff; border-left: 4px solid #CD8B3E; padding: 15px; margin: 25px 0;">
              <p style="margin: 0; font-style: italic; color: #333;">
                "For where two or three gather in my name, there am I with them." - Matthew 18:20
              </p>
            </div>

            {{-- Footer Message --}}
            <p style="margin-top: 30px; font-size: 15px;"><strong>May your day be blessed!</strong></p>
            <p style="font-size: 13px;"><em>Questions? Contact the parish office.</em></p>
            <p style="font-size: 14px;"><strong>— Parish Community Team</strong></p>

          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
@endsection
