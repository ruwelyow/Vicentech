@extends('emails.layouts.base')

@section('title', 'New Event Notification')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 0 15px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 30px; font-family: Arial, sans-serif;">
        
        {{-- Header --}}
        <tr>
          <td align="center" style="background-color: #CD8B3E; color: #ffffff; padding: 20px 0; font-size: 24px; font-weight: bold;">
            New Event Announcement
          </td>
        </tr>

        {{-- Body --}}
        <tr>
          <td style="padding: 20px; color: #333333;">
            <p style="font-size: 16px;">👋 Hello <strong>{{ $user->name }}</strong>,</p>
            <p style="font-size: 15px;">Join us for a new parish community event!</p>

            {{-- Event Details --}}
            <table cellpadding="10" cellspacing="0" width="100%" style="background-color: #fdf8f2; border: 1px solid #e0c7aa; border-radius: 8px; margin: 20px 0;">
              <tr>
                <td><strong>🎉 Event Title:</strong> {{ $event->title }}</td>
              </tr>
              <tr>
                <td><strong>📅 Date:</strong> {{ \Carbon\Carbon::parse($event->date)->format('l, F j, Y') }}</td>
              </tr>
              <tr>
                <td><strong>⏰ Time:</strong> {{ $event->time }}</td>
              </tr>
              <tr>
                <td><strong>📍 Location:</strong> {{ $event->location }}</td>
              </tr>
              @if($event->description)
              <tr>
                <td><strong>📝 Description:</strong> {{ $event->description }}</td>
              </tr>
              @endif
            </table>

            {{-- Event Image --}}
   {{-- @if($event->image_data && $event->image_mime)
    <div style="text-align: center; margin: 25px 0;">
        <img src="data:{{ $event->image_mime }};base64,{{ $event->image_data }}" 
             alt="Event Image" 
             style="max-width: 100%; height: auto; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); display: block;">
    </div>
@endif --}}



            {{-- Join Button --}}
            <div style="text-align: center; margin: 25px 0;">
              @php
                try {
                    $joinUrl = route('events.join', $event);
                } catch (\Exception $e) {
                    $joinUrl = url('/events/' . $event->id . '/join');
                }
              @endphp

              <a href="{{ $joinUrl }}" 
                 style="display: inline-block; background: #CD8B3E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px;">
                 🎯 Join This Event
              </a>

              <p style="margin-top: 10px; font-size: 12px; color: #888888;">Login may be required to register</p>
            </div>

            {{-- Footer Message --}}
            <p style="margin-top: 30px; font-size: 15px;"><strong>We look forward to seeing you there!</strong></p>
            <p style="font-size: 13px;"><em>Questions? Contact the parish office.</em></p>
            <p style="font-size: 14px;"><strong>— Parish Community Team</strong></p>

          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
@endsection
