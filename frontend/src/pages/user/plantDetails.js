import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../css/user/plantDetails.css';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { API_BASE_URL } from '../../config/apiConfig';

export default function PlantDetailsPage() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [plants, setPlants] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            setLoading(true);

            // Fetch plants
            const response = await fetch(`${API_BASE_URL}/api/plants`);
            const result = await response.json();

            if (result.success && result.plants) {
                
                const processedPlants = result.plants.map(plant => ({
                    ...plant,
                    // Construct full image URL if it's stored as relative path
                    imageUrl: plant.imageUrl
                        ? plant.imageUrl.startsWith('http')
                            ? plant.imageUrl
                            : `${API_BASE_URL}${plant.imageUrl}`
                            : `${API_BASE_URL}/images/plants/default-plant.jpg` // Fallback image
                }));

                setPlants(processedPlants);

                // Calculate categories from plants data
                const categoryCounts = {};
                result.plants.forEach(plant => {
                    if (plant.category) {
                        categoryCounts[plant.category] = (categoryCounts[plant.category] || 0) + 1;
                    }
                });

                // Ensure all counts are numbers
                const formattedCategories = [
                    {
                        id: 'all',
                        label: 'All plants',
                        count: result.plants.length
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

const filteredPlants = plants.filter(plant => {
    // Convert plant category to same format as category ID (lowercase with dashes)
    const plantCategoryId = plant.category?.toLowerCase().replace(/\s+/g, '-');
    
    // Also support multiple categories separated by comma
    const plantCategoryIds = plant.category?.split(',').map(c => 
        c.trim().toLowerCase().replace(/\s+/g, '-')
    ) || [];
    
    const matchesCategory = activeCategory === 'all' ||
        plantCategoryId === activeCategory ||
        plantCategoryIds.includes(activeCategory);
    
    const matchesSearch = 
        plant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.scientificName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
});

    if (loading) {
        return <div className="loading">Loading plants...</div>;
    }

    return (
        <div className="page-container">
            <Header />

            <div className="content-wrapper-pt">
                
                <div className="top-actions-row">
                    <button className="back-button" onClick={() => navigate('/')}>
                        <ArrowLeft size={24} />
                    </button>

                    <button
                        className="extra-material-button"
                        onClick={() => navigate('/learning-materials')}
                    >
                        Extra Learning Material
                    </button>
                </div>

                {/* Header Section */}
                <div className="header-card">
                    <h1 className="page-title">Plant Details & Classification</h1>
                    <p className="page-subtitle">Discover and learn about different plant species</p>

                    <div className="search-container">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search plants..."
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

                {/* Plants List Section */}
                <div className="plants-card">
                    <h2 className="plants-title">Plants ({filteredPlants.length})</h2>

                    <div className="plants-list">
                        {filteredPlants.map((plant) => (
                            <div key={plant.id} className="plant-item">
                                <div
                                    className="plant-info"
                                    onClick={() => navigate(`/plant/${plant.id}`)}
                                    style={{ cursor: 'pointer', flex: 1 }}
                                >
                                    <img
                                        src={plant.imageUrl}
                                        alt={plant.name}
                                        className="plant-image"
                                        onError={(e) => {
                                            e.target.src = `${API_BASE_URL}/images/plants/default-plant.png`;
                                        }}
                                    />
                                    <div className="plant-details">
                                        <div className="plant-name">{plant.name}</div>
                                        <span className="plant-category">{plant.category}</span>
                                        <div className="plant-scientific">{plant.scientificName}</div>
                                        <div className="learn-more">Learn More »</div>
                                    </div>
                                </div>
                                <button
                                    className="view-button"
                                    onClick={() => navigate(`/plant/${plant.id}`)}
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