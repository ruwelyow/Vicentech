<!DOCTYPE html>
<html>
<head>
    <title>Ministry Application Status Update</title>
</head>
<body>
    <h2>Dear {{ $applicant->first_name ?? 'Applicant' }} {{ $applicant->last_name ?? '' }},</h2>
    <p>We hope this message finds you well. We are writing to inform you about an update regarding your recent application to serve in our ministry.</p>
    <h3>Application Summary:</h3>
    <ul>
        <li><strong>Name:</strong> {{ $applicant->first_name ?? 'N/A' }} {{ $applicant->last_name ?? '' }}</li>
        <li><strong>Type of Service Applied For:</strong> {{ $applicant->server_type ?? 'N/A' }}</li>
        <li><strong>Status:</strong> {{ ucfirst($applicant->status ?? 'pending') }}</li>
    </ul>
    <p>We sincerely appreciate your willingness to serve and your commitment to our community. If you have any questions or need further information regarding your application status, please feel free to reach out to us.</p>
    <p>Thank you once again for your interest in serving with us. We look forward to your continued involvement and support.</p>
    <p>Warm regards,<br>The Ministry Team</p>
</body>
</html> 