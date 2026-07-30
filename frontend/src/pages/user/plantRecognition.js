import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader, ArrowLeft, Upload, ExternalLink } from 'lucide-react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import '../css/user/plantRecognition.css';
import { API_BASE_URL } from '../../config/apiConfig';

export default function PlantRecognition() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const navigate = useNavigate();

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

  const getConfidenceLevel = (confidence) => {
    const percentage = confidence * 100;
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
  };

  const removeImage = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleRecognize = async () => {
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

        const response = await fetch(`${API_BASE_URL}/api/plants/recognize`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.message || 'No plant detected in the image.');
          return;
        }

        if (data.success && data.prediction) {
          const plantName = data.prediction.plant;
          const plantInfo = await fetchPlantInfo(plantName);

          const resultObj = {
            fileName: selectedFiles[i].name,
            preview: previews[i],
            plant: plantName,
            confidence: data.prediction.confidence || 0,
            is_healthy: data.prediction.is_healthy || false,
            disease: data.prediction.disease || 'Unknown',
            plantInfo,
            uploadedImagePath: data.uploadedImagePath || null
          };

          newResults.push(resultObj);
          saveScanResult(resultObj);


        } else {
          // Handle error case
          newResults.push({
            fileName: selectedFiles[i].name,
            preview: previews[i],
            error: data.message || 'Recognition failed'
          });
        }
      }
      setResults(newResults);
    } catch (err) {
      console.error('Recognition Error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  //get database match plant information
  const fetchPlantInfo = async (plantName) => {
    console.log('Searching for plant:', plantName);

    try {
      // Clean the plant name - remove extra spaces and make consistent
      const cleanPlantName = plantName.trim().toLowerCase();
      

      const res = await fetch(
        `${API_BASE_URL}/api/plants/info?name=${encodeURIComponent(cleanPlantName)}`
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      console.log('Plant info response:', result);

      if (result.success && result.data) {
        return result.data; // Full plant info from SQL
      } else {
        console.warn('Plant not found in database:', plantName);
        return null;
      }
    } catch (error) {
      console.error('Error fetching plant info:', error);
      return null;
    }
  };

  const saveScanResult = async (scan) => {
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
          scanType: 'plant',
          imageFileName: scan.fileName,
          predictedName: scan.plant,
          confidence: scan.confidence,
          isHealthy: scan.is_healthy,
          plantId: scan.plantInfo?.id || null,
          diseaseId: null,
          imageUrl: scan.uploadedImagePath || null
        })
      });
    } catch (e) {
      console.error('Error saving scan result:', e);
    }
  };


  const PlantInfoModal = () => {
    if (!showModal || !selectedResult) return null;

    const plantDetails = selectedResult.plantInfo; // Database info

    // Show limited information in modal
    const plantName = plantDetails?.name || selectedResult.plant || 'Unknown Plant';
    const scientificName = plantDetails?.scientificName || 'Unavailable';
    const category = plantDetails?.category || 'Unavailable';
    const description = plantDetails?.description || 'Unavailable';
    const confidence = Number(selectedResult.confidence || 0);
    const confidenceLevel = getConfidenceLevel(confidence);

    return (
      <div className="plant-modal-overlay" onClick={() => setShowModal(false)}>
        <div className="plant-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="plant-modal-close" onClick={() => setShowModal(false)}>
            <X size={24} />
          </button>

          <h2 className="plant-modal-title">{plantName}</h2>

          <div className="plant-modal-body">
            <div className="plant-modal-image">
              <img src={selectedResult.preview} alt={plantName} />
            </div>

            <div className="plant-modal-info">
              <h3 className="plant-info-section-title">Plant Information</h3>

              <div className="plant-info-group">
                <label className="plant-info-label">Plant Name</label>
                <p className="plant-info-text">{plantName}</p>
              </div>

              <div className="plant-info-group">
                <label className="plant-info-label">Scientific Name</label>
                <p className="plant-info-text">{scientificName}</p>
              </div>

              <div className="plant-info-group">
                <label className="plant-info-label">Category</label>
                <p className="plant-info-text">{category}</p>
              </div>

              <div className="plant-info-group">
                <label className="plant-info-label">Description</label>
                <p className="plant-info-text">{description}</p>
              </div>


              <div className="plant-info-group">
                <label className="plant-info-label">Accuracy Score</label>
                <p className="plant-info-text">
                  <strong style={{
                    color: confidenceLevel === 'high' ? '#4CAF50' :
                      confidenceLevel === 'medium' ? '#FF9800' : '#F44336',
                    fontSize: '1.2rem'
                  }}>
                    {(confidence * 100).toFixed(2)}%

                  </strong>
                </p>
              </div>

              {plantDetails?.id && (
                <div className="plant-info-group">
                  <button
                    className="view-full-details-btn"
                    onClick={() => {
                      setShowModal(false);
                      navigate(`/plant/${plantDetails.id}`);
                    }}
                  >
                    <ExternalLink size={16} />
                    View Full Plant Details
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
    <div className="page-container">
      <Header />
      <PlantInfoModal />

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => {
              setShowUploadModal(false);
              setResults([]); // Clear results when closing
              setSelectedFiles([]);
              setPreviews([]);
            }}>
              <X size={24} />
            </button>

            <h2 className="modal-title-center">
              {results.length > 0 ? 'Recognition Results' : 'Upload Plant Images'}
            </h2>

            <div className="upload-modal-body">
              {/* Show upload UI only if no results */}
              {results.length === 0 ? (
                <>
                  <div className="upload-icon-wrapper-modal">
                    <Upload size={48} />
                  </div>
                  <h3 className="upload-title-modal">Select Images from Your Device</h3>
                  <p className="upload-subtitle-modal">Upload an images (JPG, PNG, max 10MB each)</p>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    id="fileInputModal"
                    style={{ display: 'none' }}
                  />

                  <label htmlFor="fileInputModal" className="choose-file-btn-modal">
                    Choose Files
                  </label>

                  {selectedFiles.length > 0 && (
                    <div className="selected-images-modal">
                      <p className="selected-count">{selectedFiles.length} image(s) selected</p>
                      <div className="preview-grid-modal">
                        {previews.map((preview, index) => (
                          <div key={index} className="preview-item-modal">
                            <img src={preview} alt={`Preview ${index + 1}`} />
                            <button className="remove-btn-modal" onClick={() => removeImage(index)}>
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="modal-actions">
                    {selectedFiles.length > 0 && (
                      <>
                        <button
                          className="clear-btn-modal"
                          onClick={() => {
                            setSelectedFiles([]);
                            setPreviews([]);
                            setResults([]);
                          }}
                        >
                          Clear All
                        </button>
                        <button
                          className="upload-btn-modal"
                          onClick={handleRecognize}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader className="spinning" size={20} />
                              Analyzing...
                            </>
                          ) : (
                            '🔍 Recognize Plants'
                          )}
                        </button>
                      </>
                    )}
                  </div>

                  {error && <div className="error-message-modal">❌ {error}</div>}
                </>
              ) : (
                /* Show results */
                <div className="results-modal-view">
                  <div className="results-grid-modal">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="result-card-modal"
                        onClick={() => {
                          if (!result.error) {
                            setSelectedResult(result);
                            setShowModal(true);
                            setShowUploadModal(false);
                          }
                        }}
                      >
                        <div className="result-image-wrapper">
                          <img src={result.preview} alt={result.fileName} />
                        </div>
                        <div className="result-info">
                          {result.error ? (
                            <div className="result-error">
                              <span className="error-badge">❌ Failed</span>
                              <p className="error-text">{result.error}</p>
                            </div>
                          ) : (
                            <>
                              <h4 className="result-name">
                                {result.plant || result.prediction || 'Unknown'}
                              </h4>

                              <div className="result-confidence">
                                <span className="confidence-label">Accuracy:</span>
                                <span className={`confidence-value confidence-${getConfidenceLevel(result.confidence || 0)}`}>
                                  {((result.confidence || 0) * 100).toFixed(1)}%
                                </span>
                              </div>

                              <button className="view-details-btn">View Details →</button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="results-actions">
                    <button
                      className="upload-another-btn"
                      onClick={() => {
                        setResults([]);
                        setSelectedFiles([]);
                        setPreviews([]);
                      }}
                    >
                      Upload Another
                    </button>
                    <button
                      className="done-btn"
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

      <div className="content-wrapper">
        <button className="back-button-recognize" onClick={() => navigate("/")}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title-PR">Plant Recognition & Classification</h1>
        <p className="page-description-PR">
          Upload multiple plant images or capture them directly to get instant AI-powered
          identification with detailed information
        </p>

        <div className="tab-container">
          <button
            className={`tab-button active`}
            onClick={() => navigate('/recognize')}
          >
            Plant Recognition
          </button>
          <button
            className={`tab-button`}
            onClick={() => navigate('/diseaseRecognition')}
          >
            Disease Detect
          </button>
        </div>

        <div className="upload-card" onClick={() => setShowUploadModal(true)} style={{ cursor: 'pointer' }}>
          <div className="upload-icon-wrapper">
            <Upload size={48} />
          </div>
          <h2 className="upload-title">Upload From Devices</h2>
          <p className="upload-subtitle">Select an images from your gallery</p>
          <button className="choose-file-btn" onClick={(e) => {
            e.stopPropagation();
            setShowUploadModal(true);
          }}>
            Choose Files
          </button>
        </div>

      </div>

      <div className="tips-section">
        <h3 className="tips-title">📸 Photography Tips for Better Results</h3>
        <ul className="tips-list">
          <li>• Capture clear, well-lit images</li>
          <li>• Include leaves, flowers, and stems when possible</li>
          <li>• Take multiple angles for better accuracy</li>
          <li>• Avoid blurry or dark images</li>
          <li>• Focus on distinctive plant features</li>
        </ul>
      </div>

      <Footer />
    </div>
  );

}