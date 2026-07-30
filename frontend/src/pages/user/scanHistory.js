import { useEffect, useState } from 'react';
import { ArrowLeft, Activity, Leaf, Microscope, Trash2  } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/apiConfig';
import Header from '../../components/header';
import Footer from '../../components/footer';
import Modal from '../../components/modal';
import '../css/user/scanHistory.css';

export default function ScanHistory() {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [scanToDelete, setScanToDelete] = useState(null);


    useEffect(() => {
        const fetchScans = async () => {
            const token = sessionStorage.getItem('userToken');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/scanresults`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await res.json();
                if (data.success) {
                    setScans(data.scans);
                }
            } catch (e) {
                console.error('Error fetching scan history:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchScans();
    }, []);

    // Helper function to get confidence level class
    const getConfidenceLevel = (confidence) => {
        const percentage = confidence * 100;
        if (percentage >= 80) return 'high';
        if (percentage >= 60) return 'medium';
        return 'low';
    };

    const handleConfirmDelete = async () => {
        if (!scanToDelete) return;

        try {
            const token = sessionStorage.getItem('userToken');
            const res = await fetch(`${API_BASE_URL}/api/scanresults/${scanToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                alert('Failed to delete scan');
                return;
            }

            // Remove from state
            setScans(prev => prev.filter(s => s.id !== scanToDelete.id));
            setScanToDelete(null);
            setShowDeleteModal(false);
        } catch (err) {
            console.error('Error deleting scan:', err);
            alert('Error deleting scan');
        }
    };


    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(utcDateString);

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;

        return `${Math.floor(diffDays / 365)}y ago`;
    };

    // Filter scans
    const filteredScans = scans.filter(scan =>
        filter === 'all' || scan.scanType === filter
    );

    // Calculate counts
    const plantCount = scans.filter(s => s.scanType === 'plant').length;
    const diseaseCount = scans.filter(s => s.scanType === 'disease').length;

    if (loading) {
        return (
            <div className="scan-history-page">
                <Header />
                <div className="scan-history-loading-container">
                    <div className="scan-history-loading-text">Loading scan history...</div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="scan-history-page">
            <Header />

            <div className="scan-history-content">
                {/* Top Actions */}
                <div className="scan-history-top-actions-row">
                    <button
                        className="scan-history-back-button"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="scan-history-page-title">Scan History</h1>
                </div>

                {/* Stats and Filters */}
                <div className="scan-history-header">
                    <div className="scan-history-stats">
                        <div className="scan-history-stat-card">
                            <Activity className="scan-history-stat-icon" />
                            <div className="scan-history-stat-info">
                                <span className="scan-history-stat-number">{scans.length}</span>
                                <span className="scan-history-stat-label">Total Scans</span>
                            </div>
                        </div>
                        <div className="scan-history-stat-card scan-history-stat-card-plants">
                            <Leaf className="scan-history-stat-icon" />
                            <div className="scan-history-stat-info">
                                <span className="scan-history-stat-number">{plantCount}</span>
                                <span className="scan-history-stat-label">Plants</span>
                            </div>
                        </div>
                        <div className="scan-history-stat-card scan-history-stat-card-diseases">
                            <Microscope className="scan-history-stat-icon" />
                            <div className="scan-history-stat-info">
                                <span className="scan-history-stat-number">{diseaseCount}</span>
                                <span className="scan-history-stat-label">Diseases</span>
                            </div>
                        </div>
                    </div>

                    <div className="scan-history-filter-tabs">
                        <button
                            className={`scan-history-filter-tab ${filter === 'all' ? 'scan-history-filter-tab-active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All ({scans.length})
                        </button>
                        <button
                            className={`scan-history-filter-tab ${filter === 'plant' ? 'scan-history-filter-tab-active' : ''}`}
                            onClick={() => setFilter('plant')}
                        >
                            Plants ({plantCount})
                        </button>
                        <button
                            className={`scan-history-filter-tab ${filter === 'disease' ? 'scan-history-filter-tab-active' : ''}`}
                            onClick={() => setFilter('disease')}
                        >
                            Diseases ({diseaseCount})
                        </button>
                    </div>
                </div>

                {/* Scans List */}
                <div className="scan-history-main-content">
                    {filteredScans.length === 0 ? (
                        <div className="scan-history-empty-state">
                            <div className="scan-history-empty-icon">📋</div>
                            <h3>No scans found</h3>
                            <p>
                                {filter === 'all'
                                    ? "You haven't made any scans yet. Start scanning to build your history!"
                                    : `No ${filter} scans yet.`
                                }
                            </p>
                            <div className="scan-history-empty-actions">
                                <Link to="/recognize" className="scan-history-btn-primary">
                                    <Activity size={18} />
                                    Scan Plant
                                </Link>
                                <Link to="/diseaseRecognition" className="scan-history-btn-second">
                                    <Activity size={18} />
                                    Scan Disease
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="scan-history-grid">
                            {filteredScans.map((scan, index) => {
                                const confidence = scan.confidence * 100;
                                const confidenceLevel = getConfidenceLevel(scan.confidence);

                                return (
                                    <Link
                                        key={scan.id}
                                        to={`/scan/${scan.id}`}
                                        className="scan-history-card-link"
                                    >
                                        <div
                                            className="scan-history-card"
                                            style={{ animationDelay: `${index * 0.05}s`, position: 'relative' }}
                                        >

                                            <button
                                                className="scan-history-delete-btn"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setScanToDelete(scan);
                                                    setShowDeleteModal(true);
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>


                                            {/* Image at top */}
                                            <div className="scan-history-card-image-wrapper">
                                                {scan.imageUrl ? (
                                                    <img
                                                        src={`${API_BASE_URL}${scan.imageUrl}`}
                                                        alt={scan.predictedName}
                                                        className="scan-history-card-image"
                                                        onError={(e) => {
                                                            e.target.src = `${API_BASE_URL}/images/default-placeholder.png`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="scan-history-card-no-image">
                                                        {scan.scanType === 'plant' ? '🌿' : '🔬'}
                                                    </div>
                                                )}

                                                <span
                                                    className={`scan-history-card-type-badge scan-history-card-type-badge-${scan.scanType} scan-history-card-type-badge-on-image`}
                                                >
                                                    {scan.scanType === 'plant' ? 'Plant' : 'Disease'}
                                                </span>
                                            </div>

                                            <div className="scan-history-card-content">
                                                <h3 className="scan-history-card-name">
                                                    {scan.predictedName}
                                                </h3>

                                                <div className="scan-history-card-confidence">
                                                    <span className="scan-history-confidence-label">
                                                        Accuracy Level
                                                    </span>
                                                    <div className="scan-history-confidence-bar-wrapper">
                                                        <div className="scan-history-confidence-bar-container">
                                                            <div
                                                                className={`scan-history-confidence-bar-fill scan-history-confidence-bar-fill-${confidenceLevel}`}
                                                                style={{ width: `${confidence}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className={`scan-history-confidence-percentage scan-history-confidence-percentage-${confidenceLevel}`}>
                                                            {confidence.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="scan-history-card-meta">
                                                    <div className="scan-history-card-timestamp">
                                                        <svg
                                                            className="scan-history-timestamp-icon"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        <span>{formatDate(scan.createdAt)}</span>
                                                    </div>
                                                </div>

                                            </div>

                                        </div>
                                    </Link>


                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setScanToDelete(null);
                }}
                title="Delete Scan History"
            >
                <p>Are you sure you want to delete this scan from your history?</p>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                        onClick={() => {
                            setShowDeleteModal(false);
                            setScanToDelete(null);
                        }}
                        className="scan-history-btn-cancel"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmDelete}
                        className="scan-history-btn-delete"
                        style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                    >
                        Delete
                    </button>
                </div>
            </Modal>

            <Footer />
        </div>
    );
}