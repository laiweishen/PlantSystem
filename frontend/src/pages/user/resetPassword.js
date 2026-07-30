import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/apiConfig';
import '../css/user/resetPassword.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');
  
    React.useEffect(() => {
      document.title = "Plantora - Recognition & Learning";
  
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.rel = 'icon';
      link.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌿</text></svg>";
      document.getElementsByTagName('head')[0].appendChild(link);
    }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!password || password !== confirm) {
      alert('Passwords do not match.');
      return;
    }
    setLoading(true);
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password })
    });
    const result = await response.json();
    if (result.success) {
      alert('Password reset successful! You can now log in.');
      navigate('/login');
    } else {
      alert(result.message || 'Failed to reset password.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container-rp">
      <div className="reset-card-rp">
        <h2 className="reset-title-rp">Reset Your Password</h2>
        <p className="reset-subtitle-rp">
          Enter your new password below to reset your account password.
        </p>
        
        <form className="reset-form-rp" onSubmit={handleReset}>
          <div className="form-group-rp">
            <label className="form-label-rp">New Password</label>
            <input
              className="password-input-rp"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <span className="password-hint-rp">
              Must be at least 8 characters
            </span>
          </div>

          <div className="form-group-rp">
            <label className="form-label-rp">Confirm Password</label>
            <input
              className="password-input-rp"
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>

          <button 
            className="reset-submit-btn-rp" 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <>
                Resetting Password
                <span className="loading-spinner-rp"></span>
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="back-to-login-rp">
          Remember your password? <a href="/login">Back to Login</a>
        </div>
      </div>
    </div>
  );
}