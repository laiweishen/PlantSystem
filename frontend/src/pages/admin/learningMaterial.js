import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Users, BookOpen, FileText, Plus, Eye, Edit2, Trash2, TrendingUp } from 'lucide-react';
import Header from '../../components/header';
import '../css/admin/learningMaterial.css';
import { API_BASE_URL } from '../../config/apiConfig';

export default function AdminLearningMaterial() {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const token = sessionStorage.getItem('userToken');
            if (!token) {
                alert('Please log in first');
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/learningmaterial/admin/all`, {
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
                setMaterials(result.materials);
            } else {
                alert('Failed to fetch learning materials: ' + result.message);
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
            alert('Error fetching learning materials');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMaterial = () => {
        navigate('/admin/materials/create');
    };

    const handleViewMaterial = (materialId) => {
        navigate(`/admin/materials/${materialId}`);
    };

    const handleEditMaterial = (materialId) => {
        navigate(`/admin/materials/${materialId}/edit`);
    };

    const handleDeleteMaterial = async (materialId) => {
        if (!window.confirm('Are you sure you want to delete this learning material?')) return;

        try {
            const token = sessionStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/api/learningmaterial/admin/${materialId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                setMaterials(materials.filter(material => material.id !== materialId));
                alert('Learning material deleted successfully');
            } else {
                alert('Failed to delete learning material: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting material:', error);
            alert('Failed to delete learning material');
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
        <div className="admin-container-lm">
            <Header />

            <div className="content-wrapper-lm">
                {/* Tabs Navigation */}
                <div className="tabs-container-lm">
                    <button
                        className={`tab-button-lm ${location.pathname === '/admin/overview' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/overview')}
                    >
                        <BarChart3 size={20} />
                        Overview
                    </button>
                    <button
                        className={`tab-button-lm ${location.pathname === '/admin/users' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/users')}
                    >
                        <Users size={20} />
                        User Management
                    </button>
                    <button
                        className={`tab-button-lm ${location.pathname === '/admin/analysis' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/analysis')}
                    >
                        <TrendingUp size={20} />
                        Analytics
                    </button>
                    <button
                        className={`tab-button-lm ${location.pathname === '/admin/quizManagement' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/quizManagement')}
                    >
                        <BookOpen size={20} />
                        Quiz Management
                    </button>
                    <button
                        className={`tab-button-lm ${location.pathname === '/admin/materials' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/materials')}
                    >
                        <FileText size={20} />
                        Learning Materials
                    </button>
                </div>

                {/* Page Header */}
                <div className="page-header-lm">
                    <div>
                        <h1 className="page-title-lm">Learning Material Management</h1>
                        <p className="page-subtitle-lm">Create and manage learning materials for your students</p>
                    </div>
                    <button className="create-material-btn-lm" onClick={handleCreateMaterial}>
                        <Plus size={20} />
                        Create New Learning
                    </button>
                </div>

                {/* Materials Grid */}
                {loading ? (
                    <div className="loading-lm">Loading learning materials...</div>
                ) : (
                    <div className="materials-grid-lm">
                        {materials.length > 0 ? (
                            materials.map((material) => (
                                <div key={material.id} className="material-card-lm">
                                    <div className="material-header-lm">
                                        <h3 className="material-title-lm">{material.title}</h3>
                                        <div className="material-actions-lm">
                                            <button
                                                className="action-icon-btn-lm view"
                                                onClick={() => handleViewMaterial(material.id)}
                                                title="View Material"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                className="action-icon-btn-lm edit"
                                                onClick={() => handleEditMaterial(material.id)}
                                                title="Edit Material"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                className="action-icon-btn-lm delete"
                                                onClick={() => handleDeleteMaterial(material.id)}
                                                title="Delete Material"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="material-badges-lm">
                                        <span className={`badge-lm category ${getCategoryColor(material.category)}`}>
                                            {material.category}
                                        </span>
                                        <span className={`badge-lm difficulty ${getDifficultyColor(material.difficulty)}`}>
                                            {material.difficulty}
                                        </span>
                                    </div>

                                    <div className="material-badges-lm">
                                        <span className= "badge-lm category">
                                            {material.description}
                                        </span>
                                    </div>

                                    <div className="material-footer-lm">
                                        <span className="created-date-lm">
                                            Created on {formatDate(material.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-materials-lm">
                                <FileText size={48} />
                                <h3>No learning materials yet</h3>
                                <p>Create your first learning material to get started</p>
                                <button className="create-first-material-btn-lm" onClick={handleCreateMaterial}>
                                    <Plus size={20} />
                                    Create Learning Material
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}