import React, { useState } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';
import './PasswordConfirmModal.css';
import { API_BASE_URL } from '../../config/apiConfig';

export default function PasswordConfirmModal({ isOpen, onClose, onConfirm, action = "delete" }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify admin password with backend
      const response = await fetch(`${API_BASE_URL}/api/admin/verify-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('userToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const result = await response.json();

      if (result.success) {
        onConfirm(); // Proceed with deletion
        setPassword('');
        onClose();
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError('Failed to verify password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="password-confirm-overlay" onClick={handleClose}>
      <div className="password-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="modal-icon-warning">
          <AlertTriangle size={48} color="#ef4444" />
        </div>

        <h2 className="modal-title">Confirm Admin Password</h2>
        <p className="modal-description">
          You are about to <strong>{action}</strong> a user. Please enter your admin password to confirm this action.
        </p>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input
              type="password"
              placeholder="Enter your admin password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="password-input"
              autoFocus
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="confirm-btn"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
