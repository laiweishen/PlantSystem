import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import '../css/user/quizReview.css';
import { API_BASE_URL } from '../../config/apiConfig';

export default function QuizReview() {
  const navigate = useNavigate();
  const { resultId } = useParams();
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuizDetails();
  }, [resultId]);

  const fetchQuizDetails = async () => {
    const token = sessionStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/quiz/result/${resultId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setQuizData(data);
      } else {
        setError('Failed to load quiz details');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="quiz-review-page">
        <Header />
        <div className="loading-container">Loading quiz review...</div>
        <Footer />
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="quiz-review-page">
        <Header />
        <div className="error-container">{error || 'Quiz not found'}</div>
        <Footer />
      </div>
    );
  }

  const { quizResult, details } = quizData;



  return (
    <div className="quiz-review-page">
      <Header />

      <div className="review-container">
        <button className="back-button-review" onClick={() => navigate('/quiz-history')}>
          <ArrowLeft size={24} />
        </button>

        <div className="review-header">
          <h1>Quiz Review</h1>
          <div className="quiz-summary">
            <span className="quiz-type-badge">Quiz for <strong>{quizResult.quizType}</strong></span>
            <span className="quiz-score">
              Score: {quizResult.score}/{quizResult.totalQuestions} ({quizResult.percentage}%)
            </span>
          </div>
        </div>

        <div className="questions-review">
          {details.map((question, index) => {

            return (
              <div key={index} className={`question-review-card ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                {/* Rest of your question rendering code */}
                <div className="question-header">
                  <span className="question-number">Question {index + 1}</span>
                  <span className={`result-badge ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                    {question.isCorrect ? (
                      <>
                        <CheckCircle size={20} />
                        Correct
                      </>
                    ) : (
                      <>
                        <XCircle size={20} />
                        Incorrect
                      </>
                    )}
                  </span>
                </div>

                <h3 className="question-text">{question.questionText}</h3>

                {question.imageUrl && (
                  <div className="question-image-review">
                    <img
                      src={
                        question.imageUrl.startsWith('http')
                          ? question.imageUrl
                          : `${API_BASE_URL}${question.imageUrl}`
                      }
                      alt="Question"
                      onError={e => (e.target.style.display = "none")}
                    />
                  </div>
                )}


                <div className="answers-section">
                  <div className={`answer-box your-answer ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                    <label>Your Answer:</label>
                    <p>
                      <span className="answer-letter">{question.userAnswerLetter || '?'}.</span>
                      <span className="answer-text">{question.userAnswer}</span>
                    </p>
                  </div>

                  {!question.isCorrect && (
                    <div className="answer-box correct-answer">
                      <label>Correct Answer:</label>
                      <p>
                        <span className="answer-letter">{question.correctAnswerLetter || '?'}.</span>
                        <span className="answer-text">{question.correctAnswer}</span>
                      </p>
                    </div>
                  )}
                </div>

                {question.options && (
                  <div className="all-options">
                    <label>All Options:</label>
                    <div className="options-grid">
                      {Object.entries(question.options).map(([letter, text]) => (
                        <div key={letter} className="option-item">
                          <span className="option-letter">{letter}.</span>
                          <span className="option-text">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="review-actions">
          <button className="btn-back" onClick={() => navigate('/quiz-history')}>
            Back to History
          </button>
          <button className="btn-retake" onClick={() => navigate('/quiz')}>
            Take Another Quiz
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
