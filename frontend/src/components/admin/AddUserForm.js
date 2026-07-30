import React, { useState } from 'react';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import './AddUserForm.css';
import { API_BASE_URL } from '../../config/apiConfig';

export default function AddUserForm({ onSuccess, onCancel }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'Student'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (!formData.name || !formData.email || !formData.password) {
            alert('Please fill in all required fields');
            return;
        }

        if (formData.password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const token = sessionStorage.getItem('userToken');
            
            const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    role: formData.role
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('User created successfully!');
                onSuccess(result.user); // Pass new user back to parent
                // Clear form
                setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    name: '',
                    role: 'Student'
                });
            } else {
                alert(result.message || 'Failed to create user!');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user! Please check your connection.');
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
                        <option value="Researcher">Researcher</option>
                        <option value="Enthusiast">Nature Enthusiast</option>
                    </select>
                    <ChevronDown className="select-icon-modal" size={20} />
                </div>
            </div>

            {/* Password Input */}
            <div className="form-group-modal">
                <label className="form-label">Password *</label>
                <div className="input-wrapper-modal">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        className="form-input-modal"
                        placeholder="Enter password (min 6 characters)"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                    />
                    <button
                        type="button"
                        className="password-toggle-modal"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            {/* Confirm Password Input */}
            <div className="form-group-modal">
                <label className="form-label">Confirm Password *</label>
                <div className="input-wrapper-modal">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        className="form-input-modal"
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                    />
                    <button
                        type="button"
                        className="password-toggle-modal"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
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
                    {loading ? 'Creating...' : 'Create User'}
                </button>
            </div>
        </form>
    );
}
