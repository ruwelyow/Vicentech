<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Mass Attendance Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 18px;
            color: #333;
        }
        .filter-info {
            margin-bottom: 15px;
            font-size: 11px;
            color: #666;
        }
        .filter-info strong {
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th {
            background-color: #806c4b;
            color: white;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #666;
        }
        td {
            padding: 6px;
            border: 1px solid #ddd;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 9px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .no-data {
            text-align: center;
            padding: 20px;
            color: #999;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Mass Attendance Report</h1>
    </div>
    
    <div class="filter-info">
        <strong>View:</strong> {{ ucfirst($view ?? 'Monthly') }} | 
        <strong>Period:</strong> {{ $dateRange['label'] ?? 'N/A' }}
        @if(!empty($selectedMonth) && $selectedMonth !== 'all')
            | <strong>Selected Month:</strong> 
            @php
                try {
                    $monthDate = \Carbon\Carbon::createFromFormat('Y-m', $selectedMonth);
                    echo $monthDate->format('F Y');
                } catch (\Exception $e) {
                    echo $selectedMonth;
                }
            @endphp
        @endif
        @if(!empty($dateRange['start']) && !empty($dateRange['end']))
            | <strong>Date Range:</strong> 
            @php
                try {
                    $startDate = \Carbon\Carbon::parse($dateRange['start']);
                    $endDate = \Carbon\Carbon::parse($dateRange['end']);
                    echo $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y');
                } catch (\Exception $e) {
                    echo $dateRange['start'] . ' - ' . $dateRange['end'];
                }
            @endphp
        @endif
    </div>
    
    @if($attendances->count() > 0)
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 30%;">Attendee Name</th>
                    <th style="width: 15%;">Attendance Date</th>
                    <th style="width: 30%;">Mass Schedule/Time</th>
                    <th style="width: 20%;">Confirmation Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($attendances as $index => $attendance)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $attendance['name'] }}</td>
                        <td>{{ $attendance['attendance_date'] }}</td>
                        <td>{{ $attendance['mass_schedule'] }}</td>
                        <td>{{ $attendance['confirmation_status'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
        
        <div class="footer">
            <p>Total Records: {{ $attendances->count() }}</p>
            <p>Generated on: {{ date('F d, Y h:i A') }}</p>
        </div>
    @else
        <div class="no-data">
            <p>No mass attendance records found for the selected period.</p>
        </div>
    @endif
</body>
</html>

