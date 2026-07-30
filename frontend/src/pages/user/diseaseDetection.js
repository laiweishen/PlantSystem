import { useState } from 'react';
import { X, Loader, ArrowLeft, Upload, ExternalLink } from 'lucide-react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import '../css/user/diseaseDetection.css';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/apiConfig';

export default function DiseaseDetection() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const navigate = useNavigate();

  const getConfidenceLevel = (confidence) => {
    const percentage = confidence * 100;
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
  };

  // Enhanced normalization function for disease names
  const normalizeDiseaseName = (diseaseName) => {
    if (!diseaseName) return '';

    return diseaseName
      .trim()
      .toLowerCase()
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]/g, ' ')
      .replace(/\b(disease|spot|blight|rot|wilt|mold|mildew|rust)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    const filesToAdd = validFiles.slice(0, 5);
    setSelectedFiles(filesToAdd);

    const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
    setResults([]);
  };

  const removeImage = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleDetect = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

    const token = sessionStorage.getItem('userToken');
    if (!token) {
      alert('Please login first');
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);
    const newResults = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const formData = new FormData();
        formData.append('image', selectedFiles[i]);

        const response = await fetch(`${API_BASE_URL}/api/plants/detect-disease`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          const predictionData = data.prediction || {};
          const diseaseName = predictionData.disease || 'Unknown Disease';

          console.log('Disease name from AI:', diseaseName);

          // Fetch database info using the disease name
          const diseaseInfo = await fetchDiseaseInfo(diseaseName);

          const resultObj = {
            fileName: selectedFiles[i].name,
            preview: previews[i],
            disease: diseaseName,
            confidence: predictionData.confidence || 0,
            is_healthy: predictionData.is_healthy || false,
            plant: predictionData.plant || 'Unknown Plant',
            diseaseInfo,
            uploadedImagePath: data.uploadedImagePath || null
          };

          newResults.push(resultObj);
          saveDiseaseScanResult(resultObj);

        } else {
          // Handle error case
          newResults.push({
            fileName: selectedFiles[i].name,
            preview: previews[i],
            error: data.message || 'Detection failed'
          });
        }

      }
      setResults(newResults);

    } catch (err) {
      console.error('Detection Error:', err);
      setError('Failed to connect to server');

    } finally {
      setLoading(false);
    }
  };

  const saveDiseaseScanResult = async (scan) => {
    const token = sessionStorage.getItem('userToken');
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/api/scanresults`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scanType: 'disease',
          imageFileName: scan.fileName,
          predictedName: scan.disease,
          confidence: scan.confidence,
          isHealthy: scan.is_healthy,
          plantId: null,
          diseaseId: scan.diseaseInfo?.id || null,
          imageUrl: scan.uploadedImagePath || null      // ⭐ user-uploaded photo path
        })
      });
    } catch (e) {
      console.error('Error saving disease scan result:', e);
    }
  };


  const fetchDiseaseInfo = async (diseaseName) => {

    try {
      const normalizedDiseaseName = normalizeDiseaseName(diseaseName);
      console.log('Original disease:', diseaseName, 'Normalized:', normalizedDiseaseName);

      const res = await fetch(
        `${API_BASE_URL}/api/plants/disease-info?name=${encodeURIComponent(normalizedDiseaseName)}`
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      console.log('Disease info response:', result);

      if (result.success && result.data) {
        return result.data;
      }
      return null;

    } catch (error) {
      console.error('Error fetching disease info:', error);
      return null;
    }
  };

  const DiseaseModal = () => {
    if (!showModal || !selectedResult) return null;

    const diseaseInfo = selectedResult.diseaseInfo;
    const diseaseName =
      diseaseInfo?.name || selectedResult.disease || 'Unknown Disease';
    const confidence = Number(selectedResult.confidence || 0);
    const confidenceLevel = getConfidenceLevel(confidence);
    const category = diseaseInfo?.category || 'Unknown';
    const severity = diseaseInfo?.severity || 'Unknown';


    return (
      <div className="disease-modal-overlay" onClick={() => setShowModal(false)}>
        <div className="disease-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="disease-modal-close" onClick={() => setShowModal(false)}>
            <X size={24} />
          </button>

          <h2 className="disease-modal-title">{diseaseName}</h2>

          <div className="disease-modal-body">
            <div className="disease-modal-image">
              <img src={selectedResult.preview} alt={diseaseName} />
            </div>

            <div className="disease-modal-info">
              <h3 className="disease-info-section-title">Disease Information</h3>

              <div className="disease-info-group">
                <label className="disease-info-label">Disease Name</label>
                <p className="disease-info-text">{diseaseName}</p>
              </div>


              <div className="disease-info-group">
                <label className="disease-info-label">Category</label>
                <p className="disease-info-text">{category}</p>
              </div>

              <div className="disease-info-group">
                <label className="disease-info-label">Detection Accuracy</label>
                <p className="disease-info-text">
                  <strong style={{
                    color: confidenceLevel === 'high' ? '#4CAF50' :
                      confidenceLevel === 'medium' ? '#FF9800' : '#F44336',
                    fontSize: '1.2rem'
                  }}>
                    {(confidence * 100).toFixed(2)}%
                  </strong>
                </p>
              </div>

              <div className="disease-info-group">
                <label className="disease-info-label">Severity</label>
                <span className={`disease-severity-badge ${severity.toLowerCase()}`}>
                  {severity}
                </span>
              </div>

              {diseaseInfo?.id && (
                <div className="disease-info-group">
                  <button
                    className="view-full-details-btn-dd"
                    onClick={() => {
                      setShowModal(false);
                      navigate(`/disease/${diseaseInfo.id}`);
                    }}
                  >
                    <ExternalLink size={16} />
                    View Full Disease Details
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="disease-page-container">
      <Header />
      <DiseaseModal />

      {showUploadModal && (
        <div className="disease-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="disease-upload-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="disease-modal-close" onClick={() => {
              setShowUploadModal(false);
              setResults([]);
              setSelectedFiles([]);
              setPreviews([]);
            }}>
              <X size={24} />
            </button>

            <h2 className="disease-modal-title">
              {results.length > 0 ? 'Detection Results' : 'Upload Plant Images'}
            </h2>

            <div className="disease-upload-modal-body">
              {results.length === 0 ? (
                <>
                  <div className="disease-upload-icon-wrapper">
                    <Upload size={48} />
                  </div>
                  <h3 className="disease-upload-title">Select Images from Your Device</h3>
                  <p className="disease-upload-subtitle">Upload an images (JPG, PNG, max 10MB each)</p>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    id="diseaseFileInputModal"
                    style={{ display: 'none' }}
                  />

                  <label htmlFor="diseaseFileInputModal" className="disease-choose-file-btn">
                    Choose Files
                  </label>

                  {selectedFiles.length > 0 && (
                    <div className="disease-selected-images">
                      <p className="disease-selected-count">{selectedFiles.length} image(s) selected</p>
                      <div className="disease-preview-grid">
                        {previews.map((preview, index) => (
                          <div key={index} className="disease-preview-item">
                            <img src={preview} alt={`Preview ${index + 1}`} />
                            <button className="disease-remove-btn" onClick={() => removeImage(index)}>
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="disease-modal-actions">
                    {selectedFiles.length > 0 && (
                      <>
                        <button
                          className="disease-clear-btn"
                          onClick={() => {
                            setSelectedFiles([]);
                            setPreviews([]);
                            setResults([]);
                          }}
                        >
                          Clear All
                        </button>
                        <button
                          className="disease-detect-btn"
                          onClick={handleDetect}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader className="spinning" size={20} />
                              Analyzing...
                            </>
                          ) : (
                            '🔬 Detect Disease'
                          )}
                        </button>
                      </>
                    )}
                  </div>

                  {error && <div className="disease-error-message">❌ {error}</div>}
                </>
              ) : (
                <div className="disease-results-view">
                  <div className="disease-results-grid">

                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="disease-result-card"
                        onClick={() => {
                          if (!result.error) {
                            setSelectedResult(result);
                            setShowModal(true);
                            setShowUploadModal(false);
                          }
                        }}
                      >
                        <div className="disease-result-image-wrapper">
                          <img src={result.preview} alt={result.fileName} />
                        </div>
                        <div className="disease-result-info">
                          {result.error ? (
                            <div className="disease-result-error">
                              <span className="disease-error-badge">❌ Failed</span>
                              <p className="disease-error-text">{result.error}</p>
                            </div>

                          ) : (

                            <>
                              <h4 className="disease-result-name">
                                {result.diseaseInfo?.Name || result.disease.replace(/_/g, ' ')}
                              </h4>

                              <div className="disease-result-confidence">
                                <span className="disease-confidence-label">Accuracy:</span>
                                <span className={`disease-confidence-value confidence-${getConfidenceLevel(result.confidence || 0)}`}>
                                  {((result.confidence || 0) * 100).toFixed(1)}%
                                </span>
                              </div>

                              {/* Show severity badge */}
                              <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.6rem',
                                    display: 'inline-block'
                                  }}
                                  className={`disease-severity-badge ${(result.diseaseInfo?.severity || 'unknown').toLowerCase()
                                    }`}

                                >
                                  {(result.diseaseInfo?.severity || 'Unknown')}
                                </span>
                              </div>

                              <button className="disease-view-details-btn">View Details →</button>

                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="disease-results-actions">
                    <button
                      className="disease-upload-another-btn"
                      onClick={() => {
                        setResults([]);
                        setSelectedFiles([]);
                        setPreviews([]);
                      }}
                    >
                      Upload Another
                    </button>
                    <button
                      className="disease-done-btn"
                      onClick={() => {
                        setShowUploadModal(false);
                        setResults([]);
                        setSelectedFiles([]);
                        setPreviews([]);
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="disease-content-wrapper">
        <button className="disease-back-button" onClick={() => navigate("/")}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="disease-page-title">Disease Detection & Classification</h1>
        <p className="disease-page-description">
          Upload multiple plant images or capture them directly to get instant AI-powered
          identification with detailed information
        </p>

        <div className="disease-tab-container">
          <button
            className="disease-tab-button"
            onClick={() => navigate('/recognize')}
          >
            Plant Recognition
          </button>
          <button
            className="disease-tab-button active"
            onClick={() => navigate('/disease-detect')}
          >
            Disease Detect
          </button>
        </div>

        <div className="disease-upload-card" onClick={() => setShowUploadModal(true)} style={{ cursor: 'pointer' }}>
          <div className="disease-upload-icon-wrapper">
            <Upload size={48} />
          </div>
          <h2 className="disease-upload-card-title">Upload From Devices</h2>
          <p className="disease-upload-card-subtitle">Select an images from your gallery</p>
          <button className="disease-choose-file-card-btn" onClick={(e) => {
            e.stopPropagation();
            setShowUploadModal(true);
          }}>
            Choose Files
          </button>
        </div>
      </div>

      <div className="disease-tips-section">
        <h3 className="disease-tips-title">📸 Photography Tips for Better Detection</h3>
        <ul className="disease-tips-list">
          <li>• Capture clear images of affected plant parts</li>
          <li>• Focus on diseased leaves, stems, or flowers</li>
          <li>• Include close-ups of symptoms</li>
          <li>• Ensure good lighting conditions</li>
          <li>• Avoid shadows and reflections</li>
          <li>• Take multiple angles for accuracy</li>
        </ul>
      </div>

      <Footer />
    </div>
  );
}