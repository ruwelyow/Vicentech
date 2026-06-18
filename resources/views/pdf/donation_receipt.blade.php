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
            color: #3F2E1E; 
            margin: 0;
            padding: 0;
            background: #ffffff;
            min-height: 100vh;
        }
        
        .content {
            padding: 50px 40px;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .brown-line {
            height: 4px;
            background-color: #CD8B3E;
            width: 100%;
            margin: 35px 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .main-title {
            font-size: 32px;
            font-weight: bold;
            color: #CD8B3E;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .shrine-name {
            font-size: 16px;
            color: #3F2E1E;
            margin-bottom: 6px;
            font-weight: normal;
        }
        
        .address {
            font-size: 14px;
            color: #3F2E1E;
            font-weight: normal;
        }
        
        .receipt-box {
            background: white;
            padding: 0;
            margin: 0;
            position: relative;
        }
        
        .info-section {
            margin-bottom: 25px;
        }
        
        .info-row {
            display: flex;
            flex-direction: row;
            margin-bottom: 14px;
            align-items: center;
            justify-content: space-between;
        }
        
        .info-label {
            font-weight: bold;
            color: #3F2E1E;
            font-size: 14px;
            text-align: right;
            order: 2;
            margin-left: 30px;
            flex-shrink: 0;
            min-width: 160px;
        }
        
        .info-value {
            color: #3F2E1E;
            font-size: 14px;
            text-align: left;
            order: 1;
            flex: 1;
            font-weight: normal;
        }
        
        .amount-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #FFF6E5;
            border-radius: 5px;
        }
        
        .amount-value {
            font-size: 36px;
            font-weight: bold;
            color: #CD8B3E;
            margin-bottom: 5px;
        }
        
        .amount-label {
            font-size: 14px;
            color: #3F2E1E;
            font-weight: bold;
        }
        
        .status-badge {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0 auto;
            text-align: center;
        }
        
        .status-badge-container {
            text-align: center;
            margin: 25px 0;
        }
        
        .status-verified {
            background: #E8F5E8;
            color: #2E7D32;
            border: 1px solid #4CAF50;
        }
        
        .status-pending {
            background: #FFF3E0;
            color: #F57C00;
            border: 1px solid #FF9800;
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 0;
        }
        
        .footer-text {
            font-size: 12px;
            color: #3F2E1E;
            line-height: 1.8;
            margin-bottom: 15px;
        }
        
        .blessing {
            font-size: 14px;
            color: #CD8B3E;
            font-weight: bold;
            font-style: italic;
            margin-top: 10px;
        }
        
        .receipt-section {
            margin: 20px 0;
            padding: 15px;
            background: #FFF6E5;
            border-radius: 5px;
            border: 1px solid #FFEBC9;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #CD8B3E;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #FFEBC9;
        }
        
        .receipt-image {
            max-width: 100%;
            height: auto;
            border: 1px solid #FFEBC9;
            border-radius: 3px;
        }
        
        .attachment-info {
            padding: 10px;
            background: white;
            border: 1px solid #FFEBC9;
            text-align: center;
            color: #5C4B38;
            border-radius: 3px;
        }
    </style>
    <title>Donation Receipt - Diocesan Shrine of San Vicente Ferrer</title>
    </head>
    <body>
    <div class="content">
        <div class="header">
            <div class="main-title">DONATION RECEIPT</div>
            <div class="shrine-name">Diocesan Shrine of San Vicente Ferrer</div>
            <div class="address">Brgy. Mamatid, Cabuyao, Laguna</div>
        </div>

        <!-- Top Brown Line -->
        <div class="brown-line"></div>

        <div class="receipt-box">
            <div class="info-section">
                <div class="info-row">
                    <div class="info-value">{{ $donation->name }}</div>
                    <div class="info-label">Donor Name:</div>
                </div>
                <div class="info-row">
                    <div class="info-value">{{ $donation->email }}</div>
                    <div class="info-label">Email Address:</div>
                </div>
                <div class="info-row">
                    <div class="info-value">{{ $donation->reference ?? 'N/A' }}</div>
                    <div class="info-label">Reference Number:</div>
                </div>
                <div class="info-row">
                    <div class="info-value">{{ $donation->purpose_name ?? $donation->category ?? 'General Donation' }}</div>
                    <div class="info-label">Donation Purpose:</div>
                </div>
                <div class="info-row">
                    <div class="info-value">
                        @php
                            $date = $donation->created_at;
                            if ($date) {
                                // Convert UTC to Asia/Manila timezone
                                $date = \Carbon\Carbon::parse($date)->setTimezone('Asia/Manila');
                                echo $date->format('F j, Y \a\t g:i A');
                            } else {
                                echo 'N/A';
                            }
                        @endphp
                    </div>
                    <div class="info-label">Date & Time:</div>
                </div>
            </div>

            <div class="status-badge-container">
                <span class="status-badge {{ $donation->verified ? 'status-verified' : 'status-pending' }}">
                    {{ $donation->verified ? 'Verified' : 'Pending Verification' }}
                </span>
            </div>
        </div>

        <!-- Bottom Brown Line -->
        <div class="brown-line"></div>

        <div class="footer">
            <div class="footer-text">
                Thank you for your generous donation to the Diocesan Shrine of San Vicente Ferrer.<br>
                Your contribution helps us continue our mission of faith, service, and community building.
            </div>
            <div class="blessing">May God bless you abundantly for your kindness and generosity.</div>
        </div>
    </div>

    @php
        $receiptWebPath = $donation->receipt_path ?? null;
        $receiptFsPath = $receiptWebPath ? public_path(ltrim($receiptWebPath, '/')) : null;
        // Normalize Windows backslashes for TCPDF
        if ($receiptFsPath) {
            $receiptFsPath = str_replace('\\', '/', $receiptFsPath);
        }
        $ext = $receiptFsPath ? strtolower(pathinfo($receiptFsPath, PATHINFO_EXTENSION)) : null;
        $isImage = in_array($ext, ['jpg','jpeg','png','gif','bmp','webp']);
    @endphp

    @if($receiptFsPath && file_exists($receiptFsPath))
        <div class="receipt-section">
            <div class="section-title">Uploaded Receipt</div>
            @if($isImage)
                <div style="text-align: center;">
                    <img src="{{ $receiptFsPath }}" class="receipt-image" alt="Receipt Image" />
                </div>
            @else
                <div class="attachment-info">
                    <strong>Attachment Provided</strong><br>
                    File Type: {{ strtoupper($ext) }}<br>
                    <em>Please refer to the original file for details.</em>
                </div>
            @endif
        </div>
    @endif
    </div>
    </body>
    </html>


