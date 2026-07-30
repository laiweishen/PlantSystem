import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, BookOpen, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { API_BASE_URL } from '../../config/apiConfig';
import '../css/user/viewLearningMaterials.css';

export default function LearningMaterials() {
    const [materials, setMaterials] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadMaterials();
    }, []);

    const filteredMaterials = materials.filter(material => {
        const matchesSearch =
            material.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            material.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            material.category?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const loadMaterials = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/api/learningmaterial`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.materials) {
                const processedMaterials = result.materials.map(material => ({
                    ...material,
                    imageUrl: material.imageUrl
                        ? material.imageUrl.startsWith('http')
                            ? material.imageUrl
                            : `${API_BASE_URL}${material.imageUrl}`
                        : `${API_BASE_URL}/images/materials/default-material.jpg`
                }));
                setMaterials(processedMaterials);
            }
        } catch (error) {
            console.error('Error loading materials:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="lm-loading">Loading materials...</div>;
    }

    return (
        <div className="page-container">
            <Header />

            <div className="lm-content-wrapper-materials">
                <button className="lm-back-button" onClick={() => navigate('/')}>
                    <ArrowLeft size={24} />
                </button>

                {/* Header Card */}
                <div className="lm-materials-header-card">
                    <div className="lm-header-content">
                        <BookOpen className="lm-header-icon" size={32} />
                        <div>
                            <h1 className="lm-materials-title">Learning Materials</h1>
                            <p className="lm-materials-subtitle">
                                Expand your knowledge with our curated learning resources
                            </p>
                        </div>
                    </div>

                    <div className="lm-search-container">
                        <Search className="lm-search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search materials..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="lm-search-input"
                        />
                    </div>
                </div>

                {/* Materials Grid */}
                <div className="lm-materials-grid">
                    {filteredMaterials.map(material => (
                        <div
                            key={material.id}
                            className="lm-material-card"
                            onClick={() => navigate(`/learning-materials/${material.id}`)}
                        >
                            <div className="lm-material-image">
                                <img
                                    src={material.imageUrl}
                                    alt={material.title}
                                    onError={(e) => {
                                        e.target.src = `${API_BASE_URL}/images/materials/default-material.jpg`;
                                    }}
                                />
                            </div>
                            <div className="lm-material-content">
                                <div className="lm-material-tags">
                                    {material.category && (
                                        <span className="lm-tag lm-category-tag">{material.category}</span>
                                    )}
                                    {material.difficulty && (
                                        <span className={`lm-tag lm-difficulty-tag ${material.difficulty?.toLowerCase()}`}>
                                            {material.difficulty}
                                        </span>
                                    )}
                                </div>
                                <h3 className="lm-material-card-title">{material.title}</h3>
                                <p className="lm-material-description">{material.description}</p>
                                <div className="lm-read-more">Read More →</div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredMaterials.length === 0 && (
                    <div className="lm-no-materials">
                        <FileText size={48} />
                        <p>{searchQuery ? 'No materials match your search' : 'No materials found'}</p>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}