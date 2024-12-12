import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';  // Import useNavigate for navigation

const ForgotResetPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState(''); // Token entered by user
  const [response_code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEmailAuthenticated, setIsEmailAuthenticated] = useState(false);

  const navigate = useNavigate();  // Initialize the useNavigate hook

  // Step 2: Handle email submission to request reset token
  const handleForgotPassword = async (e) => {
    e.preventDefault(); // Prevent page refresh
    setError('');
    setSuccess(false);

    try {
      // Send the forgot password request to the backend
      const response = await axios.post('http://localhost:8000/forgot-password', { email });
      setCode(response.data.code);
      
      if (response.status === 200) {
        setIsEmailAuthenticated(true);  // Authentication success
        setSuccess(true);
        console.log('Password reset email sent:', response.data);  // Print response data
      }
    } catch (error) {
      // Handle error from backend
      if (error.response && error.response.status === 400) {
        setError(error.response.data.detail);
        console.log('Error response:', error.response.data);  // Print error response
      } else {
        setError('An error occurred during password reset');
        console.log('General error:', error);  // Print general error
      }
    }
  };

  // Step 3: Handle password reset after email is authenticated and token is provided
  const handleResetPassword = async (e) => {
    e.preventDefault(); // Prevent page refresh
    setError('');
    setSuccess(false);

    if (resetToken !== response_code) {
      setError("Auth code is not matched");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Make an API call to reset the password using the reset token
      const response = await axios.post(`http://localhost:8000/reset-password`, {
        email: email,
        password: newPassword,
      });

      if (response.status === 200) {
        setSuccess(true);
        console.log('Password has been reset successfully:', response.data);  // Print response data

        // Redirect to the login page after successful password reset
        navigate('/login');  // Use navigate to redirect the user to the login page
      }
    } catch (error) {
      // Handle error from backend
      if (error.response && error.response.status === 400) {
        setError(error.response.data.detail);
        console.log('Error response:', error.response.data);  // Print error response
      } else {
        setError('An error occurred while resetting your password');
        console.log('General error:', error);  // Print general error
      }
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4">
          <h2 className="text-center">Forgot & Reset Password</h2>
          
          {!isEmailAuthenticated ? (
            <form onSubmit={handleForgotPassword}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              <button type="submit" className="btn btn-primary w-100">Send Authentication Code</button>
            </form>
          ) : (
            <>
              <div className="alert alert-success" role="alert">
                Password reset email has been sent. Please check your email for the reset token.
              </div>

              <form onSubmit={handleResetPassword}>
                <div className="mb-3">
                  <label htmlFor="resetToken" className="form-label">Reset Token</label>
                  <input
                    type="text"
                    className="form-control"
                    id="resetToken"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                <button type="submit" className="btn btn-primary w-100">Reset Password</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotResetPassword;
