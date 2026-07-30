import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import '../css/user/quizTaking.css';
import { API_BASE_URL } from '../../config/apiConfig';

export default function QuizTaking() {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    const { quizId } = useParams();
    const [questions, setQuestions] = useState([]);
    const [quizType, setQuizType] = useState('');
    const [total, setTotal] = useState(0);

    useEffect(() => {
        // For custom/admin quizzes (URL param present)
        if (quizId) {
            const token = sessionStorage.getItem('userToken');
            fetch(`${API_BASE_URL}/api/quiz/${quizId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    console.log('Quiz data fetched:', data);
                    if (data.success && data.quiz && data.quiz.questions) {
                        setQuestions(data.quiz.questions);
                        setQuizType(data.quiz.category || 'custom');
                        setTotal(data.quiz.questions.length);
                    } else {
                        navigate('/quiz');
                    }
                });
        }
        // For classic plant/disease quiz
        else if (location.state?.questions && location.state.questions.length > 0) {
            setQuestions(location.state.questions);
            setQuizType(location.state.quizType || '');
            setTotal(location.state.total || location.state.questions.length);
        }
        // Redirect if nothing to show
        else {
            navigate('/quiz');
        }
    }, [quizId, location, navigate]);


    if (!questions || questions.length === 0) {
        return <div>Loading...</div>;
    }

    const currentQ = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / total) * 100;
    const isLastQuestion = currentQuestion === questions.length - 1;

    const handleOptionSelect = (optionLetter, optionText) => {
        setSelectedAnswers({
            ...selectedAnswers,
            [currentQ.id]: {
                answerText: optionText,
                answerLetter: optionLetter
            }
        });
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handleSubmit = async () => {
        setShowSubmitConfirm(false);

        const token = sessionStorage.getItem('userToken');

        // Calculate score in frontend first
        let frontendScore = 0;
        const results = questions.map(question => {
            const userAnswer = selectedAnswers[question.id];

            const correctLetter = (question.correctAnswerLetter || question.correctAnswer || '').trim().toUpperCase();
            const userLetter = (userAnswer?.answerLetter || '').trim().toUpperCase();

            const isCorrect = userLetter === correctLetter;
            if (isCorrect) frontendScore++;

            return {
                questionId: question.id,
                userAnswer: userAnswer?.answerText || '',
                userAnswerLetter: userLetter || '?',
                correctAnswer: question.correctAnswer,              // "A"/"B"/"C"/"D"
                correctAnswerLetter: correctLetter || null,
                isCorrect,
                questionText: question.questionText,
                imageUrl: question.imageUrl
            };
        });

        const percentage = questions.length > 0
            ? Math.round((frontendScore / questions.length) * 100)
            : 0;

        const answers = questions.map(question => {
        const user = selectedAnswers[question.id];

        const options = {
            A: question.optionA,
            B: question.optionB,
            C: question.optionC,
            D: question.optionD,
        };
            return {
                questionId: question.id,
                userAnswer: user?.answerText || '',
                userAnswerLetter: user?.answerLetter || '?',
                correctAnswer: question.correctAnswer,        // "A"/"B"/"C"/"D"
                correctAnswerLetter: question.correctAnswerLetter, // or undefined
                questionText: question.questionText,
                imageUrl: question.imageUrl,
                options
            };
        });

        try {
            const response = await fetch(`${API_BASE_URL}/api/quiz/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quizType: quizType,
                    answers: answers
                })
            });

            const data = await response.json();

            navigate('/quiz-results', {
                state: {
                    score: data.score,
                    total: data.total,
                    percentage: data.percentage,
                    quizType: quizType,
                    quizResultId: data.quizResultId
                }
            });

        } catch (error) {
            console.error('Error:', error);
            // Still show results even if submission fails
            navigate('/quiz-results', {
                state: {
                    score: frontendScore,
                    total: questions.length,
                    percentage: percentage,
                    results: results,
                    quizType: quizType
                }
            });
        }
    };

    const optionsToRender = (() => {
        // If question already has an "options" array/object (old quizzes), keep supporting it
        if (currentQ.options) {
            const opt = currentQ.options;
            if (Array.isArray(opt)) {
                return opt.map((text, index) => ({
                    letter: ['A', 'B', 'C', 'D'][index],
                    text,
                }));
            }
            return Object.entries(opt).map(([letter, text]) => ({ letter, text }));
        }

        // ⭐ Auto-quiz path: build from optionA–optionD
        const manualOptions = [
            { letter: 'A', text: currentQ.optionA },
            { letter: 'B', text: currentQ.optionB },
            { letter: 'C', text: currentQ.optionC },
            { letter: 'D', text: currentQ.optionD },
        ].filter(o => o.text); // remove undefined ones

        return manualOptions;
    })();



    return (
        <div className="quiz-taking-page">
            {/* Header with Progress */}
            <div className={`quiz-header ${quizType === 'disease' ? 'disease-theme' : 'plant-theme'}`}>
                <h2>{quizType === 'plant' ? 'Plant Identification' : 'Disease Detection'}</h2>
                <span className="progress-text">{currentQuestion + 1} / {total}</span>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* Question Card */}
            <div className="question-container">
                <h3 className="question-number">{currentQuestion + 1}. {currentQ.questionText}</h3>

                {currentQ.imageUrl && (
                    <div className="question-image">
                        <img
                            src={
                                currentQ.imageUrl.startsWith('http')
                                    ? currentQ.imageUrl
                                    : `${API_BASE_URL}${currentQ.imageUrl}`
                            }
                            alt="Question"
                            onError={e => e.target.style.display = 'none'}
                        />
                    </div>
                )}


                {/* Options */}
                <div className="options-grid">
                    {optionsToRender.map((option, index) => (
                        <button
                            key={index}
                            className={`option-button ${selectedAnswers[currentQ.id]?.answerText === option.text ? 'selected' : ''
                                }`}
                            onClick={() => handleOptionSelect(option.letter, option.text)}
                        >
                            <span className="option-radio">
                                {selectedAnswers[currentQ.id]?.answerText === option.text && (
                                    <span className="radio-dot"></span>
                                )}
                            </span>
                            <span className="option-letter">{option.letter}.</span>
                            {option.text}
                        </button>
                    ))}
                </div>


                {/* Action Buttons */}
                <div className="quiz-actions">
                    <button className="exit-button" onClick={() => setShowExitConfirm(true)}>
                        Exit Quiz
                    </button>
                    
                    <button
                        className="prev-button"
                        onClick={() => setCurrentQuestion(q => Math.max(q - 1, 0))}
                        disabled={currentQuestion === 0}
                    >
                        Previous
                    </button>

                    {isLastQuestion ? (
                        <button
                            className="submit-button"
                            onClick={() => setShowSubmitConfirm(true)}
                            disabled={!selectedAnswers[currentQ.id]}
                        >
                            Submit Questions
                        </button>
                    ) : (
                        <button
                            className="next-button"
                            onClick={handleNext}
                            disabled={!selectedAnswers[currentQ.id]}
                        >
                            Next Questions
                        </button>
                    )}
                </div>
            </div>

            {/* Submit Confirmation Modal */}
            {showSubmitConfirm && (
                <div className="modal-overlay" onClick={() => setShowSubmitConfirm(false)}>
                    <div className="modal-content-qt" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowSubmitConfirm(false)}>
                            <X size={24} />
                        </button>
                        <h2>Are You Sure To Submit?</h2>
                        <div className="modal-actions">
                            <button className="modal-no" onClick={() => setShowSubmitConfirm(false)}>
                                No
                            </button>
                            <button className="modal-yes" onClick={handleSubmit}>
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="modal-overlay" onClick={() => setShowExitConfirm(false)}>
                    <div className="modal-content-qt" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowExitConfirm(false)}>
                            <X size={24} />
                        </button>
                        <h2>Exit Quiz?</h2>
                        <p>Your progress will be lost</p>
                        <div className="modal-actions">
                            <button className="modal-no" onClick={() => setShowExitConfirm(false)}>
                                Cancel
                            </button>
                            <button className="modal-yes" onClick={() => navigate('/quiz')}>
                                Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}