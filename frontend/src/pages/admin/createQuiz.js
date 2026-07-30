import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowLeft, Upload, Image, X} from 'lucide-react';
import Header from '../../components/header';
import '../css/admin/createQuiz.css';
import { API_BASE_URL } from '../../config/apiConfig';

export default function CreateQuiz() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [numberOfQuestions, setNumberOfQuestions] = useState(1);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [quizData, setQuizData] = useState({
        title: '',
        description: '',
        category: 'Plants',
        difficulty: 'Medium',
        questions: [
            {
                questionText: '',
                imageUrl: '',
                imagePreview: null, 
                optionA: '',
                optionB: '',
                optionC: '',
                optionD: '',
                correctAnswer: 'A',
                orderIndex: 0
            }
        ]
    });

    const categories = ['Plants', 'Disease', 'Mixed'];
    const difficulties = ['Easy', 'Medium', 'Hard'];

    // ⭐ NEW: Generate questions based on number selected
    const handleNumberOfQuestionsChange = (e) => {
        const count = parseInt(e.target.value) || 1;
        setNumberOfQuestions(count);

        // Generate new questions array
        const newQuestions = Array.from({ length: count }, (_, index) => ({
            questionText: quizData.questions[index]?.questionText || '',
            imageUrl: quizData.questions[index]?.imageUrl || '',
            optionA: quizData.questions[index]?.optionA || '',
            optionB: quizData.questions[index]?.optionB || '',
            optionC: quizData.questions[index]?.optionC || '',
            optionD: quizData.questions[index]?.optionD || '',
            correctAnswer: quizData.questions[index]?.correctAnswer || 'A',
            orderIndex: index
        }));

        setQuizData(prev => ({
            ...prev,
            questions: newQuestions
        }));
    };

    // Add new question
    const addQuestion = () => {
        setNumberOfQuestions(prev => prev + 1);
        setQuizData(prev => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    questionText: '',
                    imageUrl: '',
                    optionA: '',
                    optionB: '',
                    optionC: '',
                    optionD: '',
                    correctAnswer: 'A',
                    orderIndex: prev.questions.length
                }
            ]
        }));
    };

    // Remove question
    const removeQuestion = (index) => {
        if (quizData.questions.length <= 1) {
            alert('Quiz must have at least one question');
            return;
        }
        setNumberOfQuestions(prev => prev - 1);
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    // Update quiz basic info
    const handleQuizChange = (field, value) => {
        setQuizData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Update question
    const handleQuestionChange = (index, field, value) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.map((question, i) =>
                i === index ? { ...question, [field]: value } : question
            )
        }));
    };

    // Validate form
    const validateForm = () => {
        if (!quizData.title.trim()) {
            alert('Please enter a quiz title');
            return false;
        }

        if (!quizData.description.trim()) {
            alert('Please enter a quiz description');
            return false;
        }

        for (let i = 0; i < quizData.questions.length; i++) {
            const question = quizData.questions[i];

            if (!question.questionText.trim()) {
                alert(`Please enter text for question ${i + 1}`);
                return false;
            }

            if (!question.optionA.trim() || !question.optionB.trim() ||
                !question.optionC.trim() || !question.optionD.trim()) {
                alert(`Please fill all options for question ${i + 1}`);
                return false;
            }

            if (!question.correctAnswer) {
                alert(`Please select correct answer for question ${i + 1}`);
                return false;
            }
        }

        return true;
    };

    // Handle image upload
    const handleImageUpload = async (questionIndex) => {
        const imageUrl = prompt('Enter image URL (implement file upload as needed):');
        if (imageUrl) {
            handleQuestionChange(questionIndex, 'imageUrl', imageUrl);
        }
    };

    // Submit quiz
    const handleSubmit = async (saveAsDraft = false) => {
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
                ...quizData,
            };

            const response = await fetch(`${API_BASE_URL}/api/quiz`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitData)
            });

            const result = await response.json();

            if (result.success) {
                alert(`Quiz ${saveAsDraft ? 'saved as draft' : 'created'} successfully!`);
                navigate('/admin/quizManagement');
            } else {
                alert('Failed to create quiz: ' + result.message);
            }
        } catch (error) {
            console.error('Error creating quiz:', error);
            alert('Error creating quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = async (questionIndex, event) => {
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

        // Upload to server
        await uploadImageToServer(questionIndex, file);
    };

        // ⭐ NEW: Upload image to server
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
                // Update imageUrl with server path
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

    // ⭐ NEW: Remove image
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

    //start here
    return (
        <div className="admin-container-cq">
            <Header />

            <div className="content-wrapper-cq">
                {/* Page Header */}
                <button
                    className="back-button-cq"
                    onClick={() => navigate('/admin/quizManagement')}
                >
                    <ArrowLeft size={18} />
                    Back to Quiz Management
                </button>
                
                <div className="page-header-cq">
                    <h1 className="page-title-cq">Create New Quiz</h1>
                    <p className="page-subtitle-cq">Design your custom quiz with multiple choice questions</p>
                </div>

                {/* Quiz Basic Info */}
                <div className="quiz-basic-info-cq">
                    <h2 className="section-title-cq">Quiz Information</h2>
                    <div className="form-grid-cq">
                        <div className="form-group-cq">
                            <label className="form-label-cq">
                                Quiz Title <span className="required-star-cq">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-input-cq"
                                value={quizData.title}
                                onChange={(e) => handleQuizChange('title', e.target.value)}
                                placeholder="Enter quiz title"
                                required
                            />
                        </div>

                        <div className="form-group-cq full-width">
                            <label className="form-label-cq">
                                Description <span className="required-star-cq">*</span>
                            </label>
                            <textarea
                                className="form-textarea-cq"
                                value={quizData.description}
                                onChange={(e) => handleQuizChange('description', e.target.value)}
                                placeholder="Enter quiz description"
                                required
                            />
                        </div>

                        {/* ⭐ NEW: Number of Questions Selector */}
                        <div className="form-group-cq">
                            <label className="form-label-cq">
                                Number of Questions <span className="required-star-cq">*</span>
                            </label>
                            <input
                                type="number"
                                className="form-input-cq"
                                min="1"
                                max="50"
                                value={numberOfQuestions}
                                onChange={handleNumberOfQuestionsChange}
                                placeholder="Enter number of questions"
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
                    <div className="questions-header-cq">
                        <h2 className="questions-title-cq">Questions ({quizData.questions.length})</h2>
                        <button
                            className="add-question-btn-cq"
                            onClick={addQuestion}
                            type="button"
                        >
                            <Plus size={18} />
                            Add Question
                        </button>
                    </div>

                    {quizData.questions.map((question, index) => (
                        <div key={index} className="question-card-cq">

                            <div className="question-header-cq">
                                <h3 className="question-number-cq">Question {index + 1}</h3>
                                <button
                                    type="button"
                                    className="remove-question-btn-cq"
                                    onClick={() => removeQuestion(index)}
                                    disabled={quizData.questions.length <= 1}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Question Text */}
                            <div className="form-group-cq">
                                <label className="form-label-cq">
                                    Question Text <span className="required-star-cq">*</span>
                                </label>
                                <textarea
                                    className="form-textarea-cq"
                                    value={question.questionText}
                                    onChange={(e) => handleQuestionChange(index, 'questionText', e.target.value)}
                                    placeholder="Enter your question here..."
                                    rows="3"
                                    required
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="image-upload-section-cq">
                                <label className="form-label-cq">Question Image (Optional)</label>

                                {!question.imagePreview ? (
                                    <div className="image-upload-controls-cq">
                                        <input
                                            type="file"
                                            id={`image-upload-${index}`}
                                            accept="image/*"
                                            onChange={(e) => handleImageSelect(index, e)}
                                            style={{ display: 'none' }}
                                        />
                                        <label 
                                            htmlFor={`image-upload-${index}`}
                                            className="upload-image-btn-cq"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Upload size={16} />
                                            {uploadingImage ? 'Uploading...' : 'Select Image'}
                                        </label>
                                    </div>
                                ) : (
                                    <div className="image-preview-container-cq">
                                        <img 
                                            src={question.imagePreview} 
                                            alt="Preview" 
                                            className="image-preview-img-cq"
                                        />
                                        <button
                                            type="button"
                                            className="remove-image-btn-cq"
                                            onClick={() => handleRemoveImage(index)}
                                        >
                                            <X size={16} />
                                            Remove
                                        </button>
                                    </div>
                                )}

                               
                            </div>

                            {/* Options */}
                            <div className="options-grid-cq">
                                {['A', 'B', 'C', 'D'].map(letter => (
                                    <div key={letter} className="option-group-cq">
                                        <label className="form-label-cq">
                                            Option {letter} <span className="required-star-cq">*</span>
                                        </label>
                                        <div className="option-input-wrapper-cq">
                                            <input
                                                type="text"
                                                className="option-text-input-cq"
                                                value={question[`option${letter}`]}
                                                onChange={(e) => handleQuestionChange(index, `option${letter}`, e.target.value)}
                                                placeholder={`Enter option ${letter}`}
                                                required
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

                {/* Action Buttons */}
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
                        onClick={() => handleSubmit(false)}
                        disabled={loading}
                    >
                        <Save size={18} />
                        {loading ? 'Creating...' : 'Create Quiz'}
                    </button>
                </div>
            </div>
        </div>
    );
}
