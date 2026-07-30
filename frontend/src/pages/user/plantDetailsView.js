import { useState, useEffect } from 'react';
import { ArrowLeft, Bookmark, Sun, Droplet, Thermometer } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import "../css/user/plantDetailsView.css";
import Header from '../../components/header';
import Footer from '../../components/footer';
import { API_BASE_URL } from '../../config/apiConfig';

export default function PlantDetailView() {
  const { plantId } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    fetchPlantDetails();
  }, [plantId]);

  const fetchPlantDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/plants/${plantId}`);

      if (!response.ok) {
        console.warn('Plant details failed:', response.status);
        return;
      }

      const result = await response.json();

      if (result.success) {
        const plantData = result.plant;
        const imageUrl = plantData.imageUrl
          ? `${API_BASE_URL}${plantData.imageUrl}`
          : `${API_BASE_URL}/images/plants/default-plant.png`;

        setPlant({ ...plantData, imageUrl });
        await checkBookmarkStatus(plantId);
      }
    } catch (error) {
      console.error('Error fetching plant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async (id) => {
    try {
      const token = sessionStorage.getItem("userToken");

      if (!token) return; // User not logged in

      const res = await fetch(
        `${API_BASE_URL}/api/bookmarks/check?itemType=plant&itemId=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.warn("Bookmark check failed:", res.status);
        return;
      }

      const data = await res.json();
      setIsBookmarked(Boolean(data.isBookmarked));
    } catch (err) {
      console.error("Error checking bookmark status:", err);
    }
  }

  const toggleBookmark = async () => {
    const token = sessionStorage.getItem("userToken");

    if (!token) {
      alert("Please log in to bookmark plants");
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
          itemType: "plant",
          itemId: Number(plantId),
        }),
      });

      if (!res.ok) {
        const text = await res.text(); // Debug only
        console.error("Toggle failed:", res.status, text);
        alert("Error updating bookmark");
        return;
      }

      const data = await res.json();
      console.log("Toggle bookmark response:", res.status, data);

      if (data.success) {
        setIsBookmarked(Boolean(data.bookmarked));

      } else {
        alert(data.message || "Error updating bookmark");
      }
    } catch (error) {
      console.error("Bookmark error:", error);
      alert("Error updating bookmark");
    } finally {
      setBookmarkLoading(false);
    }
  };


  if (loading) {
    return <div className="plant-detail-loading">Loading plant details...</div>;
  }

  if (!plant) {
    return <div className="plant-detail-error">Plant not found</div>;
  }

  return (
    <div className="plant-detail-page">
      <Header />
      <div className="plant-detail-container">
        <button className="plant-detail-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>

        {/* Hero Section */}
        <div className="plant-detail-hero">
          <img
            src={plant.imageUrl}
            alt={plant.name}
            className="plant-detail-hero-img"
          />
          <div className="plant-detail-hero-overlay">
            <h1 className="plant-detail-hero-title">{plant.name}</h1>
            <p className="plant-detail-hero-subtitle">{plant.category}</p>
          </div>

          <button
            className={`plant-detail-bookmark ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={toggleBookmark}
            disabled={bookmarkLoading}
            title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
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
        <div className="plant-detail-card">
          <h2 className="plant-detail-card-title">Basic Information</h2>

          <div className="plant-detail-info-label">Common Name</div>
          <div className="plant-detail-tags">
            {plant.commonNames?.split(',').map((name, index) => (
              <span key={index} className="plant-detail-tag">{name.trim()}</span>
            ))}
          </div>

          <div className="plant-detail-info-label">Habitat</div>
          <p className="plant-detail-info-text">{plant.habitat}</p>
        </div>

        {/* Characteristics */}
        <div className="plant-detail-card">
          <h2 className="plant-detail-card-title">Characteristics</h2>
          <ul className="plant-detail-char-list">
            <li className="plant-detail-char-item">
              <span className="plant-detail-char-label">Height</span>
              <span className="plant-detail-char-value">{plant.height}</span>
            </li>
            <li className="plant-detail-char-item">
              <span className="plant-detail-char-label">Bloom Time</span>
              <span className="plant-detail-char-value">{plant.bloomTime}</span>
            </li>
            <li className="plant-detail-char-item">
              <span className="plant-detail-char-label">Flower Color</span>
              <span className="plant-detail-char-value">{plant.flowerColor}</span>
            </li>
            <li className="plant-detail-char-item">
              <span className="plant-detail-char-label">Fragrance</span>
              <span className="plant-detail-char-value">{plant.fragrance}</span>
            </li>
            <li className="plant-detail-char-item">
              <span className="plant-detail-char-label">Thorns</span>
              <span className="plant-detail-char-value">{plant.thorns}</span>
            </li>
          </ul>
        </div>

        {/* Grid Section */}
        <div className="plant-detail-grid">
          {/* Scientific Classification */}
          <div className="plant-detail-card">
            <h2 className="plant-detail-card-title">Scientific Classification</h2>
            <div className="plant-detail-classification">
              <div className="plant-detail-classification-item">
                <div className="plant-detail-classification-label">Family</div>
                <div className="plant-detail-classification-value">{plant.family}</div>
              </div>
              <div className="plant-detail-classification-item">
                <div className="plant-detail-classification-label">Class</div>
                <div className="plant-detail-classification-value">{plant.class}</div>
              </div>
              <div className="plant-detail-classification-item">
                <div className="plant-detail-classification-label">Species</div>
                <div className="plant-detail-classification-value">{plant.species}</div>
              </div>
              <div className="plant-detail-classification-item">
                <div className="plant-detail-classification-label">Genus</div>
                <div className="plant-detail-classification-value">{plant.genus}</div>
              </div>
            </div>
          </div>

          {/* Common Use */}
          <div className="plant-detail-card">
            <h2 className="plant-detail-card-title">Common Use</h2>
            <div className="plant-detail-use-list">
              {plant.commonUse?.split(',').map((use, index) => (
                <div key={index} className="plant-detail-use-item">{use.trim()}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Care Tips and Growth Conditions */}
        <div className="plant-detail-grid">
          {/* Care Tips */}
          <div className="plant-detail-card">
            <h2 className="plant-detail-card-title">Care Tips</h2>
            <div className="plant-detail-tips-list">
              {plant.careTips?.split('.').filter(tip => tip.trim()).map((tip, index) => (
                <div key={index} className="plant-detail-tip-item">{tip.trim()}</div>
              ))}
            </div>
          </div>

          {/* Growth Conditions */}
          <div className="plant-detail-card">
            <h2 className="plant-detail-card-title">Growth Conditions</h2>
            <div className="plant-detail-conditions">
              <div className="plant-detail-condition-item">
                <div className="plant-detail-condition-icon">
                  <Sun size={24} color="#f59e0b" />
                </div>
                <div className="plant-detail-condition-text">
                  <div className="plant-detail-condition-label">Full sun to partial shade</div>
                </div>
              </div>
              <div className="plant-detail-condition-item">
                <div className="plant-detail-condition-icon plant-detail-condition-icon-temp">
                  <Thermometer size={24} color="#ef4444" />
                </div>
                <div className="plant-detail-condition-text">
                  <div className="plant-detail-condition-label">15-25°C (59-77°F)</div>
                </div>
              </div>
              <div className="plant-detail-condition-item">
                <div className="plant-detail-condition-icon plant-detail-condition-icon-water">
                  <Droplet size={24} color="#3b82f6" />
                </div>
                <div className="plant-detail-condition-text">
                  <div className="plant-detail-condition-label">Moderate, well-drained soil</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}