import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import './AddUserForm.css'; // Reuse the same CSS
import { API_BASE_URL } from '../../config/apiConfig';

export default function EditUserForm({ user, onSuccess, onCancel }) {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'Student',
        status: user?.status || 'Active',
        password: '' // Optional - only if changing password
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                role: user.role || 'Student',
                status: user.status || 'Active',
                password: ''
            });
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email) {
            alert('Please fill in all required fields');
            return;
        }

        // If password is provided, validate it
        if (formData.password && formData.password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const token = sessionStorage.getItem('userToken');
            
            // Prepare update data (only send password if it's filled)
            const updateData = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                status: formData.status
            };

            // Only include password if user entered one
            if (formData.password) {
                updateData.password = formData.password;
            }

            const response = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            if (result.success) {
                alert('User updated successfully!');
                onSuccess(result.user); // Pass updated user back to parent
            } else {
                alert(result.message || 'Failed to update user!');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user! Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="add-user-form">
            {/* Name Input */}
            <div className="form-group-modal">
                <label className="form-label">Full Name *</label>
                <input
                    type="text"
                    name="name"
                    className="form-input-modal"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                />
            </div>

            {/* Email Input */}
            <div className="form-group-modal">
                <label className="form-label">Email Address *</label>
                <input
                    type="email"
                    name="email"
                    className="form-input-modal"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                />
            </div>

            {/* Role Select */}
            <div className="form-group-modal">
                <label className="form-label">Role *</label>
                <div className="select-wrapper-modal">
                    <select
                        name="role"
                        className="form-select-modal"
                        value={formData.role}
                        onChange={handleInputChange}
                    >
                        <option value="Student">Student</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Admin">Admin</option>
                        <option value="Researcher">Researcher</option>
                        <option value="Enthusiast">Nature Enthusiast</option>
                    </select>
                    <ChevronDown className="select-icon-modal" size={20} />
                </div>
            </div>

            {/* ⭐ Status Select - Activate/Deactivate Account */}
            <div className="form-group-modal">
                <label className="form-label">Account Status *</label>
                <div className="select-wrapper-modal">
                    <select
                        name="status"
                        className="form-select-modal"
                        value={formData.status}
                        onChange={handleInputChange}
                        style={{
                            color: formData.status === 'Active' ? '#22c55e' : '#ef4444',
                            fontWeight: '600'
                        }}
                    >
                        <option value="Active" style={{ color: '#22c55e' }}>✓ Active</option>
                        <option value="Inactive" style={{ color: '#ef4444' }}>✗ Inactive</option>
                        <option value="Suspended" style={{ color: '#f59e0b' }}>⚠ Suspended</option>
                    </select>
                    <ChevronDown className="select-icon-modal" size={20} />
                </div>
                <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    marginTop: '0.25rem' 
                }}>
                    {formData.status === 'Inactive' && 'User will not be able to log in'}
                    {formData.status === 'Suspended' && 'Account temporarily restricted'}
                    {formData.status === 'Active' && 'User has full access'}
                </p>
            </div>

            {/* Password Input (Optional) */}
            <div className="form-group-modal">
                <label className="form-label">New Password (Optional)</label>
                <div className="input-wrapper-modal">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        className="form-input-modal"
                        placeholder="Leave blank to keep current password"
                        value={formData.password}
                        onChange={handleInputChange}
                    />
                    <button
                        type="button"
                        className="password-toggle-modal"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    marginTop: '0.25rem' 
                }}>
                    Only fill this if you want to change the user's password
                </p>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
                <button
                    type="button"
                    className="btn-cancel"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                >
                    {loading ? 'Updating...' : 'Update User'}
                </button>
            </div>
        </form>
    );
}
