import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';  

const SellerRegister = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    address: '',
    taxId: '',
    password: '',
    confirmPassword: '',
    mfa_enabled: false
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

      case 'businessName':
        return value.length < 3
          ? 'Business name must be at least 3 characters long'
          : !/^[A-Za-z0-9\s\-&.,]+$/.test(value)
          ? 'Business name contains invalid characters'
          : '';

      case 'address':
        return value.length < 10
          ? 'Please enter a complete address (at least 10 characters)'
          : '';

      case 'taxId':
        return value.length < 9
          ? 'Tax ID must be at least 9 characters'
          : !/^[A-Z0-9-]+$/i.test(value)
          ? 'Tax ID should only contain letters, numbers, and hyphens'
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    // Special handling for phone numbers
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Validate field on change
      setErrors(prev => ({
        ...prev,
      [name]: validateField(name, name === 'phone' ? value.replace(/\D/g, '') : value)
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
      if (key !== 'mfa_enabled') {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
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
      const response = await axios.post('http://localhost:8000/seller_register', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        business_name: formData.businessName,
        address: formData.address,
        tax_id: formData.taxId,
        mfa_enabled: formData.mfa_enabled
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
        submit: error.response?.data?.detail || 'Email or business name already exists'
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
              {/* Left Side - Seller Information */}
              <div className="col-lg-5 mb-4 mb-lg-0">
                <div className="pe-lg-4">
                  <h2 className="display-6 mb-4" style={{ color: '#0d6efd' }}>Start Your Sustainable Fashion Business</h2>
                  
                  <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body">
                      <h5 className="card-title" style={{ color: '#198754' }}>Benefits of Joining</h5>
                      <ul className="list-unstyled">
                        <li className="mb-2">🌟 Access to eco-conscious customers</li>
                        <li className="mb-2">💰 Competitive commission rates</li>
                        <li className="mb-2">📊 Detailed analytics dashboard</li>
                      </ul>
                    </div>
                  </div>
    
                  <div className="card shadow-sm border-0">
                    <div className="card-body">
                      <h5 className="card-title" style={{ color: '#0d6efd' }}>What You Need</h5>
                      <ul className="list-unstyled">
                        <li className="mb-2">📝 Valid business registration</li>
                        <li className="mb-2">🏢 Business address</li>
                        <li className="mb-2">🔢 Tax identification number</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
    
              {/* Right Side - Registration Form */}
              <div className="col-lg-7">
                <div className="card shadow border-0 p-4">
                  <h2 className="text-center mb-4" style={{ color: '#0d6efd' }}>Seller Registration</h2>
                  {success ? (
                    <div className="alert alert-success text-center">
                      Registration successful! Redirecting to login page...
                    </div>
                  ) : (
                    <form onSubmit={handleRegister} noValidate>
                      <div className="row g-3">
                        {/* Personal Information */}
                        <div className="col-md-6">
                          <label className="form-label">First Name</label>
                          <input
                            type="text"
                            className={`form-control ${errors.firstName ? 'is-invalid' : formData.firstName ? 'is-valid' : ''}`}
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={isLoading}
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
                          />
                          {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                        </div>
    
                        <div className="col-md-6">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className={`form-control ${errors.email ? 'is-invalid' : formData.email ? 'is-valid' : ''}`}
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                          />
                          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                        </div>
    
                        <div className="col-md-6">
                          <label className="form-label">Phone</label>
                          <input
                            type="tel"
                            className={`form-control ${errors.phone ? 'is-invalid' : formData.phone ? 'is-valid' : ''}`}
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            maxLength="10"
                            disabled={isLoading}
                          />
                          {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                        </div>
    
                        {/* Business Information */}
                        <div className="col-12">
                          <label className="form-label">Business Name</label>
                          <input
                            type="text"
                            className={`form-control ${errors.businessName ? 'is-invalid' : formData.businessName ? 'is-valid' : ''}`}
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            disabled={isLoading}
                          />
                          {errors.businessName && <div className="invalid-feedback">{errors.businessName}</div>}
                        </div>
    
                        <div className="col-12">
                          <label className="form-label">Business Address</label>
                          <input
                            type="text"
                            className={`form-control ${errors.address ? 'is-invalid' : formData.address ? 'is-valid' : ''}`}
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            disabled={isLoading}
                          />
                          {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                        </div>
    
                        <div className="col-12">
                          <label className="form-label">Tax ID</label>
                          <input
                            type="text"
                            className={`form-control ${errors.taxId ? 'is-invalid' : formData.taxId ? 'is-valid' : ''}`}
                            name="taxId"
                            value={formData.taxId}
                            onChange={handleChange}
                            disabled={isLoading}
                          />
                          {errors.taxId && <div className="invalid-feedback">{errors.taxId}</div>}
                        </div>
    
                        {/* Password Fields */}
                        <div className="col-md-6">
                          <label className="form-label">Password</label>
                          <input
                            type="password"
                            className={`form-control ${errors.password ? 'is-invalid' : formData.password ? 'is-valid' : ''}`}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                          />
                          {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                        </div>
    
                        <div className="col-md-6">
                          <label className="form-label">Confirm Password</label>
                          <input
                            type="password"
                            className={`form-control ${errors.confirmPassword ? 'is-invalid' : formData.confirmPassword ? 'is-valid' : ''}`}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={isLoading}
                          />
                          {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                        </div>
    
                        {/* MFA Toggle */}
                        <div className="col-12">
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="mfa_enabled"
                              name="mfa_enabled"
                              checked={formData.mfa_enabled}
                              onChange={handleChange}
                              disabled={isLoading}
                            />
                            <label className="form-check-label" htmlFor="mfa_enabled">
                              Enable Two-Factor Authentication
                            </label>
                            <small className="form-text text-muted d-block">
                              When enabled, you'll need to verify your identity using a code sent to your email each time you log in.
                            </small>
                          </div>
                        </div>
    
                        {/* Error Message */}
                        {errors.submit && (
                          <div className="col-12">
                            <div className="alert alert-danger">{errors.submit}</div>
                          </div>
                        )}
    
                        {/* Submit Button */}
                        <div className="col-12">
                          <button 
                            type="submit" 
                            className="btn btn-primary w-100"
                            disabled={isLoading}
                            style={{
                              padding: '0.75rem',
                              fontWeight: '500',
                              transition: 'transform 0.2s'
                            }}
                          >
                            {isLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Registering...
                              </>
                            ) : 'Register as Seller'}
                          </button>
                        </div>
    
                        {/* Login Link */}
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
    

export default SellerRegister;