import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, X, FileText } from 'lucide-react';
import Header from '../../components/header';
import '../css/admin/createMaterial.css';
import { API_BASE_URL } from '../../config/apiConfig';

export default function CreateMaterial() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [materialData, setMaterialData] = useState({
        title: '',
        description: '',
        content: '',
        category: 'Identification',
        difficulty: 'Easy',
        imageUrl: '',
        imagePreview: null,
        pdfUrl: '',
        pdfName: ''
    });

    const categories = ['Identification', 'Disease', 'Anatomy', 'Ecology'];
    const difficulties = ['Easy', 'Medium', 'Hard'];


    // Update material data
    const handleMaterialChange = (field, value) => {
        setMaterialData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Validate form
    const validateForm = () => {
        if (!materialData.title.trim()) {
            alert('Please enter a material title');
            return false;
        }

        if (!materialData.description.trim()) {
            alert('Please enter a material description');
            return false;
        }

        if (!materialData.content.trim()) {
            alert('Please enter material content');
            return false;
        }

        return true;
    };

    // Handle image selection
    const handleImageSelect = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setMaterialData(prev => ({
                ...prev,
                imagePreview: e.target.result
            }));
        };
        reader.readAsDataURL(file);

        // Upload to server
        await uploadImageToServer(file);
    };

    // Upload image to server
    const uploadImageToServer = async (file) => {
        setUploadingImage(true);
        try {
            const token = sessionStorage.getItem('userToken');
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/api/materials/upload-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                setMaterialData(prev => ({
                    ...prev,
                    imageUrl: result.imageUrl
                }));
            } else {
                alert('Failed to upload image: ' + result.message);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image');
        } finally {
            setUploadingImage(false);
        }
    };

    // Remove image
    const handleRemoveImage = () => {
        setMaterialData(prev => ({
            ...prev,
            imageUrl: '',
            imagePreview: null
        }));
    };

    // Handle PDF selection
    const handlePdfSelect = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf') {
            alert('Please select a PDF file');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            alert('PDF size should be less than 10MB');
            return;
        }

        // Upload to server
        await uploadPdfToServer(file);
    };

    // Upload PDF to server
    const uploadPdfToServer = async (file) => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('userToken');
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/api/materials/upload-pdf`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                setMaterialData(prev => ({
                    ...prev,
                    pdfUrl: result.pdfUrl,
                    pdfName: file.name
                }));
            } else {
                alert('Failed to upload PDF: ' + result.message);
            }
        } catch (error) {
            console.error('Error uploading PDF:', error);
            alert('Error uploading PDF');
        } finally {
            setLoading(false);
        }
    };

    // Remove PDF
    const handleRemovePdf = () => {
        setMaterialData(prev => ({
            ...prev,
            pdfUrl: '',
            pdfName: ''
        }));
    };

    // Submit material
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const token = sessionStorage.getItem('userToken');
            if (!token) {
                alert('Please log in first');
                navigate('/login');
                return;
            }

            const submitData = {
                title: materialData.title,
                description: materialData.description,
                content: materialData.content,
                category: materialData.category,
                difficulty: materialData.difficulty,
                imageUrl: materialData.imageUrl,
                pdfUrl: materialData.pdfUrl
            };


            const response = await fetch(`${API_BASE_URL}/api/materials/admin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Learning material created successfully!');
                navigate('/admin/materials');
            } else {
                alert('Failed to create material: ' + result.message);
            }
        } catch (error) {
            console.error('Error creating material:', error);
            alert('Error creating material');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container-cm">
            <Header />

            <div className="content-wrapper-cm">
                {/* Back Button */}
                <button
                    className="back-button-cm"
                    onClick={() => navigate('/admin/materials')}
                >
                    <ArrowLeft size={18} />
                    Back to Learning Materials
                </button>

                {/* Page Header */}
                <div className="page-header-cm">
                    <h1 className="page-title-cm">Create New Learning Material</h1>
                    <p className="page-subtitle-cm">Design educational content for your students</p>
                </div>

                {/* Material Basic Info */}
                <div className="material-basic-info-cm">
                    <h2 className="section-title-cm">Material Information</h2>
                    <div className="form-grid-cm">
                        <div className="form-group-cm full-width">
                            <label className="form-label-cm">
                                Title <span className="required-star-cm">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-input-cm"
                                value={materialData.title}
                                onChange={(e) => handleMaterialChange('title', e.target.value)}
                                placeholder="Enter material title"
                                required
                            />
                        </div>

                        <div className="form-group-cm full-width">
                            <label className="form-label-cm">
                                Description <span className="required-star-cm">*</span>
                            </label>
                            <textarea
                                className="form-textarea-cm"
                                value={materialData.description}
                                onChange={(e) => handleMaterialChange('description', e.target.value)}
                                placeholder="Enter material description"
                                rows="3"
                                required
                            />
                        </div>

                        <div className="form-group-cm">
                            <label className="form-label-cm">Category</label>
                            <select
                                className="form-select-cm"
                                value={materialData.category}
                                onChange={(e) => handleMaterialChange('category', e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group-cm">
                            <label className="form-label-cm">Difficulty</label>
                            <select
                                className="form-select-cm"
                                value={materialData.difficulty}
                                onChange={(e) => handleMaterialChange('difficulty', e.target.value)}
                            >
                                {difficulties.map(diff => (
                                    <option key={diff} value={diff}>{diff}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                </div>

                {/* Content Section */}
                <div className="content-section-cm">
                    <h2 className="section-title-cm">Content</h2>
                    
                    <div className="form-group-cm">
                        <label className="form-label-cm">
                            Material Content <span className="required-star-cm">*</span>
                        </label>
                        <textarea
                            className="form-textarea-cm large"
                            value={materialData.content}
                            onChange={(e) => handleMaterialChange('content', e.target.value)}
                            placeholder="Enter the learning material content here..."
                            rows="12"
                            required
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="media-upload-section-cm">
                        <label className="form-label-cm">Cover Image (Optional)</label>
                        
                        {!materialData.imagePreview ? (
                            <div className="upload-controls-cm">
                                <input
                                    type="file"
                                    id="image-upload-cm"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    style={{ display: 'none' }}
                                />
                                <label 
                                    htmlFor="image-upload-cm"
                                    className="upload-btn-cm"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Upload size={16} />
                                    {uploadingImage ? 'Uploading...' : 'Select Image'}
                                </label>
                            </div>
                        ) : (
                            <div className="preview-container-cm">
                                <img 
                                    src={materialData.imagePreview} 
                                    alt="Preview" 
                                    className="preview-img-cm"
                                />
                                <button
                                    type="button"
                                    className="remove-btn-cm"
                                    onClick={handleRemoveImage}
                                >
                                    <X size={16} />
                                    Remove Image
                                </button>
                            </div>
                        )}
                    </div>

                    {/* PDF Upload */}
                    <div className="media-upload-section-cm">
                        <label className="form-label-cm">PDF Document (Optional)</label>
                        
                        {!materialData.pdfName ? (
                            <div className="upload-controls-cm">
                                <input
                                    type="file"
                                    id="pdf-upload-cm"
                                    accept="application/pdf"
                                    onChange={handlePdfSelect}
                                    style={{ display: 'none' }}
                                />
                                <label 
                                    htmlFor="pdf-upload-cm"
                                    className="upload-btn-cm pdf"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <FileText size={16} />
                                    {loading ? 'Uploading...' : 'Select PDF'}
                                </label>
                            </div>
                        ) : (
                            <div className="pdf-preview-cm">
                                <div className="pdf-info-cm">
                                    <FileText size={20} />
                                    <span>{materialData.pdfName}</span>
                                </div>
                                <button
                                    type="button"
                                    className="remove-btn-cm"
                                    onClick={handleRemovePdf}
                                >
                                    <X size={16} />
                                    Remove PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons-cm">
                    
                    <button
                        type="button"
                        className="cancel-btn-cm"
                        onClick={() => navigate('/admin/materials')}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="publish-btn-cm"
                        onClick={() => handleSubmit(false)}
                        disabled={loading}
                    >
                        <Save size={18} />
                        {loading ? 'Creating...' : 'Create Material'}
                    </button>
                </div>
            </div>
        </div>
    );
}