import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Users, TrendingUp, UserCheck, BookOpen, FileText, X} from 'lucide-react';
import '../css/admin/adminOverview.css';
import Header from '../../components/header';
import { API_BASE_URL } from '../../config/apiConfig';

export default function AdminOverview() {
    const navigate = useNavigate();
    const location = useLocation();
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [allActivities, setAllActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(false);

    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalQuizzes: 0
    });

    const [userDistribution, setUserDistribution] = useState({
        students: 0,
        researchers: 0,
        enthusiasts: 0,
        teachers: 0,
        farmers: 0
    });


    useEffect(() => {
        fetchOverviewData();
    }, []);

    const fetchOverviewData = async () => {
        try {
            const token = sessionStorage.getItem('userToken');
            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/admin/overview`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            console.log('Full API Response:', result);

            if (result.success && result.data) {
                setStats({
                    totalUsers: result.data.totalUsers || 0,
                    activeUsers: result.data.activeUsers || 0,
                    totalQuizzes: result.data.totalQuizzes || 0
                });
                setUserDistribution({
                    students: result.data.studentCount || 0,
                    researchers: result.data.researcherCount || 0,
                    enthusiasts: result.data.enthusiastCount || 0,
                    teachers: result.data.teacherCount || 0,
                    farmers: result.data.farmerCount || 0
                });
                setRecentActivities(result.data.recentActivities || []);
            } else {
                console.error('API returned error:', result.message);
            }
        } catch (error) {
            console.error('Error fetching overview data:', error);

        } finally {
            setLoading(false);
        }
    };

    const totalRoleUsers =
        (userDistribution.students || 0) +
        (userDistribution.researchers || 0) +
        (userDistribution.enthusiasts || 0) +
        (userDistribution.teachers || 0) +
        (userDistribution.farmers || 0);

    const s = userDistribution.students || 0;
    const r = userDistribution.researchers || 0;
    const e = userDistribution.enthusiasts || 0;
    const t = userDistribution.teachers || 0;
    const f = userDistribution.farmers || 0;

    const total = Math.max(totalRoleUsers, 1);

    const angleS = (s / total) * 360;
    const angleR = (r / total) * 360;
    const angleE = (e / total) * 360;
    const angleT = (t / total) * 360;
    const angleF = (f / total) * 360;

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(utcDateString);

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const actualDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        if (diffMins < 1) return `${actualDate} - Just now`;
        if (diffMins < 60) return `${actualDate} - ${diffMins} min ago`;
        if (diffHours < 24) return `${actualDate} - ${diffHours} h ago`;
        if (diffDays < 7) return `${actualDate} - ${diffDays} d ago`;
        if (diffDays < 30) return `${actualDate} - ${Math.floor(diffDays / 7)} w ago`;
        if (diffDays < 365) return `${actualDate} - ${Math.floor(diffDays / 30)} mo ago`;

        return `${actualDate} - ${Math.floor(diffDays / 365)}y ago`;
    };

    const openActivityModal = async () => {
        setShowActivityModal(true);
        setLoadingActivities(true);

        try {
            const token = sessionStorage.getItem('userToken');
            const res = await fetch(`${API_BASE_URL}/api/admin/activities`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                // format time here if you want
                setAllActivities(
                    (data.activities || []).map(a => ({
                        ...a,
                        time: new Date(a.time).toLocaleString()
                    }))
                );
            }
        } catch (e) {
            console.error('Error loading activities', e);
        } finally {
            setLoadingActivities(false);
        }
    };


    return (
        <div className="admin-container">
            <Header />
            <div className="content-wrapper-ao">
                {/* Tabs Navigation */}
                <div className="tabs-container">
                    <button
                        className={`tab-button-ov ${location.pathname === '/admin/overview' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/overview')}
                    >
                        <BarChart3 size={20} />
                        Overview
                    </button>
                    <button
                        className={`tab-button-ov ${location.pathname === '/admin/users' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/users')}
                    >
                        <Users size={20} />
                        User Management
                    </button>
                    <button
                        className={`tab-button-ov ${location.pathname === '/admin/analysis' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/analysis')}
                    >
                        <TrendingUp size={20} />
                        Analytics
                    </button>
                    <button
                        className={`tab-button-ov ${location.pathname === '/admin/quizManagement' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/quizManagement')}
                    >
                        <BookOpen size={20} />
                        Quiz Management
                    </button>
                    <button
                        className={`tab-button-ov ${location.pathname === '/teacher/materials' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/materials')}
                    >
                        <FileText size={20} />
                        Learning Materials
                    </button>
                </div>

                {loading ? (
                    <div className="loading">Loading overview data...</div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="stats-grid-ao">

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <Users size={32} color="#6b7280" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Total Users</div>
                                    <div className="stat-value">{stats.totalUsers}</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <UserCheck size={32} color="#6b7280" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Active Users</div>
                                    <div className="stat-value">{stats.activeUsers}</div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <BookOpen size={32} color="#6b7280" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Total Quiz Type</div>
                                    <div className="stat-value">{stats.totalQuizzes || 100}</div>
                                </div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="content-grid">
                            {/* User Distribution */}
                            <div className="card">
                                <div className="card-header">
                                    <h2 className="card-title">User Distribution</h2>

                                </div>

                                <div className="chart-container">

                                    <div className="donut-chart">
                                        <div
                                            className="donut-ring"
                                            style={{
                                                background: `conic-gradient(
                                                        #93c5fd 0deg,
                                                        #93c5fd ${angleS}deg,
                                                        #a5b4fc ${angleS}deg,
                                                        #a5b4fc ${angleS + angleR}deg,
                                                        #fbbf24 ${angleS + angleR}deg,
                                                        #fbbf24 ${angleS + angleR + angleE}deg,
                                                        #fecaca ${angleS + angleR + angleE}deg,
                                                        #fecaca ${angleS + angleR + angleE + angleT}deg,
                                                        #bbf7d0 ${angleS + angleR + angleE + angleT}deg,
                                                        #bbf7d0 360deg
                                                    )`
                                            }}
                                        >
                                            <div className="donut-hole">
                                                <div className="donut-value">{totalRoleUsers}</div>
                                                <div className="donut-label">Total Users</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="legend">
                                        <div className="legend-item">
                                            <div className="legend-color" style={{ backgroundColor: '#93c5fd' }}></div>
                                            <div className="legend-number">{userDistribution.students}</div>
                                            <div className="legend-info">
                                                <div className="legend-label">Students</div>
                                            </div>
                                        </div>

                                        <div className="legend-item">
                                            <div className="legend-color" style={{ backgroundColor: '#a5b4fc' }}></div>
                                            <div className="legend-number">{userDistribution.researchers}</div>
                                            <div className="legend-info">
                                                <div className="legend-label">Researchers</div>
                                            </div>
                                        </div>

                                        <div className="legend-item">
                                            <div className="legend-color" style={{ backgroundColor: '#fbbf24' }}></div>
                                            <div className="legend-number">{userDistribution.enthusiasts}</div>
                                            <div className="legend-info">
                                                <div className="legend-label">Nature Enthusiasts</div>
                                            </div>
                                        </div>

                                        <div className="legend-item">
                                            <div className="legend-color" style={{ backgroundColor: '#fecaca' }}></div>
                                            <div className="legend-number">{userDistribution.teachers}</div>
                                            <div className="legend-info">
                                                <div className="legend-label">Teachers</div>
                                            </div>
                                        </div>

                                        <div className="legend-item">
                                            <div className="legend-color" style={{ backgroundColor: '#bbf7d0' }}></div>
                                            <div className="legend-number">{userDistribution.farmers}</div>
                                            <div className="legend-info">
                                                <div className="legend-label">Farmers</div>
                                            </div>
                                        </div>
                                    </div>



                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="card">
                                <div className="card-header">
                                    <h2 className="card-title">Recent Activity</h2>
                                    <button className="view-all-link" onClick={openActivityModal}>
                                        View All
                                    </button>
                                </div>

                                <div className="activity-list">
                                    {recentActivities.length > 0 ? (
                                        recentActivities.map((activity, index) => (
                                            <div key={index} className="activity-item">
                                                <div className="activity-title">{activity.title}</div>
                                                <div className="activity-meta">
                                                    <span className="activity-author">by {activity.author}</span>
                                                    <span className="activity-time">{formatDate(activity.time)}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div className="activity-item">
                                                <div className="activity-title">No recent activity yet</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {showActivityModal && (
                <div className="modal-overlay" onClick={() => setShowActivityModal(false)}>
                    <div
                        className="modal-content-activities"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>Recent Activity</h2>
                            <button
                                className="modal-close-btn"
                                onClick={() => setShowActivityModal(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>


                        <div className="modal-body-activities">
                            {loadingActivities ? (
                                <div>Loading...</div>
                            ) : allActivities.length === 0 ? (
                                <div>No recent activity yet.</div>
                            ) : (
                                <div className="activity-scroll-list">
                                    {allActivities.map((activity, idx) => (
                                        <div key={idx} className="activity-item">
                                            <div className="activity-title">{activity.title}</div>
                                            <div className="activity-meta">
                                                <span className="activity-author">by {activity.author}</span>
                                                <span className="activity-time">{activity.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>


    );
}