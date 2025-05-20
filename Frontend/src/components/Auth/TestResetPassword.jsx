import React, { useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import { FaSpinner, FaEnvelope, FaKey, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import './Auth.css';

/**
 * Test component for password reset functionality
 * This is a development-only component to test the password reset flow
 */
function TestResetPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [previewUrl, setPreviewUrl] = useState('');

  // Step 1: Request password reset
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log(`Sending password reset request for email: ${email}`);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      console.log('Password reset response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Error requesting password reset');
      }

      // Check for email preview URL
      setTimeout(async () => {
        try {
          const previewResponse = await fetch(`${API_BASE_URL}/api/auth/last-email-preview`);
          const previewData = await previewResponse.json();
          
          if (previewData.success && previewData.previewUrl) {
            setPreviewUrl(previewData.previewUrl);
          }
        } catch (err) {
          console.error('Error fetching email preview:', err);
        }
        
        setSuccess(true);
        setStep(2);
        setIsLoading(false);
      }, 2000);
      
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  // Step 2: Enter token from email
  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (!token) {
      setError('Please enter the token from the email');
      return;
    }
    setStep(3);
    setError('');
  };

  // Step 3: Reset password with token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!token || !newPassword) {
      setError('Token and new password are required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword
        })
      });

      const data = await response.json();
      console.log('Password reset response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Error resetting password');
      }

      setSuccess(true);
      setStep(4);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Test Password Reset</h2>
          <p className="auth-subtitle">Development Tool</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-danger">
            <FaExclamationTriangle className="me-2" />
            {error}
          </div>
        )}

        {step === 1 && (
          <form className="auth-form" onSubmit={handleRequestReset}>
            <div className="mb-4">
              <label htmlFor="email" className="form-label">
                <FaEnvelope className="me-2" />
                Email
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-btn w-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="fa-spin me-2" />
                  Sending...
                </>
              ) : 'Request Password Reset'}
            </button>
          </form>
        )}

        {step === 2 && (
          <>
            {previewUrl && (
              <div className="mb-4 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd' }}>
                <p className="mb-2"><strong>Email Preview:</strong></p>
                <a 
                  href={previewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary mb-3"
                >
                  Open Email Preview
                </a>
                <p className="small text-muted">
                  Open the preview link, find the reset token in the URL, and copy it below.
                </p>
              </div>
            )}

            <form className="auth-form" onSubmit={handleTokenSubmit}>
              <div className="mb-4">
                <label htmlFor="token" className="form-label">
                  <FaKey className="me-2" />
                  Reset Token
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste the token from the email"
                  required
                />
              </div>

              <button type="submit" className="auth-btn w-100">
                Continue
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label htmlFor="newPassword" className="form-label">
                <FaKey className="me-2" />
                New Password
              </label>
              <input
                type="password"
                className="form-control"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-btn w-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="fa-spin me-2" />
                  Resetting...
                </>
              ) : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="text-center">
            <div className="success-icon mb-4">
              <FaCheckCircle size={60} style={{ color: 'var(--success-color)' }} />
            </div>
            <p className="mb-4">
              Your password has been reset successfully!
            </p>
            <a href="/SeConnecter" className="auth-btn d-inline-block">
              Go to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestResetPassword;
