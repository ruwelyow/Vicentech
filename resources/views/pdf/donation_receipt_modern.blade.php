<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 0;
        }
        
        body { 
            font-family: DejaVu Sans, Arial, sans-serif; 
            color: #1a1a1a; 
            margin: 0;
            padding: 0;
            background: #ffffff;
            line-height: 1.4;
        }
        
        .container {
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
            padding: 25px 30px;
            background: #ffffff;
        }
        
        /* Header Section */
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #CD8B3E;
        }
        
        .main-title {
            font-size: 24px;
            font-weight: bold;
            color: #CD8B3E;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        
        .shrine-name {
            font-size: 14px;
            color: #3F2E1E;
            margin-bottom: 3px;
            font-weight: bold;
        }
        
        .address {
            font-size: 11px;
            color: #6C757D;
        }
        
        /* Receipt Card */
        .receipt-card {
            background: #ffffff;
            border: 1px solid #E0E0E0;
            padding: 18px;
            margin: 15px 0;
        }
        
        .receipt-number {
            text-align: right;
            font-size: 9px;
            color: #6C757D;
            margin-bottom: 12px;
            font-style: italic;
        }
        
        /* Info Items - Professional Table Style */
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        
        .info-row {
            border-bottom: 1px solid #F0F0F0;
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .info-label {
            font-size: 9px;
            color: #6C757D;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 0;
            width: 35%;
            font-weight: bold;
            vertical-align: top;
        }
        
        .info-value {
            font-size: 11px;
            color: #1a1a1a;
            padding: 8px 0 8px 10px;
            font-weight: normal;
            word-break: break-word;
        }
        
        /* Amount Section */
        .amount-section {
            text-align: center;
            padding: 18px;
            background: #FFF8E1;
            border: 1px solid #CD8B3E;
            border-radius: 4px;
            margin: 12px 0;
        }
        
        .amount-label {
            font-size: 9px;
            color: #6C757D;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        .amount-value {
            font-size: 30px;
            font-weight: bold;
            color: #CD8B3E;
            margin: 5px 0;
        }
        
        .amount-currency {
            font-size: 18px;
            vertical-align: top;
        }
        
        /* Status Badge */
        .status-container {
            text-align: center;
            margin: 12px 0;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 18px;
            border-radius: 15px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-verified {
            background: #4CAF50;
            color: #ffffff;
            border: 1px solid #2E7D32;
        }
        
        .status-pending {
            background: #FF9800;
            color: #ffffff;
            border: 1px solid #F57C00;
        }
        
        /* Divider */
        .divider {
            height: 1px;
            background: #E0E0E0;
            margin: 15px 0;
        }
        
        /* Thank You Message */
        .thank-you {
            text-align: center;
            margin: 15px 0;
            padding: 12px;
        }
        
        .thank-you-text {
            font-size: 11px;
            color: #495057;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        
        .blessing {
            font-size: 12px;
            color: #CD8B3E;
            font-weight: bold;
            font-style: italic;
            padding: 10px;
            background: #FFF8E1;
            border-radius: 4px;
            border-left: 3px solid #CD8B3E;
        }
        
        /* Professional Footer */
        .footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #E0E0E0;
            font-size: 9px;
            color: #6C757D;
        }
        
        .footer-content {
            display: table;
            width: 100%;
        }
        
        .footer-left {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 15px;
        }
        
        .footer-right {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-left: 15px;
            text-align: right;
        }
        
        .footer-title {
            font-weight: bold;
            color: #3F2E1E;
            margin-bottom: 5px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .footer-text {
            line-height: 1.5;
            margin-bottom: 8px;
        }
        
        .footer-contact {
            margin-top: 8px;
        }
        
        .footer-note {
            margin-top: 12px;
            padding-top: 10px;
            border-top: 1px solid #F0F0F0;
            text-align: center;
            font-style: italic;
            color: #8C8C8C;
        }
        
        /* Receipt Image Section */
        .receipt-image-section {
            margin: 12px 0;
            padding: 12px;
            background: #FFF8E1;
            border: 1px solid #FFEBC9;
            border-radius: 4px;
        }
        
        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #CD8B3E;
            margin-bottom: 8px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .receipt-image {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            border: 1px solid #ffffff;
        }
        
        .attachment-info {
            padding: 10px;
            background: white;
            border: 1px dashed #FFEBC9;
            text-align: center;
            color: #6C757D;
            border-radius: 4px;
            font-size: 9px;
        }
    </style>
    <title>Donation Receipt - Diocesan Shrine of San Vicente Ferrer</title>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="main-title">Donation Receipt</div>
            <div class="shrine-name">Diocesan Shrine of San Vicente Ferrer</div>
            <div class="address">Brgy. Mamatid, Cabuyao, Laguna</div>
        </div>

        <!-- Receipt Card -->
        <div class="receipt-card">
            <div class="receipt-number">Receipt #{{ $donation->id ?? 'N/A' }}</div>
            
            <!-- Information Table -->
            <table class="info-table">
                <tr class="info-row">
                    <td class="info-label">Donor Name</td>
                    <td class="info-value">{{ $donation->name }}</td>
                </tr>
                <tr class="info-row">
                    <td class="info-label">Email Address</td>
                    <td class="info-value">{{ $donation->email }}</td>
                </tr>
                <tr class="info-row">
                    <td class="info-label">Reference Number</td>
                    <td class="info-value">{{ $donation->reference ?? 'N/A' }}</td>
                </tr>
                <tr class="info-row">
                    <td class="info-label">Donation Purpose</td>
                    <td class="info-value">{{ $donation->purpose_name ?? $donation->category ?? 'General Donation' }}</td>
                </tr>
                <tr class="info-row">
                    <td class="info-label">Date & Time</td>
                    <td class="info-value">
                        @php
                            $date = $donation->created_at;
                            if ($date) {
                                $date = \Carbon\Carbon::parse($date)->setTimezone('Asia/Manila');
                                echo $date->format('F j, Y \a\t g:i A');
                            } else {
                                echo 'N/A';
                            }
                        @endphp
                    </td>
                </tr>
            </table>

            <!-- Amount Section -->
            <div class="amount-section">
                <div class="amount-label">Donation Amount</div>
                <div class="amount-value">
                    <span class="amount-currency">₱</span>{{ number_format((float)$donation->amount, 2) }}
                </div>
            </div>

            <!-- Status Badge -->
            <div class="status-container">
                <span class="status-badge {{ $donation->verified ? 'status-verified' : 'status-pending' }}">
                    {{ $donation->verified ? 'Verified' : 'Pending Verification' }}
                </span>
            </div>
        </div>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Thank You Message -->
        <div class="thank-you">
            <div class="thank-you-text">
                <p style="margin-bottom: 5px;">
                    Thank you for your generous donation to the <strong>Diocesan Shrine of San Vicente Ferrer</strong>.
                </p>
                <p>
                    Your contribution helps us continue our mission of faith, service, and community building.
                </p>
            </div>
            <div class="blessing">
                May God bless you abundantly for your kindness and generosity.
            </div>
        </div>

        <!-- Receipt Image Section (if exists) -->
        @php
            $receiptWebPath = $donation->receipt_path ?? null;
            $receiptFsPath = $receiptWebPath ? public_path(ltrim($receiptWebPath, '/')) : null;
            if ($receiptFsPath) {
                $receiptFsPath = str_replace('\\', '/', $receiptFsPath);
            }
            $ext = $receiptFsPath ? strtolower(pathinfo($receiptFsPath, PATHINFO_EXTENSION)) : null;
            $isImage = in_array($ext, ['jpg','jpeg','png','gif','bmp','webp']);
        @endphp

        @if($receiptFsPath && file_exists($receiptFsPath))
            <div class="receipt-image-section">
                <div class="section-title">Uploaded Receipt</div>
                @if($isImage)
                    <div style="text-align: center;">
                        <img src="{{ $receiptFsPath }}" class="receipt-image" alt="Receipt Image" />
                    </div>
                @else
                    <div class="attachment-info">
                        <strong>Attachment Provided</strong><br>
                        <span>File Type: {{ strtoupper($ext) }}</span><br>
                        <em>Please refer to the original file for details.</em>
                    </div>
                @endif
            </div>
        @endif

        <!-- Professional Footer -->
        <div class="footer">
            <div class="footer-content">
                <div class="footer-left">
                    <div class="footer-title">Contact Information</div>
                    <div class="footer-text">
                        Diocesan Shrine of San Vicente Ferrer<br>
                        Brgy. Mamatid, Cabuyao, Laguna<br>
                        Philippines
                    </div>
                    <div class="footer-contact">
                        <strong>Email:</strong> donations@sanvicenteferrer.com<br>
                        <strong>Phone:</strong> (049) 123-4567
                    </div>
                </div>
                <div class="footer-right">
                    <div class="footer-title">Tax Information</div>
                    <div class="footer-text">
                        This receipt serves as official documentation<br>
                        for your tax-deductible donation.<br>
                        Please retain for your records.
                    </div>
                    <div class="footer-contact">
                        <strong>Receipt ID:</strong> {{ $donation->id ?? 'N/A' }}<br>
                        <strong>Date Issued:</strong> {{ \Carbon\Carbon::now()->format('M d, Y') }}
                    </div>
                </div>
            </div>
            <div class="footer-note">
                This is an official receipt issued by the Diocesan Shrine of San Vicente Ferrer.<br>
                For inquiries, please contact us using the information above.
            </div>
        </div>
    </div>
</body>
</html>
