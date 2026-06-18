@extends('emails.layouts.base')

@section('title', 'Donation Verified')

@section('header-title')
    ✅ Donation Verified
@endsection

@section('header-subtitle', 'Thank You for Your Generosity')

@section('content')
    <div class="greeting">
        Hello {{ $donation->name ?? 'Dear Donor' }},
    </div>

    <div class="message-content">
        <p>🙏 <strong>Thank you for your generosity.</strong> Your donation has been verified successfully.</p>
        <p>We truly appreciate your support for our parish and the mission we serve together.</p>
    </div>

    <div class="details-box">
        <h3><span class="icon">💰</span>Donation Details</h3>
        <ul class="details-list">
            <li>
                <strong>Amount:</strong> 
                ₱{{ number_format((float)$donation->amount, 2) }}
            </li>
            <li>
                <strong>Reference:</strong> 
                {{ $donation->reference ?? 'N/A' }}
            </li>
            <li>
                <strong>Purpose:</strong> 
                {{ $donation->purpose_name ?? ($donation->category ?? 'General Donation') }}
            </li>
            <li>
                <strong>Date:</strong> 
                @php
                    if ($donation->created_at) {
                        $date = \Carbon\Carbon::parse($donation->created_at)->setTimezone('Asia/Manila');
                        echo $date->format('F j, Y \a\t g:i A');
                    } else {
                        echo 'N/A';
                    }
                @endphp
            </li>
            <li>
                <strong>Status:</strong> 
                <span class="status-badge status-approved">Verified</span>
            </li>
        </ul>
    </div>

    <div class="message-content">
        <p>Your donation receipt is attached to this email for your records. This receipt is tax-deductible and can be used for your financial records.</p>
        <p>We are grateful for your continued support and generosity. Your contribution helps us serve our community and fulfill our mission.</p>
    </div>

    <hr class="divider">

    <div class="message-content">
        <p style="font-style: italic; color: #5C4B38;">
            "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." - 2 Corinthians 9:7
        </p>
        <p>Thank you for being a cheerful giver and supporting our parish community.</p>
    </div>

    <div style="background-color: #fff8e1; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #ffa726;">
        <p style="margin: 0; font-size: 14px; color: #e65100;">
            <strong>📧 Questions about your donation?</strong> Please contact us at <a href="mailto:donations@sanvicenteferrer.com" style="color: #CD8B3E; text-decoration: none;">donations@sanvicenteferrer.com</a>
        </p>
    </div>

    <p style="text-align: center; margin-top: 30px; color: #5C4B38; font-weight: 600;">
        — Diocesan Shrine of San Vicente Ferrer
    </p>
@endsection

