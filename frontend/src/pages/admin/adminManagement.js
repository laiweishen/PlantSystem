import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, UserPlus, Edit, Trash2, BarChart3, Users, TrendingUp, Ban, BookOpen, FileText } from 'lucide-react';
import '../css/admin/adminManagement.css';
import Header from '../../components/header';
import { API_BASE_URL } from '../../config/apiConfig';
import Modal from '../../components/modal';
import AddUserForm from '../../components/admin/AddUserForm';
import EditUserForm from '../../components/admin/EditUserForm';
import PasswordConfirmModal from '../../components/admin/PasswordConfirmModal';

export default function AdminUserManagement() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    //for password confirmation
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = sessionStorage.getItem('userToken');
            if (!token) {
                alert('Please log in first');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                alert('Unauthorized: Admin access required');
                return;
            }

            if (response.status === 403) {
                alert('Forbidden: You need admin privileges');
                return;
            }

            const result = await response.json();

            if (result.success) {
                setUsers(result.users);
            } else {
                alert('Failed to fetch users: ' + result.message);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Error fetching users');
        } finally {
            setLoading(false);
        }
    };


    // Handle deactivating a user
    const handleDeactivateUser = async (userId) => {
        const user = users.find(u => u.id === userId);
        const isCurrentlyActive = user.status === 'Active';

        const action = isCurrentlyActive ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('userToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: isCurrentlyActive ? 'Inactive' : 'Active'
                })
            });

            if (response.ok) {
                const result = await response.json();
                setUsers(users.map(user =>
                    user.id === userId
                        ? { ...user, status: isCurrentlyActive ? 'Inactive' : 'Active' }
                        : user
                ));
                alert(`User ${action}d successfully`);
            } else {
                alert(`Failed to ${action} user`);
            }
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            alert(`Failed to ${action} user`);
        }
    };

    // Handle permanently deleting a user
    const handleDeleteUser = (userId) => {
        setPendingAction({ type: 'delete', userId });
        setShowPasswordModal(true);
    };

    const executeDeleteUser = async () => {
        if (!pendingAction) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${pendingAction.userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('userToken')}`
                }
            });

            if (response.ok) {
                setUsers(users.filter(user => user.id !== pendingAction.userId));
                alert('User permanently deleted');
            } else {
                alert('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        } finally {
            setPendingAction(null);
        }
    };



    //Handle successful user creation
    const handleUserCreated = (newUser) => {
        setUsers([...users, newUser]);  // Add new user to list
        setIsModalOpen(false);  // Close modal
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    // Handle successful user update
    const handleUserUpdated = (updatedUser) => {
        setUsers(users.map(user =>
            user.id === updatedUser.id ? updatedUser : user
        ));
        setIsEditModalOpen(false);
        setSelectedUser(null);
    };

    const filteredUsers = users.filter(user => {
        const roleLower = (user.role || '').toLowerCase();

        if (roleLower === 'admin') return false;

        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role.toLowerCase() === filterRole.toLowerCase();
        return matchesSearch && matchesRole;
    });

    const formatLastActivity = (dateString) => {
        
        if (!dateString) return 'Never';
        const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(utcDateString);

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;

        return `${Math.floor(diffDays / 365)}y ago`;
    };

    return (
        <div className="admin-container">

            <Header />
            
            <PasswordConfirmModal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false);
                    setPendingAction(null);
                }}
                onConfirm={executeDeleteUser}
                action="permanently delete"
            />

            <div className="content-wrapper-adminManagement">

                {/* Tabs Navigation */}
                <div className="tabs-container">
                    <button
                        className={`tab-button-am ${location.pathname === '/admin/overview' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/overview')}
                    >
                        <BarChart3 size={20} />
                        Overview
                    </button>
                    <button
                        className={`tab-button-am ${location.pathname === '/admin/users' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/users')}
                    >
                        <Users size={20} />
                        User Management
                    </button>
                    <button
                        className={`tab-button-am ${location.pathname === '/admin/analysis' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/analysis')}
                    >
                        <TrendingUp size={20} />
                        Analytics
                    </button>
                    <button
                        className={`tab-button-am ${location.pathname === '/admin/quizManagement' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/quizManagement')}
                    >
                        <BookOpen size={20} />
                        Quiz Management
                    </button>
                    <button
                        className={`tab-button-am ${location.pathname === '/teacher/materials' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/materials')}
                    >
                        <FileText size={20} />
                        Learning Materials
                    </button>
                </div>

                {/* Page Header */}
                <div className="page-header-adminManagement">
                    <h1 className="page-title-adminManagement">User Management</h1>
                    <p className="page-subtitle-adminManagement">Manage all user here</p>

                    <div className="controls-row">
                        {/* Search */}
                        <div className="search-container">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter */}
                        <div className="filter-select">
                            <select
                                className="select-button"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                <option value="all">All Users</option>
                                <option value="student">Students</option>
                                <option value="teacher">Teachers</option>
                                <option value="researcher">Researchers</option>
                                <option value="enthusiast">Enthusiasts</option>
                            </select>
                        </div>

                        {/* Add User Button */}
                        <button
                            className="add-user-btn"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <UserPlus size={20} />
                            Add Users
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="users-table-container">
                    {loading ? (
                        <div className="loading">Loading users...</div>
                    ) : (
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>USER</th>
                                    <th>ROLES</th>
                                    <th>LAST ACTIVITY</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="user-info">
                                                    <span className="user-name">{user.name}</span>
                                                    <span className="user-email">{user.email}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="role-badge">{user.role}</span>
                                            </td>

                                            <td>{formatLastActivity(user.lastActivity)}</td>

                                            <td>
                                                <span className={`status-badge ${user.status === 'Active' ? '' : 'inactive'}`}>
                                                    {user.status || 'Active'}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="actions-cell">
                                                    <button
                                                        className="action-btn edit"
                                                        title="Edit"
                                                        onClick={() => handleEditClick(user)}
                                                    >
                                                        <Edit size={18} color="#22c55e" />
                                                    </button>

                                                    <button
                                                        className={`action-btn ${user.status === 'Active' ? 'deactivate' : 'activate'}`}
                                                        title={user.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                        onClick={() => handleDeactivateUser(user.id)}
                                                    >
                                                        <Ban size={18} color={user.status === 'Active' ? '#f59e0b' : '#22c55e'} />
                                                    </button>

                                                    <button
                                                        className="action-btn delete"
                                                        title="Permanently Delete"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        <Trash2 size={18} color="#ef4444" />
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ⭐ Add User Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New User"
            >
                <AddUserForm
                    onSuccess={handleUserCreated}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
            {/* Edit User Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                }}
                title="Edit User"
            >
                <EditUserForm
                    user={selectedUser}
                    onSuccess={handleUserUpdated}
                    onCancel={() => {
                        setIsEditModalOpen(false);
                        setSelectedUser(null);
                    }}
                />
            </Modal>
        </div>
    );
}