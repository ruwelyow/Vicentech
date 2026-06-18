@extends('layouts.app')

@section('content')
<div class="container">
    <!-- DEBUG BANNER: helps identify which register view is rendered in the browser -->
    <div style="background:#fee2e2;color:#991b1b;padding:10px;border:2px solid #fecaca;margin-bottom:12px;border-radius:6px;text-align:center;font-weight:700;">
        DEBUG: You are viewing the Blade template at resources/views/auth/register.blade.php
    </div>
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">{{ __('Register') }}</div>

                <div class="card-body">
                    <form method="POST" action="{{ route('register') }}">
                        @csrf

                        <div class="row mb-3">
                            <label for="first_name" class="col-md-4 col-form-label text-md-end">{{ __('First Name') }}</label>

                            <div class="col-md-6">
                                <input id="first_name" type="text" class="form-control @error('first_name') is-invalid @enderror" name="first_name" value="{{ old('first_name') }}" required autocomplete="given-name" autofocus>

                                @error('first_name')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>
                        </div>

                        <div class="row mb-3">
                            <label for="middle_name" class="col-md-4 col-form-label text-md-end">{{ __('Middle Name') }}</label>

                            <div class="col-md-6">
                                <input id="middle_name" type="text" class="form-control @error('middle_name') is-invalid @enderror" name="middle_name" value="{{ old('middle_name') }}" autocomplete="additional-name">

                                @error('middle_name')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>
                        </div>

                        <div class="row mb-3">
                            <label for="last_name" class="col-md-4 col-form-label text-md-end">{{ __('Last Name') }}</label>

                            <div class="col-md-6">
                                <input id="last_name" type="text" class="form-control @error('last_name') is-invalid @enderror" name="last_name" value="{{ old('last_name') }}" required autocomplete="family-name">

                                @error('last_name')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>
                        </div>

                        <div class="row mb-3">
                            <label for="suffix" class="col-md-4 col-form-label text-md-end">{{ __('Suffix') }}</label>

                            <div class="col-md-6">
                                <input id="suffix" type="text" class="form-control @error('suffix') is-invalid @enderror" name="suffix" value="{{ old('suffix') }}" autocomplete="honorific-suffix">

                                @error('suffix')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>
                        </div>

                        <div class="row mb-3">
                            <label for="email" class="col-md-4 col-form-label text-md-end">{{ __('Email Address') }}</label>

                            <div class="col-md-6">
                                <input id="email" type="email" class="form-control @error('email') is-invalid @enderror" name="email" value="{{ old('email') }}" required autocomplete="email">

                                @error('email')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>
                        </div>

                        <div class="row mb-3">
                            <label for="password" class="col-md-4 col-form-label text-md-end">{{ __('Password') }}</label>

                            <div class="col-md-6">
                                <input id="password" type="password" class="form-control @error('password') is-invalid @enderror" name="password" required autocomplete="new-password">

                                @error('password')
                                    <span class="invalid-feedback" role="alert">
                                        <strong>{{ $message }}</strong>
                                    </span>
                                @enderror
                            </div>
                        </div>

                        <div class="row mb-3">
                            <label for="password-confirm" class="col-md-4 col-form-label text-md-end">{{ __('Confirm Password') }}</label>

                            <div class="col-md-6">
                                <input id="password-confirm" type="password" class="form-control" name="password_confirmation" required autocomplete="new-password">
                            </div>
                        </div>

                        <div class="row mb-0">
                            <div class="col-md-6 offset-md-4">
                                <button type="submit" class="btn btn-primary">
                                    {{ __('Register') }}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Function to validate name fields - only allow letters and spaces
        function validateNameField(event) {
            const allowedChars = /^[a-zA-Z\s]$/;
            const char = event.key;

            // Allow control keys (backspace, delete, arrows, etc.)
            if (char.length > 1) return;

            // Allow space and letters
            if (!allowedChars.test(char)) {
                event.preventDefault();
            }
        }

        // Function to validate suffix - only allow letters
        function validateSuffixField(event) {
            const allowedChars = /^[a-zA-Z]$/;
            const char = event.key;

            // Allow control keys (backspace, delete, arrows, etc.)
            if (char.length > 1) return;

            // Allow only letters
            if (!allowedChars.test(char)) {
                event.preventDefault();
            }
        }

        // Add event listeners to name fields
        document.getElementById('first_name').addEventListener('keypress', validateNameField);
        document.getElementById('middle_name').addEventListener('keypress', validateNameField);
        document.getElementById('last_name').addEventListener('keypress', validateNameField);
        document.getElementById('suffix').addEventListener('keypress', validateSuffixField);

        // Also validate on paste
        function validateNamePaste(event) {
            const pastedText = (event.clipboardData || window.clipboardData).getData('text');
            const allowedChars = /^[a-zA-Z\s]*$/;
            if (!allowedChars.test(pastedText)) {
                event.preventDefault();
            }
        }

        function validateSuffixPaste(event) {
            const pastedText = (event.clipboardData || window.clipboardData).getData('text');
            const allowedChars = /^[a-zA-Z]*$/;
            if (!allowedChars.test(pastedText)) {
                event.preventDefault();
            }
        }

        document.getElementById('first_name').addEventListener('paste', validateNamePaste);
        document.getElementById('middle_name').addEventListener('paste', validateNamePaste);
        document.getElementById('last_name').addEventListener('paste', validateNamePaste);
        document.getElementById('suffix').addEventListener('paste', validateSuffixPaste);
    </script>
</div>
@endsection
