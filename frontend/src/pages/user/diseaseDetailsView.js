import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bookmark, AlertTriangle, Info, Droplet, Leaf } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import "../css/user/diseaseDetailsView.css";
import Header from '../../components/header';
import Footer from '../../components/footer';
import { API_BASE_URL } from '../../config/apiConfig';

export default function DiseaseDetailView() {
  const { diseaseId } = useParams(); // Get disease ID from URL
  const navigate = useNavigate();
  const [disease, setDisease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const getToken = () => sessionStorage.getItem("userToken");

  useEffect(() => {
    fetchDiseaseDetails();
    checkBookmarkStatus(diseaseId);
  }, [diseaseId]);

  const fetchDiseaseDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/diseases/${diseaseId}`);
      const result = await response.json();

      if (result.success) {
        const diseaseData = result.disease;

        // ⭐ ADD: Process image URL like plant details
        const imageUrl = diseaseData.imageUrl
          ? `${API_BASE_URL}${diseaseData.imageUrl}`
          : `${API_BASE_URL}/images/diseases/default-disease.jpg`;

        setDisease({
          ...diseaseData,
          imageUrl: imageUrl
        });
      }
    } catch (error) {
      console.error('Error fetching disease details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async (id) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/bookmarks/check?itemType=disease&itemId=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      setIsBookmarked(Boolean(data.isBookmarked));
    } catch (err) {
      console.error("Error checking disease bookmark status:", err);
    }
  };

  const toggleBookmark = async () => {
    const token = getToken();
    if (!token) {
      alert("Please log in to bookmark diseases");
      navigate("/login");
      return;
    }

    setBookmarkLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks/toggle`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemType: "disease",
          itemId: Number(diseaseId),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Toggle disease bookmark failed:", res.status, text);
        alert("Error updating bookmark");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setIsBookmarked(Boolean(data.bookmarked));

      } else {
        alert(data.message || "Error updating bookmark");
      }
    } catch (err) {
      console.error("Disease bookmark error:", err);
      alert("Error updating bookmark");
    } finally {
      setBookmarkLoading(false);
    }
  };



  if (loading) {
    return <div className="loading">Loading disease details...</div>;
  }

  if (!disease) {
    return <div className="error">Disease not found</div>;
  }

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low': return '#22c55e';
      case 'moderate': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="page-container-ddv">
      <Header />
      <div className="content-wrapper-ddv">
        <button className="back-button-ddv" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>

        {/* Hero Section */}
        <div className="hero-section-ddv">
          <img
            src={disease.imageUrl}
            alt={disease.name}
            className="hero-image-ddv"
          />
          <div className="hero-overlay">
            <h1 className="disease-title">{disease.name}</h1>
            <div className="severity-badge-ddp" style={{ background: getSeverityColor(disease.severity) }}>
              <AlertTriangle size={16} />
              {disease.severity} Severity
            </div>
            {/* ⭐ ADD: Show pathogen name if available */}
            {disease.pathogenName && (
              <p className="pathogen-name">Caused by: {disease.pathogenName}</p>
            )}
          </div>
          
          <button
            className={`bookmark-btn-ddv ${isBookmarked ? "bookmarked" : ""}`}
            onClick={toggleBookmark}
            disabled={bookmarkLoading}
            title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            <Bookmark
              size={20}
              fill={isBookmarked ? "currentColor" : "none"}
              color={isBookmarked ? "#ffc107" : "#6b7280"}
            />
            {bookmarkLoading && <span className="bookmark-loading">...</span>}
          </button>

        </div>

        {/* Basic Information */}
        <div className="card">
          <h2 className="card-title-ddv">Basic Information</h2>

          <div className="info-label">Common Names</div>
          <div className="tags-container">
            {disease.commonNames?.split(',').map((name, index) => (
              <span key={index} className="tag-ddv">{name.trim()}</span>
            ))}
          </div>

          <div className="info-label">Category</div>
          <p className="info-text">{disease.category}</p>

          <div className="info-label">Affected Plants</div>
          <p className="info-text">{disease.affectedPlants}</p>

          <div className="info-label">Characteristics</div>
          <p className="info-text">{disease.characteristics}</p>
        </div>

        {/* Symptoms */}
        <div className="card">
          <h2 className="card-title-ddv">Symptoms & Identification</h2>
          <ul className="characteristics-list-ddv">
            {disease.symptoms?.split('.').filter(s => s.trim()).map((symptom, index) => (
              <li key={index}>
                <span className="char-value">{symptom.trim()}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Grid Section */}
        <div className="grid-2-ddv">
          {/* Causes & Spread */}
          <div className="card">
            <h2 className="card-title-ddv">Causes & Spread</h2>

            {/* ⭐ CHANGE: Use PathogenName instead of cause */}
            {disease.pathogenName && (
              <div className="info-section">
                <div className="info-label">
                  <Info size={18} />
                  Pathogen
                </div>
                <p className="info-text">{disease.pathogenName}</p>
              </div>
            )}

            {/* ⭐ ADD: Scientific Classification */}
            {(disease.genus || disease.species || disease.class) && (
              <div className="info-section">
                <div className="info-label">
                  <Leaf size={18} />
                  Scientific Classification
                </div>
                <div className="classification-info">
                  {disease.genus && <p><strong>Genus:</strong> {disease.genus}</p>}
                  {disease.species && <p><strong>Species:</strong> {disease.species}</p>}
                  {disease.class && <p><strong>Class:</strong> {disease.class}</p>}
                </div>
              </div>
            )}

            {/* ⭐ CHANGE: Use GrowthConditions instead of favorableConditions */}
            <div className="info-section">
              <div className="info-label">
                <Droplet size={18} />
                Favorable Conditions
              </div>
              <p className="info-text">{disease.growthConditions}</p>
            </div>
          </div>

          {/* Prevention - NO CHANGES (uses prevention column) */}
          <div className="card">
            <h2 className="card-title-ddv">Prevention Measures</h2>
            <div className="use-list">
              {disease.prevention?.split('.').filter(p => p.trim()).map((measure, index) => (
                <div key={index} className="use-item">{measure.trim()}</div>
              ))}
            </div>
          </div>

        </div>

        <div className="grid-2">
          {/* Treatment Options - NO CHANGES (uses treatment column) */}
          <div className="card">
            <h2 className="card-title-ddv">Treatment Options</h2>
            <div className="tips-list-ddv">
              {disease.treatment?.split('.').filter(t => t.trim()).map((treatment, index) => (
                <div key={index} className="tip-item">
                  <strong>Step {index + 1}:</strong> {treatment.trim()}
                </div>
              ))}
            </div>
          </div>


          {/* Symptoms */}
          <div className="card">
            <h2 className="card-title-ddv">Detailed Symptoms</h2>
            <div className="symptoms-detail">
              {disease.symptoms?.split('.').filter(s => s.trim()).map((symptom, index) => (
                <div key={index} className="symptom-item">
                  <div className="symptom-icon">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="symptom-text">{symptom.trim()}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Additional Information */}
        <div className="card">
          <h2 className="card-title-ddv">Additional Information</h2>
          <div className="info-grid">
            <div className="info-block">
              <div className="info-label">Disease Type</div>
              <p className="info-text">{disease.category}</p>
            </div>
            <div className="info-block">
              <div className="info-label">Severity Level</div>
              <p className="info-text">{disease.severity}</p>
            </div>

          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}