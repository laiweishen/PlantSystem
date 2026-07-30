import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Calendar, TrendingUp } from 'lucide-react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import '../css/user/quizHistory.css';
import { API_BASE_URL } from '../../config/apiConfig';

export default function QuizHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, plant, disease

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const token = sessionStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/quiz/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      } else {
        setError('Failed to load quiz history');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.quizType.toLowerCase() === filter;
  });

  const stats = {
    total: history.length,
    plant: history.filter(h => h.quizType.toLowerCase() === 'plant').length,
    disease: history.filter(h => h.quizType.toLowerCase() === 'disease').length,
    mixed: history.filter(h => h.quizType.toLowerCase() === 'mixed').length,
    avgScore: history.length > 0 
      ? Math.round(history.reduce((sum, h) => sum + h.percentage, 0) / history.length)
      : 0
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="quiz-history-page">
      <Header />

      <div className="history-container">
        <button className="back-button-QH" onClick={() => navigate('/quiz')}>
          <ArrowLeft size={24} />
        </button>

        <h1 className="page-title-qh">Quiz History</h1>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card-qh">
            <div className="stat-icon-qh">
              <Trophy size={32} />
            </div>
            <div className="stat-info">
              <span className="stat-value-qh">{stats.total}</span>
              <span className="stat-label-qh">Total Quizzes</span>
            </div>
          </div>

          <div className="stat-card-qh">
            <div className="stat-icon-qh plant">
              <TrendingUp size={32} />
            </div>
            <div className="stat-info">
              <span className="stat-value-qh">{stats.avgScore}%</span>
              <span className="stat-label-qh">Average Score</span>
            </div>
          </div>

          <div className="stat-card-qh">
            <div className="stat-icon-qh plant">
              <Calendar size={32} />
            </div>
            <div className="stat-info">
              <span className="stat-value-qh">{stats.plant}</span>
              <span className="stat-label-qh">Plant Quizzes</span>
            </div>
          </div>

          <div className="stat-card-qh">
            <div className="stat-icon-qh disease">
              <Calendar size={32} />
            </div>
            <div className="stat-info">
              <span className="stat-value-qh">{stats.disease}</span>
              <span className="stat-label-qh">Disease Quizzes</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({history.length})
          </button>
          <button
            className={`filter-tab ${filter === 'plant' ? 'active' : ''}`}
            onClick={() => setFilter('plant')}
          >
            🌿 Plant ({stats.plant})
          </button>
          <button
            className={`filter-tab ${filter === 'disease' ? 'active' : ''}`}
            onClick={() => setFilter('disease')}
          >
            🦠 Disease ({stats.disease})
          </button>
          <button
            className={`filter-tab ${filter === 'mixed' ? 'active' : ''}`}
            onClick={() => setFilter('mixed')}
          >
            🔀 Mixed ({stats.mixed})
          </button>
        </div>


        {/* History List */}
        <div className="history-list">
          {loading ? (
            <div className="loading-state">Loading history...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : filteredHistory.length === 0 ? (
            <div className="empty-state">
              <Trophy size={64} className="empty-icon" />
              <h3>No quiz history yet</h3>
              <p>Complete a quiz to see your results here!</p>
              <button 
                className="start-quiz-btn"
                onClick={() => navigate('/quiz')}
              >
                Take a Quiz
              </button>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="history-item"
                onClick={() => navigate(`/quiz-review/${item.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="history-badge">
                  <span className={`quiz-type-badge ${item.quizType.toLowerCase()}`}>
                    {item.quizType === 'plant' && '🌿 Plant'}
                    {item.quizType === 'disease' && '🦠 Disease'}
                    {item.quizType === 'mixed' && '🔀 Mixed'}
                  </span>
                </div>
                
                <div className="history-content">
                  <h3>{item.quizType === 'plant' ? 'Plant' :
                    item.quizType === 'disease' ? 'Disease' :
                      'Mixed'} Quiz</h3>
                  <p className="history-date">
                    <Calendar size={16} />
                    {formatDate(item.completedAt)}
                  </p>
                </div>

                <div className="history-score">
                  <div className={`score-circle-qh ${
                    item.percentage >= 80 ? 'excellent' :
                    item.percentage >= 60 ? 'good' : 'fair'
                  }`}>
                    {item.percentage.toFixed(0)}%
                  </div>
                  <span className="score-detail">
                    {item.score}/{item.totalQuestions}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
