import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Upload, X } from 'lucide-react';
import Header from '../../components/header';
import '../css/admin/createQuiz.css'; // Reuse create quiz styles
import { API_BASE_URL } from '../../config/apiConfig';

export default function EditQuiz() {
    const { id } = useParams(); // ⭐ Get quiz ID from URL
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const categories = ['Plants', 'Disease', 'Mixed'];
    const difficulties = ['Easy', 'Medium', 'Hard'];

    useEffect(() => {
        fetchQuizDetails();
    }, [id]);

    const fetchQuizDetails = async () => {
        try {
            const token = sessionStorage.getItem('userToken');
            if (!token) {
                alert('Please log in first');
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/quiz/admin/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                // Transform backend data to match form structure
                setQuizData({
                    title: result.quiz.title,
                    description: result.quiz.description,
                    category: result.quiz.category,
                    difficulty: result.quiz.difficulty,
                    questions: result.quiz.questions.map(q => ({
                        id: q.id,
                        questionText: q.questionText,
                        imageUrl: q.imageUrl || '',
                        optionA: q.optionA,
                        optionB: q.optionB,
                        optionC: q.optionC,
                        optionD: q.optionD,
                        correctAnswer: q.correctAnswer,
                        orderIndex: q.orderIndex
                    }))
                });
            } else {
                alert('Failed to load quiz: ' + result.message);
                navigate('/admin/quizManagement');
            }
        } catch (error) {
            console.error('Error fetching quiz:', error);
            alert('Error loading quiz');
            navigate('/admin/quizManagement');
        } finally {
            setLoading(false);
        }
    };

    const handleQuizChange = (field, value) => {
        setQuizData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleQuestionChange = (index, field, value) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.map((question, i) =>
                i === index ? { ...question, [field]: value } : question
            )
        }));
    };

    const handleSubmit = async () => {

        if (!quizData.title.trim()) {
            alert('Please enter a quiz title');
            return;
        }

        setSaving(true);
        try {
            const token = sessionStorage.getItem('userToken');

            const updateData = {
                title: quizData.title,
                description: quizData.description,
                category: quizData.category,
                difficulty: quizData.difficulty,
                questions: quizData.questions.map(q => ({
                    questionText: q.questionText,
                    imageUrl: q.imageUrl || '',
                    optionA: q.optionA,
                    optionB: q.optionB,
                    optionC: q.optionC,
                    optionD: q.optionD,
                    correctAnswer: q.correctAnswer
                }))
            };

            console.log('Sending update:', updateData);

            const response = await fetch(`${API_BASE_URL}/api/quiz/admin/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();
            console.log('Response result:', result);

            if (result.success) {
                alert('Quiz updated successfully!');
                navigate('/admin/quizManagement');
            } else {
                alert('Failed to update quiz: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating quiz:', error);
            alert('Error updating quiz');

        } finally {
            setSaving(false);
        }
    };

    const handleImageSelect = async (questionIndex, event) => {
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
            setQuizData(prev => ({
                ...prev,
                questions: prev.questions.map((q, i) =>
                    i === questionIndex
                        ? { ...q, imagePreview: e.target.result }
                        : q
                )
            }));
        };
        reader.readAsDataURL(file);

        await uploadImageToServer(questionIndex, file);
    };

    const uploadImageToServer = async (questionIndex, file) => {
        setUploadingImage(true);
        try {
            const token = sessionStorage.getItem('userToken');
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/api/quiz/upload-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                setQuizData(prev => ({
                    ...prev,
                    questions: prev.questions.map((q, i) =>
                        i === questionIndex
                            ? { ...q, imageUrl: result.imageUrl }
                            : q
                    )
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

    const handleRemoveImage = (questionIndex) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === questionIndex
                    ? { ...q, imageUrl: '', imagePreview: null }
                    : q
            )
        }));
    };

    if (loading) {
        return (
            <div className="admin-container-cq">
                <Header />
                <div className="loading-cq">Loading quiz...</div>
            </div>
        );
    }

    if (!quizData) {
        return (
            <div className="admin-container-cq">
                <Header />
                <div className="error-cq">Quiz not found</div>
            </div>
        );
    }

    return (
        <div className="admin-container-cq">
            <Header />

            <div className="content-wrapper-cq">
                <button
                    className="back-button-cq"
                    onClick={() => navigate('/admin/quizManagement')}
                >
                    <ArrowLeft size={18} />
                    Back to Quiz Management
                </button>

                <div className="page-header-cq">
                    <h1 className="page-title-cq">Edit Quiz</h1>
                    <p className="page-subtitle-cq">Update quiz information and questions</p>
                </div>

                {/* Quiz Basic Info */}
                <div className="quiz-basic-info-cq">
                    <h2 className="section-title-cq">Quiz Information</h2>
                    <div className="form-grid-cq">
                        <div className="form-group-cq">
                            <label className="form-label-cq">Quiz Title *</label>
                            <input
                                type="text"
                                className="form-input-cq"
                                value={quizData.title}
                                onChange={(e) => handleQuizChange('title', e.target.value)}
                            />
                        </div>

                        <div className="form-group-cq full-width">
                            <label className="form-label-cq">Description</label>
                            <textarea
                                className="form-textarea-cq"
                                value={quizData.description}
                                onChange={(e) => handleQuizChange('description', e.target.value)}
                            />
                        </div>

                        <div className="form-group-cq">
                            <label className="form-label-cq">Category</label>
                            <select
                                className="form-select-cq"
                                value={quizData.category}
                                onChange={(e) => handleQuizChange('category', e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group-cq">
                            <label className="form-label-cq">Difficulty</label>
                            <select
                                className="form-select-cq"
                                value={quizData.difficulty}
                                onChange={(e) => handleQuizChange('difficulty', e.target.value)}
                            >
                                {difficulties.map(diff => (
                                    <option key={diff} value={diff}>{diff}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                </div>

                {/* Questions Section */}
                <div className="questions-section-cq">
                    <h2>Questions ({quizData.questions.length})</h2>

                    {quizData.questions.map((question, index) => (
                        <div key={question.id || index} className="question-card-cq">
                            <div className="question-header-cq">
                                <h3>Question {index + 1}</h3>
                            </div>

                            <div className="form-group-cq">
                                <label className="form-label-cq">Question Text *</label>
                                <textarea
                                    className="form-textarea-cq"
                                    value={question.questionText}
                                    onChange={(e) => handleQuestionChange(index, 'questionText', e.target.value)}
                                    rows="3"
                                />
                            </div>

                            <div className="image-upload-section-cq">
                                <label className="form-label-cq">Question Image (Optional)</label>

                                {!question.imageUrl && !question.imagePreview ? (
                                    // No image - show upload button
                                    <div className="image-upload-controls-cq">
                                        <input
                                            type="file"
                                            id={`image-upload-edit-${index}`}
                                            accept="image/*"
                                            onChange={(e) => handleImageSelect(index, e)}
                                            style={{ display: 'none' }}
                                        />
                                        <label
                                            htmlFor={`image-upload-edit-${index}`}
                                            className="upload-image-btn-cq"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Upload size={16} />
                                            {uploadingImage ? 'Uploading...' : 'Select Image'}
                                        </label>
                                    </div>
                                ) : (
                                    // Has image - show preview with change/remove buttons
                                    <div className="image-preview-container-cq">
                                        <img
                                            src={
                                                question.imagePreview
                                                    ? question.imagePreview
                                                    : `${API_BASE_URL}${question.imageUrl}`
                                            }
                                            alt="Preview"
                                            className="image-preview-img-cq"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                        <div className="image-actions-cq" style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="file"
                                                id={`image-change-${index}`}
                                                accept="image/*"
                                                onChange={(e) => handleImageSelect(index, e)}
                                                style={{ display: 'none' }}
                                            />
                                            <label
                                                htmlFor={`image-change-${index}`}
                                                className="change-image-btn-cq"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <Upload size={16} />
                                                Change Image
                                            </label>

                                            <button
                                                type="button"
                                                className="remove-image-btn-cq"
                                                onClick={() => handleRemoveImage(index)}
                                            >
                                                <X size={16} />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>


                            <div className="options-grid-cq">
                                {['A', 'B', 'C', 'D'].map(letter => (
                                    <div key={letter} className="option-group-cq">
                                        <label className="form-label-cq">Option {letter} *</label>
                                        <div className="option-input-wrapper-cq">
                                            <input
                                                type="text"
                                                className="option-text-input-cq"
                                                value={question[`option${letter}`]}
                                                onChange={(e) => handleQuestionChange(index, `option${letter}`, e.target.value)}
                                            />
                                            <input
                                                type="radio"
                                                name={`correctAnswer-${index}`}
                                                value={letter}
                                                checked={question.correctAnswer === letter}
                                                onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
                                                className="correct-answer-radio-cq"
                                            />
                                        </div>
                                        <span className="correct-label-cq">
                                            {question.correctAnswer === letter ? '✓ Correct Answer' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="action-buttons-cq">
                    <button
                        type="button"
                        className="cancel-btn-cq"
                        onClick={() => navigate('/admin/quizManagement')}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="publish-quiz-btn-cq"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Update Quiz'}
                    </button>
                </div>
            </div>
        </div>
    );
}
