import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Home, RotateCcw } from 'lucide-react';
import '../css/user/quizResults.css';

export default function QuizResults() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { score, total, percentage, quizResultId  } = location.state || {};

  if (!score && score !== 0) {
    navigate('/quiz');
    return null;
  }

  console.log('📊 QUIZ RESULTS STATE:', location.state);

  const isPassed = percentage >= 60;
  const grade = percentage >= 90 ? 'Excellent!' :
                percentage >= 75 ? 'Great!' :
                percentage >= 60 ? 'Good!' : 'Keep Practicing!';

  return (
    <div className="quiz-results-page">
      <div className="results-container">
        <div className={`results-card ${isPassed ? 'passed' : 'failed'}`}>
          <div className="trophy-icon">
            <Trophy size={64} />
          </div>
          
          <h1 className="results-title">Quiz Complete!</h1>
          <h2 className="grade">{grade}</h2>
          
          <div className="score-display">
            <div className="score-circle">
              <div className="score-text">
                <span className="score-number">{percentage.toFixed(0)}%</span>
                <span className="score-label">Score</span>
              </div>
            </div>
          </div>

          <div className="score-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Correct Answers</span>
              <span className="breakdown-value correct">{score}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Wrong Answers</span>
              <span className="breakdown-value wrong">{total - score}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Total Questions</span>
              <span className="breakdown-value">{total}</span>
            </div>
          </div>

          <div className="results-actions">
            <button 
              className="retry-button"
              onClick={() => navigate('/quiz')}
            >
              <RotateCcw size={20} />
              Try Another Quiz
            </button>

            <button
              className="review-button"
              onClick={() => navigate(`/quiz-review/${quizResultId}`)}
            >
              📝 Review Answers
            </button>

            <button 
              className="home-button"
              onClick={() => navigate('/')}
            >
              <Home size={20} />
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
