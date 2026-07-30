import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Play, Sparkles } from 'lucide-react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import '../css/user/interactiveLearning.css';
import { API_BASE_URL } from '../../config/apiConfig';

export default function InteractiveLearning() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [publicQuizzes, setPublicQuizzes] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem('userToken');
    fetch(`${API_BASE_URL}/api/quiz`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          // Optional: show a user-friendly message if token is missing/expired
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.quizzes) setPublicQuizzes(data.quizzes);
      })
      .catch(err => {
        // Optionally, handle "not logged in" here
        console.error('Fetch quizzes error:', err);
      });
  }, []);


const startAutoQuiz = async (quizType) => {
  const token = sessionStorage.getItem('userToken');
  if (!token) {
    alert('Please login first');
    navigate('/login');
    return;
  }
  setLoading(true);
  try {
    let endpoint;
    if (quizType === 'plant') {
      endpoint = `${API_BASE_URL}/api/autoquiz/plant?count=10`;
    } else if (quizType === 'disease') {
      endpoint = `${API_BASE_URL}/api/autoquiz/disease?count=10`;
    } else if (quizType === 'mixed') {
      endpoint = `${API_BASE_URL}/api/autoquiz/mixed?count=10`;
    }

    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.success) {
      const formattedQuestions = (data.questions || []).map((q, index) => ({
        id: q.id ?? index + 1,
        questionText: q.questionText ?? q.QuestionText,
        imageUrl: q.imageUrl ?? q.ImageUrl,
        optionA: q.optionA ?? q.OptionA,
        optionB: q.optionB ?? q.OptionB,
        optionC: q.optionC ?? q.OptionC,
        optionD: q.optionD ?? q.OptionD,
        correctAnswer: q.correctAnswer ?? q.CorrectAnswer,
      }));

      navigate('/quiz-taking', {
        state: {
          questions: formattedQuestions,
          quizType: quizType,
          total: formattedQuestions.length,
        },
      });
    } else {
      alert(data.message || 'Failed to generate quiz');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to generate quiz');
  } finally {
    setLoading(false);
  }
};




  return (
    <div className="interactive-learning-page">
      <Header />

      <div className="learning-container">
        <button className="back-button-interactive" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>

        <div className="learning-header">
          <h1>Interactive Learning</h1>

          <button
            className="history-button"
            onClick={() => navigate('/quiz-history')}
          >
            <FileText size={20} />
            Quiz History
          </button>
        </div>

        <div className="quiz-cards">
          <div className="learning-section">
            <h2>Start Learning</h2>
            {/* Plant Identification Quiz */}
            <div className="quiz-card plant-quiz">
              <div className="quiz-info">
                <h3>Plant Identification</h3>
                <p>Test your ability to identify different plant species</p>
                <span className="question-count">10 questions</span>
              </div>
              <button
                className="start-quiz-btn plant-btn"
                onClick={() => startAutoQuiz('plant')}
                disabled={loading}
              >
                <Play size={20} />
                Start Quiz
              </button>
            </div>

            {/* Disease Detection Quiz */}
            <div className="quiz-card disease-quiz">
              <div className="quiz-info">
                <h3>Disease Detection</h3>
                <p>Learn to recognize plant disease and their symptoms</p>
                <span className="question-count">10 questions</span>
              </div>
              <button
                className="start-quiz-btn disease-btn"
                onClick={() => startAutoQuiz('disease')}
                disabled={loading}
              >
                <Play size={20} />
                Start Quiz
              </button>
            </div>

          </div>

          <div className="quiz-card auto-quiz">
            <div className="quiz-info">
              <div className="quiz-header-with-badge">
                <h3>Auto Quiz</h3>
              </div>
              <p>AI-generated questions from plants and diseases</p>
              <span className="question-count">Mixed 10 questions</span>
            </div>
            <button
              className="start-quiz-btn auto-btn"
              onClick={() => startAutoQuiz('mixed')}
              disabled={loading}
            >
              <Sparkles size={20} />
              Mixed Auto Quiz
            </button>
          </div>




        </div>


      </div>

      <Footer />
    </div>
  );
}
