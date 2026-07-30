import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Eye, ArrowLeft, Leaf, Sprout } from 'lucide-react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import Modal from '../../components/modal';
import { API_BASE_URL } from '../../config/apiConfig';
import '../css/user/bookmark.css';

const Bookmarks = () => {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingBookmark, setPendingBookmark] = useState(null);

    useEffect(() => {
        fetchBookmarks();
    }, []);

    const fetchBookmarks = async () => {
        try {
            const token = sessionStorage.getItem("userToken");

            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setBookmarks(result.bookmarks);
                }
            } else {
                console.error('Failed to fetch bookmarks');
            }
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeBookmark = async (bookmarkId, itemName) => {
        try {
            const token = sessionStorage.getItem("userToken");

            const bookmarkToRemove = bookmarks.find(b => b.id === bookmarkId);

            if (!bookmarkToRemove) return;

            const response = await fetch(`${API_BASE_URL}/api/bookmarks/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    itemType: bookmarkToRemove.itemType,
                    itemId: bookmarkToRemove.itemId
                })
            });

            const result = await response.json();

            if (result.success && !result.bookmarked) {
                setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
            }
        } catch (error) {
            console.error('Error removing bookmark:', error);
            alert('Error removing bookmark');
        }
    };

    const filteredBookmarks = bookmarks.filter(bookmark =>
        filter === 'all' || bookmark.itemType === filter
    );

    const plantCount = bookmarks.filter(b => b.itemType === 'plant').length;
    const diseaseCount = bookmarks.filter(b => b.itemType === 'disease').length;

    if (loading) {
        return (
            <div className="bookmarks-page-container">
                <Header />
                <div className="bookmarks-loading-container">
                    <div className="bookmarks-loading-text">Loading your bookmarks...</div>
                </div>
                <Footer />
            </div>
        );
    }

    const token = sessionStorage.getItem("userToken");
    if (!token) {
        return (
            <div className="bookmarks-page-container">
                <Header />
                <div className="bookmarks-auth-required-container">
                    <div className="bookmarks-auth-required">
                        <Bookmark size={48} className="bookmarks-auth-icon" />
                        <h2>Please Log In</h2>
                        <p>You need to be logged in to view your bookmarks.</p>
                        <Link to="/login" className="bookmarks-login-btn">Log In</Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="bookmarks-page-container">
            <Header />

            <div className="bookmarks-content-wrapper-pt">
                <div className="bookmarks-top-actions-row">
                    <button className="bookmarks-back-button" onClick={() => window.history.back()}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="bookmarks-page-title">My Bookmarks</h1>
                </div>

                {/* Stats and Filters */}
                <div className="bookmarks-header">
                    <div className="bookmarks-stats">
                        <div className="bookmarks-stat-card">
                            <Bookmark className="bookmarks-stat-icon" />
                            <div className="bookmarks-stat-info">
                                <span className="bookmarks-stat-number">{bookmarks.length}</span>
                                <span className="bookmarks-stat-label">Total Saved</span>
                            </div>
                        </div>
                        <div className="bookmarks-stat-card bookmarks-stat-card-plants">
                            <Sprout className="bookmarks-stat-icon" />
                            <div className="bookmarks-stat-info">
                                <span className="bookmarks-stat-number">{plantCount}</span>
                                <span className="bookmarks-stat-label">Plants</span>
                            </div>
                        </div>
                        <div className="bookmarks-stat-card bookmarks-stat-card-diseases">
                            <Leaf className="bookmarks-stat-icon" />
                            <div className="bookmarks-stat-info">
                                <span className="bookmarks-stat-number">{diseaseCount}</span>
                                <span className="bookmarks-stat-label">Diseases</span>
                            </div>
                        </div>
                    </div>

                    <div className="bookmarks-filter-tabs">
                        <button
                            className={`bookmarks-filter-tab ${filter === 'all' ? 'bookmarks-filter-tab-active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All ({bookmarks.length})
                        </button>
                        <button
                            className={`bookmarks-filter-tab ${filter === 'plant' ? 'bookmarks-filter-tab-active' : ''}`}
                            onClick={() => setFilter('plant')}
                        >
                            Plants ({plantCount})
                        </button>
                        <button
                            className={`bookmarks-filter-tab ${filter === 'disease' ? 'bookmarks-filter-tab-active' : ''}`}
                            onClick={() => setFilter('disease')}
                        >
                            Diseases ({diseaseCount})
                        </button>
                    </div>
                </div>

                {/* Bookmarks List */}
                <div className="bookmarks-main-content">
                    {filteredBookmarks.length === 0 ? (
                        <div className="bookmarks-empty-state">
                            <Bookmark size={64} className="bookmarks-empty-icon" />
                            <h3>No bookmarks found</h3>
                            <p>
                                {filter === 'all'
                                    ? "You haven't bookmarked any items yet. Start exploring to save your favorites!"
                                    : `No ${filter}s bookmarked yet.`
                                }
                            </p>
                            <div className="bookmarks-empty-actions">
                                <Link to="/plantDetails" className="bookmarks-btn-primary">
                                    <Sprout size={18} />
                                    Browse Plants
                                </Link>
                                <Link to="/diseaseDetails" className="bookmarks-btn-secondary">
                                    <Leaf size={18} />
                                    Browse Diseases
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="bookmarks-grid">
                            {filteredBookmarks.map(bookmark => (
                                <div key={bookmark.id} className="bookmarks-card">
                                    <div className="bookmarks-card-image">
                                        {bookmark.imageUrl ? (
                                            <img
                                                src={
                                                    bookmark.imageUrl
                                                        ? `${API_BASE_URL}${bookmark.imageUrl}`
                                                        : `${API_BASE_URL}/images/plants/default-plant.png`
                                                }
                                                alt={bookmark.name}
                                                onError={(e) => {
                                                    e.target.src = `${API_BASE_URL}/images/default-placeholder.png`;
                                                }}
                                            />

                                        ) : (
                                            <div className={`bookmarks-no-image ${bookmark.itemType === 'plant' ? 'bookmarks-no-image-plant' : 'bookmarks-no-image-disease'}`}>
                                                {bookmark.itemType === 'plant' ? '🌿' : '🦠'}
                                            </div>
                                        )}
                                        <span className={`bookmarks-item-type-badge ${bookmark.itemType === 'plant' ? 'bookmarks-item-type-badge-plant' : 'bookmarks-item-type-badge-disease'}`}>
                                            {bookmark.itemType}
                                        </span>
                                    </div>

                                    <div className="bookmarks-card-content">
                                        <h3 className="bookmarks-card-title">{bookmark.name}</h3>

                                        {bookmark.scientificName && (
                                            <p className="bookmarks-card-scientific">
                                                {bookmark.scientificName}
                                            </p>
                                        )}

                                        {bookmark.description && (
                                            <p className="bookmarks-card-description">
                                                {bookmark.description.length > 120
                                                    ? `${bookmark.description.substring(0, 120)}...`
                                                    : bookmark.description
                                                }
                                            </p>
                                        )}

                                        <div className="bookmarks-card-meta">
                                            <span className="bookmarks-card-date">
                                                Saved on {new Date(bookmark.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="bookmarks-card-actions">
                                            <Link
                                                to={`/${bookmark.itemType === 'plant' ? 'plant' : 'disease'}/${bookmark.itemId}`}
                                                className="bookmarks-view-btn"
                                            >
                                                <Eye size={16} />
                                                View Details
                                            </Link>

                                            <button
                                                className="bookmarks-remove-btn"
                                                onClick={() => {
                                                    setPendingBookmark(bookmark);   // store which one to remove
                                                    setConfirmOpen(true);           // open modal
                                                }}
                                                title="Remove bookmark"
                                            >
                                                <Bookmark size={16} fill="currentColor" />
                                                Remove
                                            </button>

                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={confirmOpen}
                onClose={() => {
                    setConfirmOpen(false);
                    setPendingBookmark(null);
                }}
                title="Remove bookmark?"
            >
                <div className="bm-modal-content">
                    <p className="bm-modal-text">
                        Are you sure you want to remove
                        {" "}
                        <strong className="bm-modal-highlight">{pendingBookmark?.name}</strong>
                        {" "}
                        from your bookmarks?
                    </p>
                    <div className="bm-modal-actions">
                        <button
                            onClick={() => {
                                setConfirmOpen(false);
                                setPendingBookmark(null);
                            }}
                            className="bm-btn-cancel"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (pendingBookmark) {
                                    removeBookmark(pendingBookmark.id, pendingBookmark.name);
                                }
                                setConfirmOpen(false);
                                setPendingBookmark(null);
                            }}
                            className="bm-btn-danger"
                        >
                            Yes, remove
                        </button>
                    </div>
                </div>
            </Modal>

            <Footer />
        </div>
    );
};

export default Bookmarks;