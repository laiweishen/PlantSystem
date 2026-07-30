import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, ChevronDown, ArrowLeft } from 'lucide-react';
import '../css/user/loginPage.css';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/apiConfig';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'Student'
    });
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        capital: false,
        number: false,
        special: false
    });

    const checkPasswordRequirements = (password) => {
        setPasswordRequirements({
            length: password.length >= 8,
            capital: /(?=.*[A-Z])/.test(password),
            number: /(?=.*\d)/.test(password),
            special: /(?=.*[!@#$%^&*(),.?":{}|<>_\-\\[\];'/`~])/.test(password)
        });
    };


    //the browser title
    React.useEffect(() => {
        document.title = "Plantora - Recognition & Learning";

        // Use emoji as favicon
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.rel = 'icon';
        link.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌿</text></svg>";
        document.getElementsByTagName('head')[0].appendChild(link);
    }, []);


    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Check password requirements when password changes
        if (name === 'password') {
            checkPasswordRequirements(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email.trim() || !formData.password.trim()) {
            alert('Please fill in all fields');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(formData.email)) {
            alert('Please enter a valid email address.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const result = await response.json();
            console.log('📥 Login response:', result);

            if (result.success) {
                sessionStorage.setItem('userToken', result.token);

                const userData = {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    role: result.user.role,
                    imageUrl: result.user.imageUrl || null,
                    bio: result.user.bio || null
                };

                sessionStorage.setItem('user', JSON.stringify(userData));
                console.log('✅ Saved user data:', userData); // Debug

                // Navigate
                if (result.user.role === 'Admin') {
                    navigate('/admin/overview');
                } else {
                    navigate('/');
                }
            } else {
                alert(result.message || 'Login failed!');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            alert('Login failed! Check if C# backend is running.');
        } finally {
            setLoading(false);
        }
    };


    const handleRegister = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(formData.email)) {
            alert('Please enter a valid email address.');
            return;
        }

        if (!passwordRequirements.length) {
            alert('Password must be at least 8 characters long');
            return;
        }

        if (!passwordRequirements.capital) {
            alert('Password must include at least one capital letter');
            return;
        }

        if (!passwordRequirements.number) {
            alert('Password must include at least one number');
            return;
        }

        if (!passwordRequirements.special) {
            alert('Password must include at least one special character');
            return;
        }

        // Validation
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (!agreeTerms) {
            alert('Please agree to the terms and conditions');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    role: formData.role
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Registration successful! Please login with your new account.');
                setIsLogin(true);
                // Clear form
                setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    name: '',
                    role: 'Student'
                });
                setAgreeTerms(false);
            } else {
                alert(result.message || 'Registration failed!');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed! Check if C# backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <header className="header">
                <div className="logo-container">
                    <div className="logo-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sprout-icon lucide-sprout"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" />
                            <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" /><path d="M5 21h14" />
                        </svg>
                    </div>
                    <div>
                        <div className="logo-title">Plantora</div>
                        <div className="logo-subtitle">Recognition & Learning</div>
                    </div>
                </div>
            </header>

            <div className="content-wrapper-lg">
                <button className="back-button-lg" onClick={() => navigate('/')}>
                    <ArrowLeft size={20} />
                    Back
                </button>

                <h1 className="page-title-lg">
                    Intelligent Plant <span className="page-title-accent-lg">Recognition System</span>
                </h1>

                {isLogin ? (
                    <div className="auth-card">
                        <div className="auth-left login-left">
                            <div className="welcome-section">
                                <h2 className="welcome-title">Welcome</h2>
                                <p className="welcome-text">To enjoy more features, kindly sign in with your account</p>
                                <div className="plant-image-lg">
                                    <img
                                        src={`${API_BASE_URL}/uploads/signUpPhoto.jpg`}
                                        alt="Description"
                                        className="signup-image"
                                    />
                                </div>
                                <p className="signup-link">
                                    Don't have an account? <a onClick={() => setIsLogin(false)}>Click Here</a> to Register
                                </p>
                            </div>
                        </div>

                        <div className="auth-right login-right">
                            <div style={{ width: '100%', maxWidth: '400px' }}>
                                <h2 className="form-title" style={{ color: 'white' }}>User Log In</h2>


                                {/* Wrap everything in a form tag */}
                                <form onSubmit={handleSubmit} style={{ all: 'unset' }}>
                                    {/* Email Input */}
                                    <div className="form-group">
                                        <div className="input-wrapper">
                                            <User className="input-icon" size={20} style={{ color: 'white' }} />
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-input"
                                                placeholder="Email Address"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                style={{ color: 'white', borderBottomColor: 'white' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Password Input */}
                                    <div className="form-group">
                                        <div className="input-wrapper">
                                            <Lock className="input-icon" size={20} style={{ color: 'white' }} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                className="form-input"
                                                placeholder="Password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                style={{ color: 'white', borderBottomColor: 'white' }}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ color: 'white' }}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        
                                    </div>

                                    <div className="form-footer" style={{ color: 'white' }}>

                                        <a
                                            className="forgot-password"
                                            style={{ color: 'white', cursor: 'pointer' }}
                                            onClick={() => setShowForgotPassword(true)}
                                        >
                                            Forgot Password?
                                        </a>

                                    </div>

                                    <button
                                        type="submit"
                                        className="submit-btn"
                                        style={{ background: 'white', color: '#22c55e' }}
                                        disabled={loading}
                                    >
                                        {loading ? 'Logging in...' : 'Login'}
                                    </button>
                                </form>
                            </div>

                        </div>
                    </div>

                ) : (
                    <div className="auth-card">
                        <div className="auth-left">
                            <div style={{ width: '100%' }}>
                                <h2 className="form-title">Sign Up</h2>

                                {/* ADD FORM TAG HERE */}
                                <form onSubmit={handleRegister} style={{ all: 'unset' }}>
                                    {/* Name Input */}
                                    <div className="form-group">
                                        <div className="input-wrapper">
                                            <input
                                                type="text"
                                                name="name"
                                                className="form-input"
                                                placeholder="Full Name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Email Input */}
                                    <div className="form-group">
                                        <div className="input-wrapper">
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-input"
                                                placeholder="Email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Password Input */}
                                    <div className="form-group">
                                        <div className="input-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                className="form-input"
                                                placeholder="Password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        {formData.password && (
                                            <div className="password-requirements">
                                                <p style={{ fontSize: '12px', margin: '8px 0 4px 0', color: '#666' }}>
                                                    Password must contain:
                                                </p>
                                                <ul style={{ fontSize: '11px', color: '#666', margin: 0, paddingLeft: '16px' }}>
                                                    <li style={{ color: passwordRequirements.length ? 'green' : 'red' }}>
                                                        At least 8 characters
                                                    </li>
                                                    <li style={{ color: passwordRequirements.capital ? 'green' : 'red' }}>
                                                        One capital letter
                                                    </li>
                                                    <li style={{ color: passwordRequirements.number ? 'green' : 'red' }}>
                                                        One number
                                                    </li>
                                                    <li style={{ color: passwordRequirements.special ? 'green' : 'red' }}>
                                                        One special character
                                                    </li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm Password Input */}
                                    <div className="form-group">
                                        <div className="input-wrapper">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                className="form-input"
                                                placeholder="Confirm Password"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Role Select */}
                                    <div className="form-group">
                                        <div className="select-wrapper">
                                            <select
                                                name="role"
                                                className="form-select"
                                                value={formData.role}
                                                onChange={handleInputChange}
                                            >
                                                <option value="Student">Student</option>
                                                <option value="Researcher">Researcher</option>
                                                <option value="Enthusiast">Nature Enthusiast</option>
                                                <option value="Teacher">Teacher</option>
                                                <option value="Farmer">Farmer</option>
                                            </select>
                                            <ChevronDown className="select-icon" size={20} />
                                        </div>
                                    </div>

                                    <label className="checkbox-group">
                                        <input
                                            type="checkbox"
                                            checked={agreeTerms}
                                            onChange={(e) => setAgreeTerms(e.target.checked)}
                                        />
                                        <span className="checkbox-label">
                                            By signing up, you agree Term of Service & Privacy Policy
                                        </span>
                                    </label>

                                    {/* Change button type to "submit" */}
                                    <button
                                        type="submit"
                                        className="submit-btn"
                                        disabled={loading}
                                    >
                                        {loading ? 'Creating Account...' : 'Sign Up'}
                                    </button>
                                </form>
                                <p className="login-link">
                                    Already have account ? <a onClick={() => setIsLogin(true)}>Click Here</a> to Login
                                </p>
                            </div>
                        </div>

                        <div className="auth-right">
                            <img
                                src={`${API_BASE_URL}/uploads/signUpPhoto.jpg`}
                                alt="Description"
                                className="signup-image"
                            />
                        </div>
                    </div>
                )}
            </div>

            {showForgotPassword && (
                <div
                    className="forgot-password-modal-fpm"
                    onClick={() => setShowForgotPassword(false)}
                >
                    <div
                        className="modal-content-fpm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="close-x-btn-fpm"
                            onClick={() => setShowForgotPassword(false)}
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <h2>Password Reset</h2>
                        {resetSent ? (
                            <p>Check your email for password reset instructions!</p>
                        ) : (
                            <>
                                <input
                                    className="email-input-fpm"
                                    type="email"
                                    placeholder="Your registered email"
                                    value={resetEmail}
                                    onChange={e => setResetEmail(e.target.value)}
                                />
                                <div className="modal-buttons-fpm">
                                    <button
                                        className="send-reset-btn-fpm"
                                        onClick={async () => {
                                            if (!resetEmail) { alert('Enter your email.'); return; }
                                            setResetLoading(true); // start loading 
                                            try {
                                                const res = await fetch(`${API_BASE_URL}/api/auth/forgot`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ email: resetEmail })
                                                });
                                                const result = await res.json();
                                                if (result.success) setResetSent(true);
                                                else alert(result.message || 'No account for this email.');
                                            } finally {
                                                setResetLoading(false); // stop loading
                                            }
                                        }}
                                        disabled={resetLoading} //disable double click
                                    >
                                        {resetLoading ? ( //spinner for loading
                                            <>
                                                <span className="spinner" /> Sending email, please wait...
                                            </>
                                        ) : (
                                            "Send Reset Link"
                                        )}
                                    </button>
                                    <button
                                        className="close-modal-btn-fpm"
                                        onClick={() => setShowForgotPassword(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}


        </div>

    );
}