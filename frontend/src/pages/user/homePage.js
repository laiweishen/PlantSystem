import React, { useRef , useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/header'; 
import Footer from '../../components/footer'; 
import '../css/user/homePage.css';
import { useAuth } from '../../hooks/useAuth';

export default function PlantIQApp() {
  const { isAuthenticated } = useAuth(); 
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const featuresRef = useRef(null);
  const navigate = useNavigate();
  
  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClick = () => { //use for icon click
    if (isAuthenticated) {
      navigate('/recognize');
    } else {
      setShowLoginPrompt(true);
    }
  };
  
    const handleFeatureClick = (e, path) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowLoginPrompt(true);
    }
    // If authenticated, Link will handle navigation naturally
  };

  const closeLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="app">
      <Header />

      {/* Login Prompt Modal */}
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

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          Intelligent Plant<br />
          <span className="hero-title-accent">Recognition System</span>
        </h1>
        <p className="hero-description">
          Transform plant learning with AI-powered recognition, disease detection, and
          interactive educational experiences. Perfect for students, teachers, and nature
          enthusiasts.
        </p>
        <div className="hero-buttons">
          <button className="btn-primary" onClick={handleClick}>
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 8L16 8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Start Recognize Plants
          </button>
          <button className="btn-secondary" onClick={scrollToFeatures}>
            See Our Features
          </button>
        </div>
        <button className="scroll-indicator" onClick={scrollToFeatures} aria-label="Scroll down">
          <ChevronDown size={32} />
        </button>
      </section>

      {/* Features Section */}
      <section className="features-section" ref={featuresRef}>
        <h2 className="features-title">
          Powerful Features for <span className="features-title-accent">Modern Learning</span>
        </h2>
        <p className="features-subtitle">
          Our AI-driven platform combines cutting-edge technology with educational excellence
        </p>

        <div className="features-grid">
          {/* AI Plant Recognition */}
          <div className="feature-card feature-card-green">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 8L16 8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="feature-title">
              AI Plant Recognition
            </h3>
            <p className="feature-description">
              Upload or capture plant images for instant identification using advanced machine learning
            </p>
            <Link to="/recognize" 
                  className="feature-link"
                  onClick={(e) => handleFeatureClick(e, '/recognize')}
            >
            Learn More &gt;
            </Link>
          </div>

          {/* Disease Detection */}
          <div className="feature-card feature-card-pink">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-scan-eye-icon lucide-scan-eye">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="1"/>
              <path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0"/>
              </svg>
            </div>
            <h3 className="feature-title">
              Disease Detection
            </h3>
            <p className="feature-description">
              Detect plant diseases and get treatment recommendations with severity analysis
            </p>
            <Link to="/diseaseRecognition" 
              className="feature-link"
              onClick={(e) => handleFeatureClick(e, '/diseaseRecognition')}
            >
            Learn More &gt;
            </Link>
          </div>

          {/* Interactive Learning */}
          <div className="feature-card feature-card-purple">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap-icon lucide-graduation-cap"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
              <path d="M22 10v6"/>
              <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
              </svg>
            </div>
            <h3 className="feature-title">
              Interactive Learning
            </h3>
            <p className="feature-description">
              Engage with quizzes, flashcards, and educational content to enhance your knowledge
            </p>
            <Link to="/quiz" 
              className="feature-link"
              onClick={(e) => handleFeatureClick(e, '/quiz')}
            >
            Learn More &gt;
            </Link>
          </div>

          {/* Two Plant Details  */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

            {/* Plant Details */}
            <div className="feature-card feature-card-darkgreen" style={{ flex: '1', minWidth: '300px' }}>
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-library-big-icon lucide-library-big">
                  <rect width="8" height="18" x="3" y="3" rx="1" />
                  <path d="M7 3v18" /><path d="M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z" />
                </svg>
              </div>
              <h3 className="feature-title">
                Plant Details
              </h3>
              <p className="feature-description">
                Get More About Plant Details through here
              </p>
              <Link to="/plantDetails" className="feature-link" onClick={(e) => handleFeatureClick(e, '/plantDetails')}>Learn More &gt;</Link>
            </div>

            {/* Disease Details */}
            <div className="feature-card feature-card-darkred" style={{ flex: '1', minWidth: '300px' }}>
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-icon lucide-book">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>
                </svg>
              </div>
              <h3 className="feature-title">
                Disease Details
              </h3>
              <p className="feature-description">
                Get More About Disease Details through here
              </p>
              <Link to="/diseaseDetails" className="feature-link" onClick={(e) => handleFeatureClick(e, '/diseaseDetails')}>Learn More &gt;</Link>
            </div>
          </div>
    

      
        </div>
      </section>

      <Footer />
    </div>
  );
};