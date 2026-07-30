import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Mail, User, Edit2, LogOut } from 'lucide-react';
import "../css/user/profilePage.css";
import Header from '../../components/header';
import Footer from '../../components/footer';
import { API_BASE_URL } from '../../config/apiConfig';

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);

    useEffect(() => {
        fetchProfileData();
    }, [navigate]);

    const fetchProfileData = async () => {
        try {
            const token = sessionStorage.getItem('userToken');

            if (!token) {
                navigate('/login', { replace: true });
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('📥 Profile data:', result);

                if (result.success && result.user) {
                    // ⭐ Only camelCase
                    const userName = result.user.name || 'User';
                    const userEmail = result.user.email || '';
                    const userRole = result.user.role || 'Student';
                    const userBio = result.user.bio || 'Plant enthusiast and nature lover.';
                    const userImageUrl = result.user.imageUrl || null;

                    const username = userEmail ? `@${userEmail.split('@')[0]}` : '@user';

                    setProfileData({
                        name: userName,
                        email: userEmail,
                        role: userRole,
                        imageUrl: userImageUrl,
                        username: username,
                        bio: userBio
                    });

                    const updatedUser = {
                        id: result.user.id,
                        name: userName,
                        email: userEmail,
                        role: userRole,
                        imageUrl: userImageUrl,
                        bio: userBio
                    };
                    sessionStorage.setItem('user', JSON.stringify(updatedUser));
                    window.dispatchEvent(new Event('profileUpdated'));
                }
            } else if (response.status === 401) {
                navigate('/login', { replace: true });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            setSelectedImage(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const getInitials = (name) => { 
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase();
        } else {
            return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
        }
    };

    const handleSave = async () => {
        try {
            const token = sessionStorage.getItem('userToken');

            if (!token) {
                alert('No authentication token found. Please log in again.');
                navigate('/login');
                return;
            }

            const formData = new FormData();
            formData.append('Name', profileData.name);
            formData.append('Bio', profileData.bio || '');

            if (selectedImage) {
                formData.append('ProfileImage', selectedImage);
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();
            console.log('📥 Update response:', result);

            if (response.ok && result.success) {
                const userName = result.user.name || profileData.name;
                const userEmail = result.user.email || profileData.email;
                const userRole = result.user.role || profileData.role;
                const userBio = result.user.bio || profileData.bio;
                const userImageUrl = result.user.imageUrl || profileData.imageUrl;

                const updatedUser = {
                    id: result.user.id,
                    name: userName,
                    email: userEmail,
                    role: userRole,
                    bio: userBio,
                    imageUrl: userImageUrl
                };
                sessionStorage.setItem('user', JSON.stringify(updatedUser));

                const username = userEmail ? `@${userEmail.split('@')[0]}` : '@user';

                setProfileData({
                    name: userName,
                    email: userEmail,
                    role: userRole,
                    imageUrl: userImageUrl,
                    username: username,
                    bio: userBio
                });

                setIsEditing(false);
                setShowSaveConfirm(false);
                setSelectedImage(null);
                setImagePreview(null);

                window.dispatchEvent(new Event('profileUpdated'));
                alert('Profile updated successfully!');
            } else {
                alert(`Failed to update profile: ${result.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('💥 Update failed:', error);
            alert('Error updating profile: ' + error.message);
        }
    };

    

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSaveClick = () => {
        setShowSaveConfirm(true);
    };

    const confirmSave = () => {
        handleSave();
    };

    const cancelSave = () => {
        setShowSaveConfirm(false);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('userToken');
        sessionStorage.removeItem('user');
        navigate('/login', { replace: true });
    };

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setSelectedImage(null);
        setImagePreview(null);
        fetchProfileData(); // ⭐ Reload from backend
    };

    if (loading) {
        return (
            <div className="page-container">
                <Header />
                <div className="loading">Loading profile...</div>
                <Footer />
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="page-container">
                <Header />
                <div className="loading">Unable to load profile</div>
                <Footer />
            </div>
        );
    }

    const currentImage = imagePreview || profileData.imageUrl;

    return (
        <div className="page-container">
            {/* Save Confirmation Popup */}
            {showSaveConfirm && (
                <div className="logout-confirm-overlay">
                    <div className="logout-confirm-popup">
                        <div className="logout-confirm-icon">💾</div>
                        <h3 className="logout-confirm-title">Save Changes</h3>
                        <p className="logout-confirm-message">Are you sure you want to save these changes?</p>
                        <div className="logout-confirm-buttons">
                            <button className="logout-confirm-cancel" onClick={cancelSave}>
                                Cancel
                            </button>
                            <button className="logout-confirm-logout" onClick={confirmSave}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Popup */}
            {showLogoutConfirm && (
                <div className="logout-confirm-overlay">
                    <div className="logout-confirm-popup">
                        <div className="logout-confirm-icon">⚠️</div>
                        <h3 className="logout-confirm-title">Confirm Logout</h3>
                        <p className="logout-confirm-message">Are you sure you want to log out?</p>
                        <div className="logout-confirm-buttons">
                            <button className="logout-confirm-cancel" onClick={cancelLogout}>
                                Cancel
                            </button>
                            <button className="logout-confirm-logout" onClick={handleLogout}>
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Header />
            <div className="content-wrapper-pf">
                <button className="back-button-profile" onClick={() => window.history.back()}>
                    <ArrowLeft size={24} />
                </button>

                <div className="profile-card">
                    {/* Profile Header */}
                    <div className="profile-header">
                        <div className="avatar-container">
                            <input
                                type="file"
                                id="profile-image-input"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />

                            <div
                                className="avatar"
                                onClick={() => currentImage && setShowImageModal(true)}
                                style={{ cursor: currentImage ? 'pointer' : 'default' }}
                            >
                                {currentImage ? (
                                    <img
                                        src={currentImage}
                                        className="avatar-image"
                                    />
                                ) : (
                                    <span className="avatar-initials">
                                        {getInitials(profileData.name || 'Profile')}
                                    </span>
                                )}
                            </div>

                            {isEditing && (
                                <button
                                    className="avatar-edit"
                                    onClick={() => document.getElementById('profile-image-input').click()}
                                    type="button"
                                >
                                    <Camera size={16} />
                                </button>
                            )}
                        </div>

                        {!isEditing && (
                            <>
                                <h1 className="profile-name">{profileData.name}</h1>
                                <p className="profile-role">{profileData.role}</p>
                                <button className="edit-profile-btn" onClick={handleEditClick}>
                                    <Edit2 size={18} />
                                    Edit Profile
                                </button>
                            </>
                        )}
                    </div>

                    {/* Personal Information */}
                    <div className="profile-section">
                        <h2 className="section-title">Personal Information</h2>

                        <div className="info-group">
                            <div className="info-label">
                                <User size={16} />
                                Name
                            </div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="info-input"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                />
                            ) : (
                                <div className="info-value">{profileData.name}</div>
                            )}
                        </div>

                        {/* ⭐ Username is read-only (generated from email) */}
                        <div className="info-group">
                            <div className="info-label">
                                <User size={16} />
                                Username
                            </div>
                            <div className="info-value">{profileData.username}</div>
                        </div>

                        <div className="info-group">
                            <div className="info-label">
                                <Mail size={16} />
                                Email
                            </div>
                            <div className="info-value">{profileData.email}</div>
                        </div>

                    </div>

                    {/* Bio Section */}
                    <div className="profile-section">
                        <h2 className="section-title">About</h2>
                        <div className="info-group">
                            {isEditing ? (
                                <textarea
                                    className="bio-textarea"
                                    value={profileData.bio}
                                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                    placeholder="Tell us about yourself..."
                                    rows="4"
                                />
                            ) : (
                                <div className="info-value">{profileData.bio}</div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {isEditing ? (
                        <div className="actions-section">
                            <button className="save-btn" onClick={handleSaveClick}>
                                Save Changes
                            </button>
                            <button className="cancel-btn" onClick={handleCancelEdit}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button className="logout-btn" onClick={handleLogoutClick}>
                            <LogOut size={20} />
                            Logout
                        </button>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            {showImageModal && currentImage && (
                <div className="image-modal-overlay" onClick={() => setShowImageModal(false)}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="image-modal-close" onClick={() => setShowImageModal(false)}>
                            ✕
                        </button>
                        <img src={currentImage} alt="Profile Preview" className="image-modal-img" />
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
