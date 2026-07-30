import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Eye, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../css/user/diseaseDetails.css';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { API_BASE_URL } from '../../config/apiConfig';

export default function DiseaseDetailsPage() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [diseases, setDiseases] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
    try {
        setLoading(true);

        // Fetch diseases
        const response = await fetch(`${API_BASE_URL}/api/diseases`);
        const result = await response.json();

        if (result.success && result.diseases) {
            
            // ⭐ ADD: Process diseases to ensure proper image URLs
            const processedDiseases = result.diseases.map(disease => ({
                ...disease,
                // Construct full image URL if it's stored as relative path
                imageUrl: disease.imageUrl
                    ? disease.imageUrl.startsWith('http')
                        ? disease.imageUrl
                        : `${API_BASE_URL}${disease.imageUrl}`
                    : `${API_BASE_URL}/images/diseases/default-disease.jpg` // Fallback image
            }));

            setDiseases(processedDiseases);

            // Calculate categories from diseases data
            const categoryCounts = {};
            result.diseases.forEach(disease => {
                if (disease.category) {
                    categoryCounts[disease.category] = (categoryCounts[disease.category] || 0) + 1;
                }
            });

            const formattedCategories = [
                {
                    id: 'all',
                    label: 'All diseases',
                    count: result.diseases.length
                },
                ...Object.entries(categoryCounts).map(([category, count]) => ({
                    id: category.toLowerCase().replace(/\s+/g, '-'),
                    label: category,
                    count: count
                }))
            ];

            setCategories(formattedCategories);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        setLoading(false);
    }
};

    const handleViewDisease = (diseaseId) => {
        navigate(`/disease/${diseaseId}`);
    };

    const filteredDiseases = diseases.filter(disease => {
        // Convert disease category to same format as category ID (lowercase with dashes)
        const diseaseCategoryId = disease.category?.toLowerCase().replace(/\s+/g, '-');

        // Also support multiple categories separated by comma
        const diseaseCategoryIds = disease.category?.split(',').map(c =>
            c.trim().toLowerCase().replace(/\s+/g, '-')
        ) || [];

        const matchesCategory = activeCategory === 'all' ||
            diseaseCategoryId === activeCategory ||
            diseaseCategoryIds.includes(activeCategory);

        const matchesSearch =
            disease.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            disease.commonNames?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            disease.pathogenName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            disease.affectedPlants?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    const getSeverityClass = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'high': return 'severity-high';
            case 'medium': return 'severity-medium';
            case 'moderate': return 'severity-medium'; // handle both
            case 'low': return 'severity-low';
            default: return 'severity-default';
        }
    };

    if (loading) {
        return <div className="loading">Loading diseases...</div>;
    }

    return (
        <div className="page-container-dd">
            <Header />

            <div className="content-wrapper-dt">

                <div className="top-actions-row-dd">
                    <button className="back-button-dd" onClick={() => navigate("/")}>
                        <ArrowLeft size={24} />
                    </button>

                    <button
                        className="extra-material-button-dd"
                        onClick={() => navigate('/learning-materials')}
                    >
                        Extra Learning Material
                    </button>
                </div>

                

                {/* Header Section */}
                <div className="header-card">
                    <h1 className="page-title">Disease Detection & Classification</h1>
                    <p className="page-subtitle">Identify and learn about plant diseases</p>

                    <div className="search-container">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search diseases..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories Section */}
                <div className="categories-card">
                    <h2 className="categories-title">Categories</h2>
                    <div className="categories-list">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                className={`category-chip ${activeCategory === category.id ? 'active' : ''}`}
                                onClick={() => setActiveCategory(category.id)}
                            >
                                {category.label}
                                <span className="category-count">{category.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Diseases List Section */}
                <div className="diseases-card">
                    <h2 className="diseases-title">Diseases ({filteredDiseases.length})</h2>
                    <div className="diseases-list">
                        {filteredDiseases.map((disease) => (
                            <div
                                key={disease.id}
                                className="disease-item"
                                onClick={() => handleViewDisease(disease.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="disease-info">
                                    <div className="disease-image-container">
                                        <img src={disease.imageUrl} alt={disease.name} className="disease-image" />
                                        <div className={`severity-badge ${getSeverityClass(disease.severity)}`}>
                                            <AlertTriangle size={12} />
                                            {disease.severity}
                                        </div>
                                    </div>
                                    <div className="disease-details">
                                        <div className="disease-name">{disease.name}</div>
                                        <span className="disease-category">{disease.category}</span>
                                        <div className="disease-pathogen">{disease.pathogenName}</div>
                                        <div className="disease-affected">Affects: {disease.affectedPlants}</div>
                                        <div className="learn-more">Learn More »</div>
                                    </div>
                                </div>
                                <button
                                    className="view-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDisease(disease.id);
                                    }}
                                >
                                    <Eye size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}