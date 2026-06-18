<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Parish Notification')</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #CD8B3E 0%, #B67A35 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
        }
        .header .subtitle {
            margin: 5px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            color: #3F2E1E;
            margin-bottom: 20px;
        }
        .message-content {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 25px;
        }
        .details-box {
            background-color: #f8f6f1;
            border-left: 4px solid #CD8B3E;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .details-box h3 {
            color: #3F2E1E;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .details-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .details-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .details-list li:last-child {
            border-bottom: none;
        }
        .details-list strong {
            color: #3F2E1E;
            display: inline-block;
            width: 140px;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-approved {
            background-color: #d4edda;
            color: #155724;
        }
        .status-rejected {
            background-color: #f8d7da;
            color: #721c24;
        }
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #CD8B3E 0%, #B67A35 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .action-button:hover {
            transform: translateY(-2px);
            color: white;
        }
        .footer {
            background-color: #3F2E1E;
            color: white;
            padding: 25px;
            text-align: center;
            font-size: 14px;
        }
        .footer p {
            margin: 5px 0;
        }
        .divider {
            height: 2px;
            background: linear-gradient(90deg, #CD8B3E 0%, #B67A35 100%);
            margin: 25px 0;
            border: none;
        }
        .icon {
            font-size: 24px;
            margin-right: 10px;
            vertical-align: middle;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .content {
                padding: 20px;
            }
            .header {
                padding: 20px;
            }
            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>@yield('header-title', 'Parish Community')</h1>
            <p class="subtitle">@yield('header-subtitle', 'Notification System')</p>
        </div>
        
        <div class="content">
            @yield('content')
        </div>
        
        <div class="footer">
            <p><strong>Parish Community Management System</strong></p>
            <p>Thank you for being part of our faith community</p>
            <p style="font-size: 12px; opacity: 0.8;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>