import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, BookOpen, FileText } from 'lucide-react';
import Header from '../../components/header';
import '../css/admin/viewMaterial.css';
import { API_BASE_URL } from '../../config/apiConfig';

export default function ViewMaterial() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMaterialDetails();
    }, [id]);

    const fetchMaterialDetails = async () => {
        try {
            const token = sessionStorage.getItem('userToken');
            if (!token) {
                alert('Please log in first');
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/learningmaterial/admin/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch material');
            }

            const result = await response.json();

            if (result.success) {
                setMaterial(result.material);
            } else {
                alert('Failed to load material: ' + result.message);
                navigate('/admin/materials');
            }
        } catch (error) {
            console.error('Error fetching material:', error);
            alert('Error loading material');
            navigate('/admin/materials');
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
            <div className="admin-container-vm">
                <Header />
                <div className="loading-vm">Loading material details...</div>
            </div>
        );
    }

    if (!material) {
        return (
            <div className="admin-container-vm">
                <Header />
                <div className="error-vm">Material not found</div>
            </div>
        );
    }

    return (
        <div className="admin-container-vm">
            <Header />

            <div className="content-wrapper-vm">
                <button
                    className="back-button-vm"
                    onClick={() => navigate('/admin/materials')}
                >
                    <ArrowLeft size={18} />
                    Back to Learning Materials
                </button>

                {/* Material Header */}
                <div className="material-header-vm">
                    <div className="material-title-section-vm">
                        <h1>{material.title}</h1>
                        <p className="material-description-vm">{material.description}</p>
                    </div>

                    <div className="material-badges-vm">
                        <span className={`badge-vm ${material.category.toLowerCase()}`}>
                            {material.category}
                        </span>
                        <span className={`badge-vm ${material.difficulty.toLowerCase()}`}>
                            {material.difficulty}
                        </span>
                    </div>

                    <div className="material-meta-vm">
                        <div className="meta-item-vm">
                            <Calendar size={16} />
                            <span>Created: {formatDate(material.createdAt)}</span>
                        </div>
                        <div className="meta-item-vm">
                            <BookOpen size={16} />
                            <span>Learning Material</span>
                        </div>
                    </div>
                </div>

                {/* Cover Image */}
                {material.imageUrl && (
                    <div className="material-image-section-vm">
                        <h2>Cover Image</h2>
                        <div className="material-image-vm">
                            <img
                                src={
                                    material.imageUrl
                                        ? (material.imageUrl.startsWith('http') ? material.imageUrl : `${API_BASE_URL}${material.imageUrl}`)
                                        : undefined
                                }
                            />
                        </div>
                    </div>
                )}

                {/* Content Section */}
                <div className="content-section-vm">
                    <h2>Content</h2>
                    <div className="content-text-vm">
                        {material.content}
                    </div>
                </div>

                {/* PDF Section */}
                {material.pdfUrl && (
                    <div className="pdf-section-vm">
                        <h2>PDF Document</h2>
                        <div className="pdf-link-vm">
                            <FileText size={20} />
                            <a
                                href={material.pdfUrl.startsWith('http') ? material.pdfUrl : `${API_BASE_URL}${material.pdfUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View PDF Document
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}