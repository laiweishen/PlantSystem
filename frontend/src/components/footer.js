import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './footer.css';
import { useAuth } from '../hooks/useAuth'; 

export default function Footer() {
  const { isAuthenticated } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const navigate = useNavigate();

  const handleProtectedLinkClick = (e, path) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowLoginPrompt(true);
    }
  };

  const closeLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <footer className="footer">

    {showLoginPrompt && (
        <div className="login-prompt-overlay" onClick={closeLoginPrompt}>
          <div className="login-prompt-popup" onClick={(e) => e.stopPropagation()}>
            <div className="login-prompt-icon">🔒</div>
            <h3 className="login-prompt-title">Authentication Required</h3>
            <p className="login-prompt-message">
              Please log in to access this feature
            </p>
            <div className="login-prompt-buttons">
              <button
                className="login-prompt-cancel"
                onClick={closeLoginPrompt}
              >
                Cancel
              </button>
              <button
                className="login-prompt-login"
                onClick={goToLogin}
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="footer-content">
        {/* Left Section - Logo & Description */}
        <div className="footer-section">
          <div className="footer-logo">
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sprout-icon lucide-sprout"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" /><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" /><path d="M5 21h14" /></svg>
            </div>
            <div className="footer-logo-text">
              <div className="logo-title">Plantora</div>
              <div className="logo-subtitle">Recognition & Learning</div>
            </div>
          </div>
          <p className="footer-description">
            Transforming plant education with AI-powered recognition,
            disease detection, and interactive learning experiences.
          </p>
        </div>

        {/* Middle Section - Quick Links */}
        <div className="footer-section">
          <h3 className="footer-heading">Quick Links</h3>
          <ul className="footer-links">
            <li><Link to="/recognize" className="footer-link" onClick={(e) => handleProtectedLinkClick(e, '/recognize')}>Plant Recognition</Link></li>
            <li><Link to="/quiz" className="footer-link" onClick={(e) => handleProtectedLinkClick(e, '/quiz')}>Learning Quiz</Link></li>
            <li><Link to="/diseaseRecognition" className="footer-link" onClick={(e) => handleProtectedLinkClick(e, '/diseaseRecognition')}>Disease Detection</Link></li>
            <li><Link to="/profile" className="footer-link" onClick={(e) => handleProtectedLinkClick(e, '/profile')}>My Profile</Link></li>
          </ul>
        </div>

        {/* Right Section - Contact & Support */}
        <div className="footer-section">
          <h3 className="footer-heading">Support</h3>
          <ul className="footer-links">
            <li><a href="mailto:support@plantora.com" className="footer-link">📧 support@plantora.com</a></li>
            <li><a href="tel:+60123456789" className="footer-link">📞 +60 12-345 6789</a></li>
            <li><Link to="/help" className="footer-link">❓ Help Center</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar - Copyright */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; 2024 Plantora. All rights reserved.</p>

        </div>
      </div>
    </footer>
  );
}