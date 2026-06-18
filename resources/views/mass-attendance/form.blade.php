<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mass Attendance Registration</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #CD8B3E 0%, #B8860B 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 16px;
            opacity: 0.9;
        }

        .mass-info {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }

        .mass-info h3 {
            color: #CD8B3E;
            margin-bottom: 15px;
            font-size: 20px;
        }

        .mass-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .detail-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .detail-item strong {
            color: #495057;
        }

        .form-container {
            padding: 30px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #495057;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #CD8B3E;
        }

        .form-group textarea {
            resize: vertical;
            min-height: 100px;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .btn {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
            width: 100%;
        }

        .btn:hover {
            transform: translateY(-2px);
        }

        .btn:disabled {
            background: #6c757d;
            cursor: not-allowed;
            transform: none;
        }

        .login-section {
            text-align: center;
            padding: 40px 20px;
        }

        .login-message h3 {
            color: #CD8B3E;
            font-size: 24px;
            margin-bottom: 15px;
        }

        .login-message p {
            color: #5C4B38;
            font-size: 16px;
            margin-bottom: 30px;
        }

        .login-actions {
            display: flex;
            justify-content: center;
        }

        .btn-login {
            background: linear-gradient(135deg, #CD8B3E 0%, #B8860B 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: transform 0.2s;
            display: inline-block;
        }

        .btn-login:hover {
            transform: translateY(-2px);
        }


        .form-group input[readonly] {
            background-color: #f8f9fa;
            color: #6c757d;
            cursor: not-allowed;
        }

        .confirmation-section {
            text-align: center;
        }

        .confirmation-section h3 {
            color: #CD8B3E;
            font-size: 24px;
            margin-bottom: 15px;
        }

        .confirmation-section p {
            color: #5C4B38;
            font-size: 16px;
            margin-bottom: 25px;
        }

        .user-info-display {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            text-align: left;
        }

        .info-item {
            margin-bottom: 10px;
            font-size: 16px;
            color: #495057;
        }

        .info-item:last-child {
            margin-bottom: 0;
        }

        .info-item strong {
            color: #CD8B3E;
            margin-right: 10px;
        }

        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #CD8B3E;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            .mass-details,
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .container {
                margin: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✝️ Mass Attendance Registration</h1>
            <p>Join us in worship and fellowship</p>
        </div>

        <div class="mass-info">
            <h3>Mass Details</h3>
            <div class="mass-details">
                <div class="detail-item">
                    <span>⛪</span>
                    <strong>{{ $massSchedule->type }}</strong>
                </div>
                <div class="detail-item">
                    <span>📅</span>
                    <strong>{{ $massSchedule->day }}</strong>
                </div>
                <div class="detail-item">
                    <span>🕐</span>
                    <strong>{{ date('g:i A', strtotime($massSchedule->start_time)) }} - {{ date('g:i A', strtotime($massSchedule->end_time)) }}</strong>
                </div>
                <div class="detail-item">
                    <span>👨‍💼</span>
                    <strong>{{ $massSchedule->celebrant }}</strong>
                </div>
            </div>
        </div>

        <div class="form-container">
            <div id="alert-container"></div>
            
            @if(!$user)
                <!-- Login Required Section -->
                <div id="login-required" class="login-section">
                    <div class="login-message">
                        <h3>🔐 Login Required</h3>
                        <p>Please log in to register for mass attendance.</p>
                        <div class="login-actions">
                            <a href="/login?redirect=mass-attendance&mass_id={{ $massSchedule->id }}" class="btn btn-login">Login to Register</a>
                        </div>
                    </div>
                </div>
            @else
                <!-- User Information Confirmation -->
                <div id="user-confirmation" class="confirmation-section">
                    <h3>📋 Confirm Your Information</h3>
                    <p>Please review and confirm your details for mass attendance registration:</p>
                    
                    <div class="user-info-display">
                        <div class="info-item">
                            <strong>Name:</strong> {{ $user->name }}
                        </div>
                        <div class="info-item">
                            <strong>Email:</strong> {{ $user->email }}
                        </div>
                        <div class="info-item">
                            <strong>Phone:</strong> {{ $user->phone ?? 'Not provided' }}
                        </div>
                    </div>

                    <!-- Mass Attendance Form -->
                    <form id="attendance-form">
                        <input type="hidden" name="mass_schedule_id" value="{{ $massSchedule->id }}">
                        <input type="hidden" name="user_id" value="{{ $user->id }}">
                        
                        <div class="form-group">
                            <label for="name">Full Name *</label>
                            <input type="text" id="name" name="name" value="{{ $user->name }}" required readonly>
                        </div>

                        <div class="form-group">
                            <label for="email">Email Address *</label>
                            <input type="email" id="email" name="email" value="{{ $user->email }}" required readonly>
                        </div>

                        <div class="form-group">
                            <label for="address">Address *</label>
                            <textarea id="address" name="address" placeholder="Your home address" required>{{ $user->address ?? '' }}</textarea>
                        </div>

                        <button type="submit" class="btn" id="submit-btn">
                            Confirm & Register for Mass
                        </button>
                    </form>

                    <div class="loading" id="loading">
                        <div class="spinner"></div>
                        <p>Registering your attendance...</p>
                    </div>
                </div>
            @endif
        </div>
    </div>

    <script>
        // Only run form submission script if user is logged in
        @if($user)
        document.getElementById('attendance-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const form = this;
            const submitBtn = document.getElementById('submit-btn');
            const loading = document.getElementById('loading');
            const alertContainer = document.getElementById('alert-container');
            
            // Show loading state
            form.style.display = 'none';
            loading.style.display = 'block';
            submitBtn.disabled = true;
            
            // Clear previous alerts
            alertContainer.innerHTML = '';
            
            try {
                const formData = new FormData(form);
                const response = await fetch('/api/mass-attendance', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alertContainer.innerHTML = `
                        <div class="alert alert-success">
                            <strong>Success!</strong> ${result.message}
                        </div>
                    `;
                    
                    // Reset form after successful submission
                    form.reset();
                    
                    // Redirect after 3 seconds
                    setTimeout(() => {
                        window.location.href = '/admin/analytics';
                    }, 3000);
                    
                } else {
                    alertContainer.innerHTML = `
                        <div class="alert alert-error">
                            <strong>Error:</strong> ${result.message}
                        </div>
                    `;
                }
                
            } catch (error) {
                alertContainer.innerHTML = `
                    <div class="alert alert-error">
                        <strong>Error:</strong> Something went wrong. Please try again.
                    </div>
                `;
            } finally {
                // Hide loading state
                loading.style.display = 'none';
                form.style.display = 'block';
                submitBtn.disabled = false;
            }
        });
        @endif
    </script>
</body>
</html>
