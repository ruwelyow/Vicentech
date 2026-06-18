<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Changed</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#111827; }
        .card { max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px; }
        .title { font-size:20px;font-weight:700;margin:0 0 8px 0; }
        .muted { color:#6b7280; }
    </style>
    </head>
<body>
    <div class="card">
        <p class="title">Password Changed</p>
        <p>Hi {{ $userName }},</p>
        <p>This is a confirmation that your account password was just changed.</p>
        <p class="muted">If you made this change, you can safely disregard this message.</p>
        <p class="muted">If you did NOT make this change, please reset your password immediately using the "Forgot Password" link on the login page and contact support.</p>
        <p style="margin-top:16px">Thank you,<br/>Parish Team</p>
    </div>
</body>
</html>


