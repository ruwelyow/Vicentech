<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
</head>
<body style="background: #f8f6f2; margin: 0; padding: 0; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f6f2; min-height: 100vh;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(60,40,20,0.10); margin: 40px 0; padding: 0 0 32px 0;">
                    <tr>
                        <td style="background: #CD8B3E; border-radius: 12px 12px 0 0; padding: 32px 0 16px 0; text-align: center;">
                            <h1 style="color: #fff; font-size: 2rem; margin: 0; font-weight: 700; letter-spacing: 1px;">Email Verification</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 32px 0 32px; text-align: center;">
                            <p style="font-size: 1.1rem; color: #3F2E1E; margin-bottom: 24px;">Your One-Time Password (OTP) for email verification is:</p>
                            <div style="display: inline-block; background: #f2e4ce; color: #CD8B3E; font-size: 2.2rem; font-weight: bold; letter-spacing: 0.3rem; padding: 16px 32px; border-radius: 8px; margin-bottom: 24px;">
                                {{ $otp }}
                            </div>
                            <p style="font-size: 1rem; color: #5C4B38; margin: 24px 0 0 0;">This OTP will expire in <strong>3 minutes</strong>.</p>
                            <p style="font-size: 0.95rem; color: #8d7b5a; margin: 16px 0 0 0;">If you did not request this, please ignore this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>