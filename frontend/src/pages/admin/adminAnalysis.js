// AdminAnalysis.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Users, TrendingUp, BookOpen, FileText, Clock, Target, Download, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../css/admin/adminAnalysis.css';
import Header from '../../components/header';
import { API_BASE_URL } from '../../config/apiConfig';
import html2pdf from 'html2pdf.js';

export default function AdminAnalysis() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);

    const [analyticsData, setAnalyticsData] = useState({
        completionRate: null,
        averageStudyTime: null,
        subjectPerformance: [],
        studentEngagement: []   // Will be filled after calculating/grouping users
    });


    useEffect(() => {
        const fetchAllAnalytics = async () => {
            try {
                const token = sessionStorage.getItem('userToken');
                if (!token) return;

                // Fetch from separate endpoints
                const [userStatsRes, completionRes, avgScoreRes, subjectRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/adminanalytics/user-stats`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/api/adminanalytics/quiz-completion-rate`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/api/adminanalytics/average-score`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/api/adminanalytics/subject-performance`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                const userStats = await userStatsRes.json();
                const completionObj = await completionRes.json();
                const avgScoreObj = await avgScoreRes.json();
                const subjectStats = await subjectRes.json();

                const baseSubjects = [
                    { key: 'plant', label: 'Plant' },
                    { key: 'disease', label: 'Disease' },
                    { key: 'mixed', label: 'Mixed Quiz' }
                ];

                const subjectPerformance = baseSubjects.map(base => {
                    const found = subjectStats.find(
                        s => s.quizType.trim().toLowerCase() === base.key
                    );
                    return {
                        subject: base.label,
                        percentage: found ? Math.round(found.avgScore) : 0
                    };
                });

                setAnalyticsData({
                    completionRate: completionObj.completionRate || '--',
                    averageScore: avgScoreObj.averageScore || '--',
                    subjectPerformance,
                    studentEngagement: userStats.userRoles
                        .filter(role => role.role !== 'Admin')
                        .map(role => ({
                            level: role.role,
                            description: '',
                            count: role.count,
                            color: '#22c55e'
                        }))
                });


            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllAnalytics();
    }, []);

    const openPreview = () => {
        setShowPreview(true);
    };

    const downloadPDF = () => {
        const element = document.getElementById('pdf-content');
        const options = {
            margin: [15, 15, 15, 15],
            filename: `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            }
        };

        html2pdf().set(options).from(element).save();
        setShowPreview(false);
    };

    return (
        <div className="admin-container">
            <Header />
            <div className="content-wrapper-aa">
                {/* Tabs Navigation */}
                <div className="tabs-container-aa">
                    <button
                        className={`tab-button-aa ${location.pathname === '/admin/overview' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/overview')}
                    >
                        <BarChart3 size={20} />
                        Overview
                    </button>
                    <button
                        className={`tab-button-aa ${location.pathname === '/admin/users' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/users')}
                    >
                        <Users size={20} />
                        User Management
                    </button>
                    <button
                        className={`tab-button-aa ${location.pathname === '/admin/analysis' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/analysis')}
                    >
                        <TrendingUp size={20} />
                        Analytics
                    </button>
                    <button
                        className={`tab-button-aa ${location.pathname === '/admin/quizManagement' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/quizManagement')}
                    >
                        <BookOpen size={20} />
                        Quiz Management
                    </button>
                    <button
                        className={`tab-button-aa ${location.pathname === '/admin/materials' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/materials')}
                    >
                        <FileText size={20} />
                        Learning Materials
                    </button>
                </div>

                {loading ? (
                    <div className="aa-loading">Loading analytics data...</div>
                ) : (
                    <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h1 className="aa-page-title" style={{ margin: 0 }}>Learning Analytics</h1>
                                <button onClick={openPreview} className="aa-export-btn">
                                    <FileText size={18} />
                                    Export PDF
                                </button>
                            </div>

                            {showPreview && (
    <div className="aa-pdf-modal-overlay" onClick={() => setShowPreview(false)}>
        <div className="aa-pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aa-pdf-modal-header">
                <h2>PDF Preview</h2>
                <button className="aa-pdf-close-btn" onClick={() => setShowPreview(false)}>
                    <X size={24} />
                </button>
            </div>
            
            <div className="aa-pdf-preview-scroll">
                <div id="pdf-content" className="aa-pdf-content">
                    {/* PDF Header */}
                    <div className="aa-pdf-header">
                        <h1>Learning Analytics Report</h1>
                        <p className="aa-pdf-date">Generated on {new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</p>
                    </div>

                    {/* Metrics Section */}
                    <div className="aa-pdf-section">
                        <h2 className="aa-pdf-section-title">Key Metrics</h2>
                        <div className="aa-pdf-metrics">
                            <div className="aa-pdf-metric-item">
                                <div className="aa-pdf-metric-label">Quiz Completion Rate</div>
                                <div className="aa-pdf-metric-value">{analyticsData.completionRate}%</div>
                                <div className="aa-pdf-metric-desc">Percentage of started quizzes that students finish</div>
                            </div>
                            <div className="aa-pdf-metric-item">
                                <div className="aa-pdf-metric-label">Average Score</div>
                                <div className="aa-pdf-metric-value">{analyticsData.averageScore}</div>
                                <div className="aa-pdf-metric-desc">Average quiz score across all completed attempts</div>
                            </div>
                        </div>
                    </div>

                    {/* Subject Performance */}
                    <div className="aa-pdf-section">
                        <h2 className="aa-pdf-section-title">Subject Performance</h2>
                        <p className="aa-pdf-section-desc">Average quiz score by topic (as percentage)</p>
                        <table className="aa-pdf-table">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Average Score</th>
                                    <th>Performance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyticsData.subjectPerformance.map((subject, index) => (
                                    <tr key={index}>
                                        <td>{subject.subject}</td>
                                        <td className="aa-pdf-percentage">{subject.percentage}%</td>
                                        <td>
                                            <div className="aa-pdf-progress-bar">
                                                <div 
                                                    className="aa-pdf-progress-fill"
                                                    style={{ width: `${subject.percentage}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Student Engagement */}
                    <div className="aa-pdf-section">
                        <h2 className="aa-pdf-section-title">Student Engagement</h2>
                        <table className="aa-pdf-table">
                            <thead>
                                <tr>
                                    <th>Role</th>
                                    <th>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyticsData.studentEngagement.map((engagement, index) => (
                                    <tr key={index}>
                                        <td>
                                            <strong>{engagement.level}</strong>
                                            {engagement.description && (
                                                <div className="aa-pdf-eng-desc">{engagement.description}</div>
                                            )}
                                        </td>
                                        <td className="aa-pdf-eng-count">{engagement.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="aa-pdf-footer">
                        <p>© {new Date().getFullYear()} Learning Management System - Analytics Report</p>
                    </div>
                </div>
            </div>

            <div className="aa-pdf-modal-actions">
                <button onClick={() => setShowPreview(false)} className="aa-pdf-btn-cancel">
                    Cancel
                </button>
                <button onClick={downloadPDF} className="aa-pdf-btn-download">
                    <Download size={18} />
                    Download PDF
                </button>
            </div>
        </div>
    </div>
)}

                        {/* Top Metrics */}
                        <div className="aa-metrics-grid">
                            <div className="aa-metric-card aa-metric-blue">
                                <div className="aa-metric-icon">
                                    <Target size={24} />
                                </div>
                                <div className="aa-metric-content">
                                    <div className="aa-metric-label">Quiz Completion Rate</div>
                                    <div className="aa-metric-value">{analyticsData.completionRate}%</div>
                                    <div className="aa-metric-hint">
                                        Percentage of started quizzes that students finish.
                                    </div>
                                </div>
                            </div>

                            <div className="aa-metric-card aa-metric-green">
                                <div className="aa-metric-icon">
                                    <Clock size={24} />
                                </div>
                                <div className="aa-metric-content">
                                    <div className="aa-metric-label">Average Score</div>
                                    <div className="aa-metric-value">{analyticsData.averageScore}</div>
                                    <div className="aa-metric-hint">
                                        Average quiz score across all completed attempts.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="aa-charts-grid">
                            {/* Subject Performance */}
                            <div className="aa-chart-card">
                                <h2 className="aa-chart-title">Subject Performance</h2>
                                <p className="aa-chart-subtitle">
                                    Average quiz score by topic (as percentage).
                                </p>

                                <div style={{ width: '100%', height: 260 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={analyticsData.subjectPerformance}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="subject" />
                                            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                            <Tooltip formatter={(v) => `${v}%`} />
                                            <Bar dataKey="percentage" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>


                            {/* Student Engagement */}
                            <div className="aa-chart-card">
                                <h2 className="aa-chart-title">Student Engagement</h2>
                                <div className="aa-engagement-list">
                                    {analyticsData.studentEngagement.map((engagement, index) => (
                                        <div key={index} className="aa-engagement-item">
                                            <div
                                                className="aa-engagement-bar"
                                                style={{
                                                    backgroundColor: `${engagement.color}20`,
                                                    borderLeft: `4px solid ${engagement.color}`
                                                }}
                                            >
                                                <div className="aa-engagement-info">
                                                    <div className="aa-engagement-level">{engagement.level}</div>
                                                    <div className="aa-engagement-description">{engagement.description || ''}</div>
                                                </div>
                                                <div
                                                    className="aa-engagement-count"
                                                    style={{ color: engagement.color }}
                                                >
                                                    {engagement.count}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}