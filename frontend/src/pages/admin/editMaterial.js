import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Upload, X, FileText } from 'lucide-react';
import Header from '../../components/header';
import '../css/admin/createMaterial.css'; // Reuse create material styles
import { API_BASE_URL } from '../../config/apiConfig';

export default function EditMaterial() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [materialData, setMaterialData] = useState(null);

    const categories = ['Identification', 'Disease', 'Anatomy', 'Ecology'];
    const difficulties = ['Easy', 'Medium', 'Hard'];

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

            const result = await response.json();

            if (result.success) {
                setMaterialData({
                    title: result.material.title,
                    description: result.material.description,
                    content: result.material.content,
                    category: result.material.category,
                    difficulty: result.material.difficulty,
                    imageUrl: result.material.imageUrl || '',
                    imagePreview: null,
                    pdfUrl: result.material.pdfUrl || '',
                    pdfName: result.material.pdfUrl ? result.material.pdfUrl.split('/').pop() : ''
                });
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

    const handleMaterialChange = (field, value) => {
        setMaterialData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageSelect = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

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

        await uploadImageToServer(file);
    };

    const uploadImageToServer = async (file) => {
        setUploadingImage(true);
        try {
            const token = sessionStorage.getItem('userToken');
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/api/learningmaterial/upload-image`, {
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

    const handleRemoveImage = () => {
        setMaterialData(prev => ({
            ...prev,
            imageUrl: '',
            imagePreview: null
        }));
    };

    const handlePdfSelect = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please select a PDF file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('PDF size should be less than 10MB');
            return;
        }

        await uploadPdfToServer(file);
    };

    const uploadPdfToServer = async (file) => {
        setUploadingPdf(true);
        try {
            const token = sessionStorage.getItem('userToken');
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/api/learningmaterial/upload-pdf`, {
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
            setUploadingPdf(false);
        }
    };

    const handleRemovePdf = () => {
        setMaterialData(prev => ({
            ...prev,
            pdfUrl: '',
            pdfName: ''
        }));
    };

    const handleSubmit = async () => {
        if (!materialData.title.trim()) {
            alert('Please enter a material title');
            return;
        }

        if (!materialData.description.trim()) {
            alert('Please enter a material description');
            return;
        }

        if (!materialData.content.trim()) {
            alert('Please enter material content');
            return;
        }

        setSaving(true);
        try {
            const token = sessionStorage.getItem('userToken');

            const updateData = {
                title: materialData.title,
                description: materialData.description,
                content: materialData.content,
                category: materialData.category,
                difficulty: materialData.difficulty,
                status: materialData.status,
                imageUrl: materialData.imageUrl || '',
                pdfUrl: materialData.pdfUrl || ''
            };

            console.log('Sending update:', updateData);

            const response = await fetch(`${API_BASE_URL}/api/learningmaterial/admin/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            console.log('Response status:', response.status);

            const result = await response.json();
            console.log('Response result:', result);

            if (result.success) {
                alert('Material updated successfully!');
                navigate('/admin/materials');
            } else {
                alert('Failed to update material: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating material:', error);
            alert('Error updating material');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-container-cm">
                <Header />
                <div className="loading-cm">Loading material...</div>
            </div>
        );
    }

    if (!materialData) {
        return (
            <div className="admin-container-cm">
                <Header />
                <div className="error-cm">Material not found</div>
            </div>
        );
    }

    return (
        <div className="admin-container-cm">
            <Header />

            <div className="content-wrapper-cm">
                <button
                    className="back-button-cm"
                    onClick={() => navigate('/admin/materials')}
                >
                    <ArrowLeft size={18} />
                    Back to Learning Materials
                </button>

                <div className="page-header-cm">
                    <h1 className="page-title-cm">Edit Learning Material</h1>
                    <p className="page-subtitle-cm">Update material information and content</p>
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
                                rows="3"
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
                            rows="12"
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="media-upload-section-cm">
                        <label className="form-label-cm">Cover Image (Optional)</label>

                        {!materialData.imageUrl && !materialData.imagePreview ? (
                            <div className="upload-controls-cm">
                                <input
                                    type="file"
                                    id="image-upload-edit"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    style={{ display: 'none' }}
                                />
                                <label
                                    htmlFor="image-upload-edit"
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
                                    src={
                                        materialData.imagePreview
                                            ? materialData.imagePreview
                                            : (materialData.imageUrl.startsWith('http')
                                                ? materialData.imageUrl
                                                : `${API_BASE_URL}${materialData.imageUrl}`)
                                    }

                                    alt="Preview"
                                    className="preview-img-cm"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                                <div className="image-actions-cm" style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="file"
                                        id="image-change-edit"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <label
                                        htmlFor="image-change-edit"
                                        className="upload-btn-cm"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Upload size={16} />
                                        Change Image
                                    </label>
                                    <button
                                        type="button"
                                        className="remove-btn-cm"
                                        onClick={handleRemoveImage}
                                    >
                                        <X size={16} />
                                        Remove
                                    </button>
                                </div>
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
                                    id="pdf-upload-edit"
                                    accept="application/pdf"
                                    onChange={handlePdfSelect}
                                    style={{ display: 'none' }}
                                />
                                <label
                                    htmlFor="pdf-upload-edit"
                                    className="upload-btn-cm pdf"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <FileText size={16} />
                                    {uploadingPdf ? 'Uploading...' : 'Select PDF'}
                                </label>
                            </div>
                        ) : (
                            <div className="pdf-preview-cm">
                                <div className="pdf-info-cm">
                                    <FileText size={20} />
                                    <a
                                        href={
                                            materialData.pdfUrl.startsWith('http')
                                                ? materialData.pdfUrl
                                                : `${API_BASE_URL}${materialData.pdfUrl}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: 'underline', color: '#1a73e8', marginLeft: 8 }}
                                    >
                                        {materialData.pdfName}
                                    </a>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="file"
                                        id="pdf-change-edit"
                                        accept="application/pdf"
                                        onChange={handlePdfSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <label
                                        htmlFor="pdf-change-edit"
                                        className="upload-btn-cm pdf"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <FileText size={16} />
                                        Change PDF
                                    </label>
                                    <button
                                        type="button"
                                        className="remove-btn-cm"
                                        onClick={handleRemovePdf}
                                    >
                                        <X size={16} />
                                        Remove
                                    </button>
                                </div>
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
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="publish-btn-cm"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Update Material'}
                    </button>
                </div>
            </div>
        </div>
    );
}