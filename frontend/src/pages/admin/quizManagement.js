import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Users, BookOpen, FileText, Plus, Eye, Edit2, Trash2, TrendingUp } from 'lucide-react';
import Header from '../../components/header';
import '../css/admin/quizManagement.css';
import { API_BASE_URL } from '../../config/apiConfig';

export default function AdminQuizManagement() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const token = sessionStorage.getItem('userToken');
            if (!token) {
                alert('Please log in first');
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/quiz/admin/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                alert('Unauthorized: Admin access required');
                navigate('/login');
                return;
            }

            if (response.status === 403) {
                alert('Forbidden: Admin role required');
                navigate('/admin/overview');
                return;
            }

            const result = await response.json();

            if (result.success) {
                const transformedQuizzes = result.quizzes.map(quiz => ({
                    id: quiz.id,             
                    title: quiz.title,        
                    description: quiz.description, 
                    category: quiz.category,
                    difficulty: quiz.difficulty,
                    questions: quiz.questions,
                    createdAt: quiz.createdAt,
                    updatedAt: quiz.updatedAt
                }));
                setQuizzes(transformedQuizzes);
            } else {
                alert('Failed to fetch quizzes: ' + result.message);
            }
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            alert('Error fetching quizzes');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuiz = () => {
        navigate('/admin/quiz/create');
    };

    const handleViewQuiz = (quizId) => {
        navigate(`/admin/quiz/${quizId}`);
    };

    const handleEditQuiz = (quizId) => {
        navigate(`/admin/quiz/${quizId}/edit`);
    };

    const handleDeleteQuiz = async (quizId) => {
        if (!window.confirm('Are you sure you want to delete this quiz?')) return;

        try {
            const token = sessionStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/api/quiz/admin/${quizId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
                alert('Quiz deleted successfully');
            } else {
                alert('Failed to delete quiz: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting quiz:', error);
            alert('Failed to delete quiz');
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Identification': 'identification',
            'Disease': 'disease',
            'Anatomy': 'anatomy',
            'Ecology': 'ecology'
        };
        return colors[category] || 'identification';
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            'Easy': 'easy',
            'Medium': 'medium',
            'Hard': 'hard'
        };
        return colors[difficulty] || 'medium';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    return (
        <div className="admin-container-qm">
            <Header />

            <div className="content-wrapper-qm">
                {/* Tabs Navigation */}
                <div className="tabs-container-qm">
                    <button
                        className={`tab-button-qm ${location.pathname === '/admin/overview' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/overview')}
                    >
                        <BarChart3 size={20} />
                        Overview
                    </button>
                    <button
                        className={`tab-button-qm ${location.pathname === '/admin/users' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/users')}
                    >
                        <Users size={20} />
                        User Management
                    </button>
                    <button
                        className={`tab-button-qm ${location.pathname === '/admin/analysis' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/analysis')}
                    >
                        <TrendingUp size={20} />
                        Analytics
                    </button>
                    <button
                        className={`tab-button-qm ${location.pathname === '/admin/quizManagement' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/quizManagement')}
                    >
                        <BookOpen size={20} />
                        Quiz Management
                    </button>
                    <button
                        className={`tab-button-qm ${location.pathname === '/admin/materials' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/materials')}
                    >
                        <FileText size={20} />
                        Learning Materials
                    </button>
                </div>

                {/* Page Header */}
                <div className="page-header-qm">
                    <div>
                        <h1 className="page-title-qm">Quiz Management</h1>
                        <p className="page-subtitle-qm">Create and manage quizzes for your students</p>
                    </div>
                    <button className="create-quiz-btn-qm" onClick={handleCreateQuiz}>
                        <Plus size={20} />
                        Create New Quiz
                    </button>
                </div>

                {/* Quizzes Grid */}
                {loading ? (
                    <div className="loading-qm">Loading quizzes...</div>
                ) : (
                    <div className="quizzes-grid-qm">
                        {quizzes.length > 0 ? (
                            quizzes.map((quiz) => (
                                <div key={quiz.id} className="quiz-card-qm">
                                    <div className="quiz-header-qm">
                                        <h3 className="quiz-title-qm">{quiz.title}</h3>
                                        <div className="quiz-actions-qm">
                                            <button
                                                className="action-icon-btn-qm view"
                                                onClick={() => handleViewQuiz(quiz.id)}
                                                title="View Quiz"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                className="action-icon-btn-qm edit"
                                                onClick={() => handleEditQuiz(quiz.id)}
                                                title="Edit Quiz"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                className="action-icon-btn-qm delete"
                                                onClick={() => handleDeleteQuiz(quiz.id)}
                                                title="Delete Quiz"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="quiz-description-qm">{quiz.description}</p>

                                    <div className="quiz-badges-qm">
                                        <span className={`badge-qm category ${getCategoryColor(quiz.category)}`}>
                                            {quiz.category}
                                        </span>
                                        <span className={`badge-qm difficulty ${getDifficultyColor(quiz.difficulty)}`}>
                                            {quiz.difficulty}
                                        </span>
                                    </div>

                                    <div className="quiz-stats-qm">
                                        <div className="stat-group-qm">
                                            <div className="stat-item-qm">
                                                <span className="stat-label-qm">Questions</span>
                                                <span className="stat-value-qm">{quiz.questions}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="quiz-footer-qm">
                                        <span className="created-date-qm">
                                            Created on {formatDate(quiz.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-quizzes-qm">
                                <BookOpen size={48} />
                                <h3>No quizzes yet</h3>
                                <p>Create your first quiz to get started</p>
                                <button className="create-first-quiz-btn-qm" onClick={handleCreateQuiz}>
                                    <Plus size={20} />
                                    Create Quiz
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
