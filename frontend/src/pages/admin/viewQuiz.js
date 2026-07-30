import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Award } from 'lucide-react';
import Header from '../../components/header';
import '../css/admin/viewQuiz.css';
import { API_BASE_URL } from '../../config/apiConfig';

export default function ViewQuiz() {
    const { id } = useParams(); // ⭐ Get quiz ID from URL
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuizDetails();
    }, [id]);

    const fetchQuizDetails = async () => {
        try {
            const token = sessionStorage.getItem('userToken');
            if (!token) {
                alert('Please log in first');
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/quiz/admin/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch quiz');
            }

            const result = await response.json();

            if (result.success) {
                setQuiz(result.quiz);
            } else {
                alert('Failed to load quiz: ' + result.message);
                navigate('/admin/quizManagement');
            }
        } catch (error) {
            console.error('Error fetching quiz:', error);
            alert('Error loading quiz');
            navigate('/admin/quizManagement');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="admin-container-vq">
                <Header />
                <div className="loading-vq">Loading quiz details...</div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="admin-container-vq">
                <Header />
                <div className="error-vq">Quiz not found</div>
            </div>
        );
    }

    return (
        <div className="admin-container-vq">
            <Header />

            <div className="content-wrapper-vq">
                <button
                    className="back-button-vq"
                    onClick={() => navigate('/admin/quizManagement')}
                >
                    <ArrowLeft size={18} />
                    Back to Quiz Management
                </button>

                {/* Quiz Header */}
                <div className="quiz-header-vq">
                    <div className="quiz-title-section-vq">
                        <h1>{quiz.title}</h1>
                        <p className="quiz-description-vq">{quiz.description}</p>
                    </div>

                    <div className="quiz-badges-vq">
                        <span className={`badge-vq ${quiz.category.toLowerCase()}`}>
                            {quiz.category}
                        </span>
                        <span className={`badge-vq ${quiz.difficulty.toLowerCase()}`}>
                            {quiz.difficulty}
                        </span>
                    </div>

                    <div className="quiz-meta-vq">
                        <div className="meta-item-vq">
                            <Calendar size={16} />
                            <span>Created: {formatDate(quiz.createdAt)}</span>
                        </div>
                        <div className="meta-item-vq">
                            <Award size={16} />
                            <span>{quiz.questions?.length || 0} Questions</span>
                        </div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="questions-section-vq">
                    <h2>Questions</h2>
                    {quiz.questions && quiz.questions.length > 0 ? (
                        quiz.questions.map((question, index) => (
                            <div key={question.id} className="question-card-vq">
                                <div className="question-header-vq">
                                    <h3>Question {index + 1}</h3>
                                </div>

                                <p className="question-text-vq">{question.questionText}</p>

                                {question.imageUrl && (
                                    <div className="question-image-vq">
                                        <img
                                            src={`${API_BASE_URL}${question.imageUrl}`} 
                                            alt="Question"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    </div>
                                )}

                                <div className="options-list-vq">
                                    <div className={`option-vq ${question.correctAnswer === 'A' ? 'correct' : ''}`}>
                                        <span className="option-label-vq">A</span>
                                        <span>{question.optionA}</span>
                                    </div>
                                    <div className={`option-vq ${question.correctAnswer === 'B' ? 'correct' : ''}`}>
                                        <span className="option-label-vq">B</span>
                                        <span>{question.optionB}</span>
                                    </div>
                                    <div className={`option-vq ${question.correctAnswer === 'C' ? 'correct' : ''}`}>
                                        <span className="option-label-vq">C</span>
                                        <span>{question.optionC}</span>
                                    </div>
                                    <div className={`option-vq ${question.correctAnswer === 'D' ? 'correct' : ''}`}>
                                        <span className="option-label-vq">D</span>
                                        <span>{question.optionD}</span>
                                    </div>
                                </div>

                                <div className="correct-answer-vq">
                                    ✓ Correct Answer: {question.correctAnswer}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-questions-vq">No questions available</p>
                    )}
                </div>
            </div>
        </div>
    );
}
