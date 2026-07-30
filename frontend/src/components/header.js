import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Bookmark, User, History } from 'lucide-react';
import "./header.css";

export default function Header() {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  // ⭐ Separate function to load user data
  const loadUserData = () => {
    const token = sessionStorage.getItem('userToken');
    const userData = sessionStorage.getItem('user');

    if (token && userData) {
      setIsLoggedIn(true);
      const parsedUser = JSON.parse(userData);

      setUser({
        id: parsedUser.id,
        name: parsedUser.name,
        email: parsedUser.email,
        role: parsedUser.role,
        imageUrl: parsedUser.imageUrl || null, // ⭐ Convert empty string to null
        bio: parsedUser.bio || null
      });
    }
  };

  // Listen for profile updates
  useEffect(() => {
    const handleStorageChange = () => {
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);

  const isAdmin = () => {
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === 'admin';
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setShowUserDropdown(false);
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const handleLogoClick = () => {
    const userData = sessionStorage.getItem('user');

    if (userData) {
      const user = JSON.parse(userData);

      if (user.role === 'Admin') {
        navigate('/admin/overview');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  React.useEffect(() => {
    document.title = "Plantora - Recognition & Learning";

    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌿</text></svg>";
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  const getUserInitials = () => {
    if (!user || !user.name) return 'U';

    const names = user.name.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    } else {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
  };

  const getDisplayName = () => {
    if (!user || !user.name) return 'User';
    const firstName = user.name.split(' ')[0];
    return firstName;
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setShowUserDropdown(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleMenuClick = () => {
    if (isLoggedIn) {
      setShowMenuDropdown(!showMenuDropdown);
      setShowUserDropdown(false);
    } else {
      setShowLoginPrompt(true);
    }
  };

  const closeLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  const goToLogin = () => {
    navigate('/login');
  };

  // ⭐ Check if image URL is valid
  const hasValidImage = () => {
    return user?.imageUrl && user.imageUrl !== '' && user.imageUrl !== 'null';
  };

  return (
    <header className="header">
      {showLoginPrompt && (
        <div className="login-prompt-overlay" onClick={closeLoginPrompt}>
          <div className="login-prompt-popup" onClick={(e) => e.stopPropagation()}>
            <div className="login-prompt-icon">🔒</div>
            <h3 className="login-prompt-title">Authentication Required</h3>
            <p className="login-prompt-message">
              Please log in to access menu features
            </p>
            <div className="login-prompt-buttons">
              <button className="login-prompt-cancel" onClick={closeLoginPrompt}>
                Cancel
              </button>
              <button className="login-prompt-login" onClick={goToLogin}>
                Log In
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-popup">
            <div className="logout-confirm-icon">⚠️</div>
            <h3 className="logout-confirm-title">Confirm Logout</h3>
            <p className="logout-confirm-message">Are you sure you want to log out?</p>
            <div className="logout-confirm-buttons">
              <button className="logout-confirm-cancel" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="logout-confirm-logout" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="logo-container" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <div className="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" />
            <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" />
            <path d="M5 21h14" />
          </svg>
        </div>
        <div>
          <div className="logo-title">Plantora</div>
          <div className="logo-subtitle">Recognition & Learning</div>
        </div>
      </div>

      <div className="header-right">
        {!isAdmin() && (
          <>
            <button className="menu-btn" onClick={handleMenuClick} style={{ position: 'relative' }}>
              <div className="menu-line"></div>
              <div className="menu-line"></div>
              <div className="menu-line"></div>
            </button>

            {showMenuDropdown && isLoggedIn && (
              <div className="dropdown-menu menu-dropdown">
                <Link to="/recognize" className="dropdown-item" onClick={() => setShowMenuDropdown(false)}>
                  🌿 Plant Recognition
                </Link>
                <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                <Link to="/diseaseRecognition" className="dropdown-item" onClick={() => setShowMenuDropdown(false)}>
                  🩺 Disease Detection
                </Link>
                <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                <Link to="/quiz" className="dropdown-item" onClick={() => setShowMenuDropdown(false)}>
                  📚 Interactive Learning
                </Link>
                <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                <Link to="/plantDetails" className="dropdown-item" onClick={() => setShowMenuDropdown(false)}>
                  🪴📖 Plant Details
                </Link>
                <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                <Link to="/diseaseDetails" className="dropdown-item" onClick={() => setShowMenuDropdown(false)}>
                  🩺📖 Disease Details
                </Link>
              </div>
            )}
          </>
        )}

        {isLoggedIn ? (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isAdmin() && (
              <div className="user-info-display">
                <span className="user-display-name">{getDisplayName()}</span>
                <span className="user-display-role">{user.role}</span>
              </div>
            )}

            {/* ⭐ Updated Avatar with better image checking */}
            <div
              className="user-avatar"
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowMenuDropdown(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              {hasValidImage() ? (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="user-avatar-image"
                  onError={(e) => {
                    console.log('❌ Image failed to load:', user.imageUrl);
                    e.target.style.display = 'none';
                    e.target.parentElement.textContent = getUserInitials();
                  }}
                />
              ) : (
                getUserInitials()
              )}
            </div>

            {showUserDropdown && (
              <div className="dropdown-menu user-dropdown">
                <div style={{
                  padding: '0.5rem 1rem',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  Welcome, <strong>{getDisplayName()}</strong>!
                  {isAdmin() && (
                    <span style={{
                      display: 'block',
                      marginTop: '0.25rem',
                      color: '#3b82f6',
                      fontWeight: '600',
                      fontSize: '0.75rem'
                    }}>
                      {user.role}
                    </span>
                  )}
                </div>

                {!isAdmin() && (
                  <>
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <User size={18} style={{ marginRight: '8px' }} />
                      Profile
                    </Link>

                    <Link
                      to="/bookmarks"
                      className="dropdown-item"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <Bookmark size={20} style={{ marginRight: '8px' }} />
                      Bookmark
                    </Link>

                    <Link
                      to="/scan-history"
                      className="dropdown-item"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <History size={20} style={{ marginRight: '8px' }} />
                      History
                    </Link>
                  </>
                )}

                <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                <button onClick={handleLogoutClick} className="dropdown-item logout-item">
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              className="btn-primary"
              onClick={() => navigate('/login')}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              style={{
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
                boxShadow: showTooltip ? '0 4px 12px rgba(74, 222, 128, 0.4)' : 'none'
              }}
            >
              <LogIn size={18} />
            </button>

            {showTooltip && (
              <div className="toolTip">
                Login
                <div className="toolTip-2" />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
