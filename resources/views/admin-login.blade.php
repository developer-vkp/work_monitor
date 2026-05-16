<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - VKP Work Monitor</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            height: 100vh;
            overflow: hidden;
            background: #f1f5f9;
            position: relative;
        }

        .login-container {
            position: relative;
            z-index: 10;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px 20px;
        }

        .login-card {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            border-radius: 30px;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
            overflow: hidden;
            max-width: 1100px;
            width: 100%;
            display: grid;
            grid-template-columns: 45% 55%;
            min-height: 650px;
            border: 1px solid rgba(255, 255, 255, 0.5);
        }

        /* Left Side - Branding */
        .login-brand {
            background: linear-gradient(160deg, #003D5C 0%, #0369A1 60%, #0891B2 100%);
            padding: 60px 50px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
        }

        .login-brand::before {
            content: '';
            position: absolute;
            width: 350px;
            height: 350px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            top: -100px;
            right: -100px;
        }

        .login-brand::after {
            content: '';
            position: absolute;
            width: 250px;
            height: 250px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 50%;
            bottom: -80px;
            left: -80px;
        }

        .logo-wrapper {
            position: relative;
            z-index: 2;
            text-align: center;
            animation: fadeInUp 0.8s ease-out;
        }

        .logo-circle {
            width: 240px;
            height: 240px;
            background: #ffffff;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 35px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
            padding: 35px;
            transition: transform 0.5s ease;
        }

        .logo-circle:hover {
            transform: scale(1.05) rotate(5deg);
        }

        .logo-circle img {
            width: 100%;
            height: auto;
            object-fit: contain;
        }

        .brand-title {
            color: #ffffff;
            font-size: 44px;
            font-weight: 800;
            margin-bottom: 15px;
            text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.15);
            letter-spacing: -0.5px;
        }

        .brand-subtitle {
            color: rgba(255, 255, 255, 0.95);
            font-size: 17px;
            font-weight: 400;
            line-height: 1.7;
            max-width: 320px;
            margin: 0 auto;
        }

        /* Right Side - Form */
        .login-form {
            padding: 60px 55px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: #ffffff;
        }

        .form-header {
            margin-bottom: 45px;
            animation: fadeInUp 0.8s ease-out 0.2s backwards;
        }

        .form-title {
            font-size: 36px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
        }

        .form-description {
            color: #64748b;
            font-size: 15px;
            font-weight: 400;
        }

        .alert {
            padding: 15px 18px;
            border-radius: 12px;
            margin-bottom: 25px;
            font-size: 14px;
            font-weight: 500;
            animation: slideDown 0.4s ease-out;
        }

        .alert-danger {
            background-color: #fef2f2;
            color: #991b1b;
            border: 1.5px solid #fecaca;
        }

        .alert-success {
            background-color: #ecfdf5;
            color: #065f46;
            border: 1.5px solid #a7f3d0;
        }

        .form-group {
            margin-bottom: 26px;
            animation: fadeInUp 0.8s ease-out 0.3s backwards;
        }

        .form-label {
            display: block;
            margin-bottom: 10px;
            color: #1e293b;
            font-weight: 600;
            font-size: 14px;
            letter-spacing: 0.2px;
        }

        .form-input {
            width: 100%;
            padding: 15px 18px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 500;
            transition: all 0.3s ease;
            background: #f8fafc;
            color: #0f172a;
            font-family: 'Inter', sans-serif;
        }

        .form-input::placeholder {
            color: #94a3b8;
            font-weight: 400;
        }

        .form-input:focus {
            outline: none;
            border-color: #0891B2;
            background: #ffffff;
            box-shadow: 0 0 0 5px rgba(8, 145, 178, 0.08);
            transform: translateY(-1px);
        }

        .password-wrapper {
            position: relative;
        }

        .password-wrapper .form-input {
            padding-right: 50px;
        }

        .toggle-password {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #64748b;
            transition: color 0.3s ease;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .toggle-password:hover {
            color: #0891B2;
        }

        .toggle-password svg {
            width: 20px;
            height: 20px;
        }

        .form-options {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-bottom: 32px;
            animation: fadeInUp 0.8s ease-out 0.4s backwards;
        }

        .checkbox-wrapper {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .custom-checkbox {
            width: 20px;
            height: 20px;
            cursor: pointer;
            accent-color: #0891B2;
        }

        .checkbox-label {
            font-size: 14px;
            color: #475569;
            cursor: pointer;
            font-weight: 500;
        }

        .forgot-link {
            color: #0891B2;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .forgot-link:hover {
            color: #0369A1;
            text-decoration: underline;
        }

        .btn-submit {
            width: 100%;
            padding: 17px 24px;
            background: linear-gradient(135deg, #0369A1 0%, #0891B2 100%);
            background-size: 200% 100%;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.4s ease;
            box-shadow: 0 8px 20px rgba(8, 145, 178, 0.35);
            letter-spacing: 0.5px;
            animation: fadeInUp 0.8s ease-out 0.5s backwards;
            position: relative;
            overflow: hidden;
        }

        .btn-submit::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.5s ease;
        }

        .btn-submit:hover::before {
            left: 100%;
        }

        .btn-submit:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 28px rgba(8, 145, 178, 0.45);
            background-position: 100% 0;
        }

        .btn-submit:active {
            transform: translateY(-1px);
        }

        .form-footer {
            text-align: center;
            margin-top: 35px;
            padding-top: 30px;
            border-top: 1.5px solid #e2e8f0;
            animation: fadeIn 0.8s ease-out 0.6s backwards;
        }

        .footer-text {
            color: #64748b;
            font-size: 13px;
            font-weight: 500;
        }

        .error-message {
            color: #dc2626;
            font-size: 13px;
            margin-top: 8px;
            display: block;
            font-weight: 500;
        }

        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Responsive Design */
        @media (max-width: 968px) {
            .login-card {
                grid-template-columns: 1fr;
                max-width: 500px;
            }

            .login-brand {
                padding: 50px 30px;
                min-height: auto;
            }

            .logo-circle {
                width: 180px;
                height: 180px;
                margin-bottom: 25px;
            }

            .brand-title {
                font-size: 34px;
            }

            .brand-subtitle {
                font-size: 15px;
            }
        }

        @media (max-width: 480px) {
            .login-container {
                padding: 20px 15px;
            }

            .login-card {
                border-radius: 24px;
            }

            .login-brand {
                padding: 40px 25px;
            }

            .login-form {
                padding: 40px 30px;
            }

            .form-title {
                font-size: 28px;
            }

            .logo-circle {
                width: 150px;
                height: 150px;
            }

            .brand-title {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <!-- Left Side - Branding -->
            <div class="login-brand">
                <div class="logo-wrapper">
                    <div class="logo-circle">
                        <img src="{{ asset('storage/images/logo.png') }}" alt="VKP Logo">
                    </div>
                    <h1 class="brand-title">Work Monitor</h1>
                    <p class="brand-subtitle">Track, Monitor, and Optimize Your Team's Productivity</p>
                </div>
            </div>

            <!-- Right Side - Login Form -->
            <div class="login-form">
                <div class="form-header">
                    <h2 class="form-title">Admin Login</h2>
                    <p class="form-description">Welcome back! Please login to your account.</p>
                </div>

                @if(session('error'))
                    <div class="alert alert-danger">
                        {{ session('error') }}
                    </div>
                @endif

                @if(session('success'))
                    <div class="alert alert-success">
                        {{ session('success') }}
                    </div>
                @endif

                <form method="POST" action="{{ route('admin.login.submit') }}">
                    @csrf

                    <div class="form-group">
                        <label for="email" class="form-label">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            class="form-input"
                            placeholder="admin@vkp.org"
                            value="{{ old('email') }}"
                            required
                            autofocus
                        >
                        @error('email')
                            <span class="error-message">{{ $message }}</span>
                        @enderror
                    </div>

                    <div class="form-group">
                        <label for="password" class="form-label">Password</label>
                        <div class="password-wrapper">
                            <input
                                type="password"
                                id="password"
                                name="password"
                                class="form-input"
                                placeholder="Enter your password"
                                required
                            >
                            <span class="toggle-password" onclick="togglePassword()">
                                <svg id="eye-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <svg id="eye-slash-icon" style="display: none;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            </span>
                        </div>
                        @error('password')
                            <span class="error-message">{{ $message }}</span>
                        @enderror
                    </div>

                    <div class="form-options">
                        <a href="#" class="forgot-link">Forgot Password?</a>
                    </div>

                    <button type="submit" class="btn-submit">Sign In</button>
                </form>

                <div class="form-footer">
                    <p class="footer-text">&copy; 2026 VKP Work Monitor. All rights reserved.</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const eyeIcon = document.getElementById('eye-icon');
            const eyeSlashIcon = document.getElementById('eye-slash-icon');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.style.display = 'none';
                eyeSlashIcon.style.display = 'block';
            } else {
                passwordInput.type = 'password';
                eyeIcon.style.display = 'block';
                eyeSlashIcon.style.display = 'none';
            }
        }
    </script>
</body>
</html>
