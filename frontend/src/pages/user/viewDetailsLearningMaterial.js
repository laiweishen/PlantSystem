import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { API_BASE_URL } from '../../config/apiConfig';
import '../css/user/viewDetailsLearningMaterial.css';

export default function LearningMaterialDetail() {
    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        loadMaterial();
    }, [id]);

    const loadMaterial = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/api/learningmaterial/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();
            console.log('Material API result:', result);

            if (result.success && result.material) {
                const processedMaterial = {
                    ...result.material,
                    imageUrl: result.material.imageUrl
                        ? result.material.imageUrl.startsWith('http')
                            ? result.material.imageUrl
                            : `${API_BASE_URL}${result.material.imageUrl}`
                        : null,
                    pdfUrl: result.material.pdfUrl || null
                };
                setMaterial(processedMaterial);
            }
        } catch (error) {
            console.error('Error loading material:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="lmd-loading">Loading material...</div>;
    }

    if (!material) {
        return (
            <div className="page-container">
                <Header />
                <div className="lmd-not-found">
                    <p>Material not found</p>
                    <button onClick={() => navigate('/learning-materials')} className="lmd-btn-primary">
                        Back to Materials
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="page-container">
            <Header />

            <div className="lmd-content-wrapper-detail">
                <button className="lmd-back-button" onClick={() => navigate('/learning-materials')}>
                    <ArrowLeft size={24} />
                </button>

                <div className="lmd-detail-card">
                    {material.imageUrl && (
                        <div className="lmd-detail-image">
                            <img src={material.imageUrl} alt={material.title} />
                        </div>
                    )}

                    <div className="lmd-detail-content">
                        <div className="lmd-detail-tags">
                            {material.category && (
                                <span className="lmd-tag lmd-category-tag">{material.category}</span>
                            )}
                            {material.difficulty && (
                                <span className={`lmd-tag lmd-difficulty-tag ${material.difficulty?.toLowerCase()}`}>
                                    {material.difficulty}
                                </span>
                            )}
                        </div>

                        <h1 className="lmd-detail-title">{material.title}</h1>

                        {material.description && (
                            <p className="lmd-detail-description">{material.description}</p>
                        )}

                        {material.pdfUrl && (
                            <a
                                href={material.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="lmd-pdf-button"
                            >
                                <Download size={20} />
                                View PDF
                            </a>
                        )}

                        {material.content && (
                            <div className="lmd-detail-main-content">
                                {material.content}
                            </div>
                        )}

                        {material.createdAt && (
                            <div className="lmd-detail-footer">
                                Published: {new Date(material.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}