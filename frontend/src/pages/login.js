import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const { login, verifyMFA, resendMFACode } = useAuth();

  const navigateByRole = (role) => {
    switch (role) {
      case 'seller':
        navigate('/seller-dashboard');
        break;
      case 'admin':
        navigate('/admin-dashboard');
        break;
      default:
        navigate('/');
        break;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(email, password);
      
      if (response.requires_mfa) {
        setRequiresMFA(true);
        setError('');
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigateByRole(response.role);
        }, 1500);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Invalid credentials');
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMFA = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await verifyMFA(email, verificationCode);
      
      if (response.access_token) {
        setSuccess(true);
        setTimeout(() => {
          navigateByRole(response.role);
        }, 1500);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to verify code');
      setVerificationCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      const response = await resendMFACode(email);
      setError(response.message || 'New verification code sent to your email');
      setVerificationCode('');
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // MFA verification form
  if (requiresMFA) {
    return (
      <div className="min-vh-100 d-flex flex-column">
        <div className="flex-grow-1 py-5" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-6">
                <div className="card border-0 shadow-lg">
                  <div className="card-body p-5">
                    <h3 className="card-title text-center mb-4">Verify Your Identity</h3>
                    <p className="text-muted text-center mb-4">
                      A verification code has been sent to your email.
                      Please enter the code below to continue.
                    </p>
                    <form onSubmit={handleVerifyMFA}>
                      <div className="mb-4">
                        <input
                          type="text"
                          className="form-control form-control-lg text-center"
                          placeholder="Enter verification code"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          maxLength="6"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      {error && (
                        <div className="alert alert-danger" role="alert">
                          {error}
                        </div>
                      )}

                      {success && (
                        <div className="alert alert-success" role="alert">
                          Verification successful! Redirecting...
                        </div>
                      )}

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100 mb-4"
                        disabled={isLoading || success}
                      >
                        {isLoading ? (
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        ) : "Verify Code"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-link w-100"
                        onClick={handleResendCode}
                        disabled={isLoading || success}
                      >
                        Resend Code
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular login form with feature highlights
  return (
    <div className="min-vh-100 d-flex flex-column">
      <div className="flex-grow-1 py-5" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <div className="row justify-content-center align-items-center">
            {/* Left Side - Feature Highlights */}
            <div className="col-lg-6 mb-4 mb-lg-0">
              <div className="pe-lg-4">
                <h2 className="display-4 mb-4 text-primary">Welcome Back!</h2>
                <p className="lead mb-5">Join our sustainable fashion community and make a difference.</p>
                
                <div className="card mb-4 border-0 bg-white shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-primary p-3 rounded-circle me-3 text-white">
                        <i className="fas fa-recycle fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-1">Sustainable Fashion</h4>
                        <p className="mb-0 text-muted">Give pre-loved clothing a second life</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card mb-4 border-0 bg-white shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-success p-3 rounded-circle me-3 text-white">
                        <i className="fas fa-leaf fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-1">Eco-Friendly</h4>
                        <p className="mb-0 text-muted">Reduce fashion waste impact</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-0 bg-white shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-info p-3 rounded-circle me-3 text-white">
                        <i className="fas fa-check-circle fs-4"></i>
                      </div>
                      <div>
                        <h4 className="mb-1">Quality Assured</h4>
                        <p className="mb-0 text-muted">Verified authentic items</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-lg">
                <div className="card-body p-5">
                  <h3 className="card-title text-center mb-4">Login</h3>
                  {success ? (
                    <div className="alert alert-success text-center">
                      Login successful! Redirecting...
                    </div>
                  ) : (
                    <form onSubmit={handleLogin}>
                      <div className="mb-4">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control form-control-lg"
                          id="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                          type="password"
                          className="form-control form-control-lg"
                          id="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      
                      {error && (
                        <div className="alert alert-danger" role="alert">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100 mb-4"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        ) : "Login"}
                      </button>
                      
                      <div className="text-center">
                        <Link to="/forgot-password" className="text-decoration-none">
                          Forgot Password?
                        </Link>
                        <p className="mt-3 mb-0">
                          Don't have an account?{' '}
                          <Link to="/register" className="text-decoration-none">
                            Register here
                          </Link>
                        </p>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;