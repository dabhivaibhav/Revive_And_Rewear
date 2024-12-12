import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';  

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    mfaEnabled: false 
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  // Validation rules
  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
        return value.length < 2 
          ? 'First name must be at least 2 characters long'
          : !/^[A-Za-z\s]+$/.test(value)
          ? 'First name should only contain letters'
          : '';

      case 'lastName':
        return value.length < 2
          ? 'Last name must be at least 2 characters long'
          : !/^[A-Za-z\s]+$/.test(value)
          ? 'Last name should only contain letters'
          : '';

      case 'email':
        return !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
          ? 'Invalid email address'
          : '';

      case 'phone':
        return value.length !== 10
          ? 'Phone number must be 10 digits'
          : !/^\d+$/.test(value)
          ? 'Phone number should only contain numbers'
          : '';

      case 'password':
        if (value.length < 8) return 'Password must be at least 8 characters long';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
        if (!/[!@#$%^&*]/.test(value)) return 'Password must contain at least one special character (!@#$%^&*)';
        return '';

      case 'confirmPassword':
        return value !== formData.password
          ? 'Passwords do not match'
          : '';

      default:
        return '';
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate field on change
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value)
    }));

    // Special case for confirm password
    if (name === 'password') {
      setErrors(prev => ({
        ...prev,
        confirmPassword: formData.confirmPassword 
          ? validateField('confirmPassword', formData.confirmPassword)
          : prev.confirmPassword
      }));
    }
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/register', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        mfa_enabled: formData.mfaEnabled
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        console.log('Registration successful - navigating in 2 seconds');
        
        setTimeout(() => {
          console.log('Executing navigation to /login');
          navigate('/login');
        }, 2000);
      } else {
        setErrors(prev => ({
          ...prev,
          submit: 'Unexpected response from server'
        }));
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error.response?.data?.detail || 'Registration failed. Please try again.'
      }));
      console.error('Error registering:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClassName = (fieldName) => {
    return `form-control ${errors[fieldName] ? 'is-invalid' : formData[fieldName] ? 'is-valid' : ''}`;
  };

  return (
<div style={{ backgroundColor: '#f8f9fa', padding: '2rem 0' }}>
      <div className="container">
        <div className="row">
          {/* Left Side - Buyer Information */}
          <div className="col-lg-5 mb-4 mb-lg-0">
            <div className="pe-lg-4">
              <h2 className="display-6 mb-4" style={{ color: '#0d6efd' }}>Join Our Sustainable Fashion Community</h2>
              
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <h5 className="card-title" style={{ color: '#198754' }}>Why Choose Us</h5>
                  <ul className="list-unstyled">
                    <li className="mb-2">👗 Curated pre-loved fashion</li>
                    <li className="mb-2">💰 Great value for quality items</li>
                    <li className="mb-2">🌍 Reduce fashion waste impact</li>
                  </ul>
                </div>
              </div>

             
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="col-lg-7">
            <div className="card shadow border-0 p-4">
              <h2 className="text-center mb-4" style={{ color: '#0d6efd' }}>Create Your Account</h2>
              {success ? (
                <div className="alert alert-success text-center">
                  Registration successful! Redirecting to login page...
                </div>
              ) : (
                <form onSubmit={handleRegister} noValidate>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className={`form-control ${errors.firstName ? 'is-invalid' : formData.firstName ? 'is-valid' : ''}`}
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Enter first name"
                      />
                      {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className={`form-control ${errors.lastName ? 'is-invalid' : formData.lastName ? 'is-valid' : ''}`}
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Enter last name"
                      />
                      {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                    </div>

                    <div className="col-12">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : formData.email ? 'is-valid' : ''}`}
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Enter email"
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>

                    <div className="col-12">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className={`form-control ${errors.phone ? 'is-invalid' : formData.phone ? 'is-valid' : ''}`}
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength="10"
                        disabled={isLoading}
                        placeholder="Enter phone number"
                      />
                      {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                    </div>

                    <div className="col-12">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className={`form-control ${errors.password ? 'is-invalid' : formData.password ? 'is-valid' : ''}`}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Enter password"
                      />
                      {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                    </div>

                    <div className="col-12">
                      <label className="form-label">Confirm Password</label>
                      <input
                        type="password"
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : formData.confirmPassword ? 'is-valid' : ''}`}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Confirm your password"
                      />
                      {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                    </div>

                    <div className="col-12">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="mfaEnabled"
                          name="mfaEnabled"
                          checked={formData.mfaEnabled}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        <label className="form-check-label" htmlFor="mfaEnabled">
                          Enable Two-Factor Authentication
                        </label>
                        <small className="form-text text-muted d-block">
                          When enabled, you'll need to verify your identity using a code sent to your email each time you log in.
                        </small>
                      </div>
                    </div>

                    {errors.submit && (
                      <div className="col-12">
                        <div className="alert alert-danger">{errors.submit}</div>
                      </div>
                    )}

                    <div className="col-12">
                      <button 
                        type="submit" 
                        className="btn btn-primary w-100"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Registering...
                          </>
                        ) : 'Create Account'}
                      </button>
                    </div>

                    <div className="col-12 text-center">
                      Already have an account?{' '}
                      <button 
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => navigate('/login')}
                      >
                        Login here
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;