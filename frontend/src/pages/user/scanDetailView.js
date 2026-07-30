import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { API_BASE_URL } from '../../config/apiConfig';
import '../css/user/scanDetailView.css';

export default function ScanDetailView() {
    const { scanId } = useParams();
    const navigate = useNavigate();
    const [scan, setScan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScan = async () => {
            const token = sessionStorage.getItem('userToken');
            if (!token) {
                alert('Please log in to view scan details');
                navigate('/login');
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/scanresults/${scanId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    setScan(data.scan);
                } else {
                    console.error('Failed to load scan:', data.message);
                }
            } catch (err) {
                console.error('Error loading scan:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchScan();
    }, [scanId, navigate]);

    if (loading) {
        return <div className="scan-detail-loading">Loading scan...</div>;
    }

    if (!scan) {
        return <div className="scan-detail-error">Scan not found</div>;
    }

    const confidencePercent = (scan.confidence * 100).toFixed(2);
    const getConfidenceColor = (confidence) => {
        const percent = confidence * 100;
        if (percent >= 80) return '#10b981'; // Green
        if (percent >= 50) return '#f59e0b'; // Yellow/Orange
        return '#ef4444'; // Red
    };

    const isPlant = scan.scanType === 'plant';

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(utcDateString);

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const actualDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        if (diffMins < 1) return `${actualDate} - Just now`;
        if (diffMins < 60) return `${actualDate} - ${diffMins} min ago`;
        if (diffHours < 24) return `${actualDate} - ${diffHours} h ago`;
        if (diffDays < 7) return `${actualDate} - ${diffDays} d ago`;
        if (diffDays < 30) return `${actualDate} - ${Math.floor(diffDays / 7)} w ago`;
        if (diffDays < 365) return `${actualDate} - ${Math.floor(diffDays / 30)} mo ago`;

        return `${actualDate} - ${Math.floor(diffDays / 365)}y ago`;
    };



    return (
        <div className="scan-detail-page">
            <Header />

            <div className="scan-detail-container">
                <button className="scan-detail-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>

                <div className="scan-detail-hero">
                    {scan.imageUrl ? (
                        <img
                            src={`${API_BASE_URL}${scan.imageUrl}`}
                            alt={scan.predictedName}
                            className="scan-detail-hero-img"
                            onError={e => {
                                e.target.src = `${API_BASE_URL}/images/default-placeholder.png`;
                            }}
                        />
                    ) : (
                        <div className="scan-detail-hero-placeholder">
                            {isPlant ? '🌿' : '🔬'}
                        </div>
                    )}

                    <div className="scan-detail-hero-overlay">
                        <h1 className="scan-detail-title">{scan.predictedName}</h1>
                        <p className="scan-detail-subtitle">
                            {isPlant ? 'Plant recognition result' : 'Disease detection result'}
                        </p>
                    </div>
                </div>

                <div className="scan-detail-card">
                    <h2 className="scan-detail-card-title">Scan Information</h2>

                    <div className="scan-detail-row">
                        <span className="scan-detail-label">Predicted name</span>
                        <span className="scan-detail-value">{scan.predictedName}</span>
                    </div>

                    <div className="scan-detail-row">
                        <span className="scan-detail-label">Type</span>
                        <span className="scan-detail-value">
                            {isPlant ? 'Plant' : 'Disease'}
                        </span>
                    </div>

                    <div className="scan-detail-row">
                        <span className="scan-detail-label">Accuracy</span>
                        <span
                            className="scan-detail-value"
                            style={{ color: getConfidenceColor(scan.confidence) }}
                        >
                            {confidencePercent}%
                        </span>
                    </div>

                    <div className="scan-detail-row">
                        <span className="scan-detail-label">Scanned at</span>
                        <span className="scan-detail-value">
                            {formatDate(scan.createdAt)}
                        </span>
                    </div>
                </div>

                {/* Button to go to full plant/disease page if exists */}

                {scan.plantId && (
                    <div className="scan-detail-card">
                        <h2 className="scan-detail-card-title">Related record</h2>
                        <Link to={`/plant/${scan.plantId}`} className="scan-detail-link-btn">
                            View full plant details →
                        </Link>
                    </div>
                )}


                {scan.diseaseId && (
                    <div className="scan-detail-card">
                        <h2 className="scan-detail-card-title">Related record</h2>
                        <Link to={`/disease/${scan.diseaseId}`} className="scan-detail-link-btn">
                            View full disease details →
                        </Link>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
