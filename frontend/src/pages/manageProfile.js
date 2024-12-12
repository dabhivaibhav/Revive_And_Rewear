import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ManageProfile = () => {
  const { userEmail, userRole } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMFAConfirm, setShowMFAConfirm] = useState(false);
  const [pendingMFAState, setPendingMFAState] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    businessName: '',
    taxId: '',
    mfa_enabled: false
  });

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

      case 'phone':
        return value.length !== 10
          ? 'Phone number must be 10 digits'
          : !/^\d+$/.test(value)
          ? 'Phone number should only contain numbers'
          : '';

      case 'businessName':
        if (userRole === 'seller') {
          return value.length < 3
            ? 'Business name must be at least 3 characters long'
            : !/^[A-Za-z0-9\s\-&.,]+$/.test(value)
              ? 'Business name contains invalid characters'
              : '';
        }
        return '';

      case 'address':
        return value.length < 10
          ? 'Please enter a complete address (at least 10 characters)'
          : !/^[A-Za-z0-9\s\-,.'#]+$/.test(value)
            ? 'Address contains invalid characters'
            : '';

      case 'postalCode':
        return !/^[A-Z0-9\s-]{4,10}$/i.test(value)
          ? 'Please enter a valid postal code'
          : '';

      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setError('No authentication token found');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8000/get-user-details?email=${userEmail}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch user details');
        }

        const userData = await response.json();

        setFormData({
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          email: userEmail || '',
          phone: userData.phone || '',
          address: userData.address || '',
          postalCode: userData.postal_code || '',
          businessName: userData.business_name || '',
          taxId: userData.tax_id || '',
          mfa_enabled: userData.mfa_enabled || false
        });
      } catch (error) {
        console.error('Error in fetchUserDetails:', error);
        setError('Error fetching user details: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (userEmail) {
      fetchUserDetails();
    } else {
      setIsLoading(false);
      setError('No user email found');
    }
  }, [userEmail]);

  const handleMFAToggle = (e) => {
    const newMFAState = e.target.checked;
    setPendingMFAState(newMFAState);
    setShowMFAConfirm(true);
  };

  const confirmMFAChange = (confirmed) => {
    if (confirmed) {
      setFormData(prev => ({
        ...prev,
        mfa_enabled: pendingMFAState
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        mfa_enabled: !pendingMFAState
      }));
    }
    setShowMFAConfirm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, numericValue)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
      if (type !== 'checkbox') {
        setErrors(prev => ({
          ...prev,
          [name]: validateField(name, value)
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'email' && key !== 'taxId' && key !== 'mfa_enabled') {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setMessage('');
    setError('');

    if (!validateForm()) {
      setError('Please fix the validation errors before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const updatedData = {
        email: userEmail,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        address: formData.address || '',
        postal_code: formData.postalCode || '',
        mfa_enabled: formData.mfa_enabled
      };

      if (userRole === 'seller') {
        updatedData.business_name = formData.businessName;
        updatedData.tax_id = formData.taxId;
      }

      const response = await fetch('http://localhost:8000/update-user-details', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update profile');
      }

      setMessage('Profile updated successfully!');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClassName = (fieldName) => {
    return `form-control ${errors[fieldName] ? 'is-invalid' : formData[fieldName] ? 'is-valid' : ''}`;
  };

  if (isLoading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mb-0">Manage Profile</h3>
            </div>
            <div className="card-body">
              {message && (
                <div className="alert alert-success" role="alert">
                  {message}
                </div>
              )}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="firstName" className="form-label">First Name</label>
                      <input
                        type="text"
                        className={getInputClassName('firstName')}
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                      {errors.firstName && (
                        <div className="invalid-feedback">{errors.firstName}</div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="lastName" className="form-label">Last Name</label>
                      <input
                        type="text"
                        className={getInputClassName('lastName')}
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                      {errors.lastName && (
                        <div className="invalid-feedback">{errors.lastName}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control bg-light"
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">Phone</label>
                  <input
                    type="tel"
                    className={getInputClassName('phone')}
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength="10"
                    required
                  />
                  {errors.phone && (
                    <div className="invalid-feedback">{errors.phone}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="address" className="form-label">Address</label>
                  <input
                    type="text"
                    className={getInputClassName('address')}
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                  {errors.address && (
                    <div className="invalid-feedback">{errors.address}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="postalCode" className="form-label">Postal Code</label>
                  <input
                    type="text"
                    className={getInputClassName('postalCode')}
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    required
                  />
                  {errors.postalCode && (
                    <div className="invalid-feedback">{errors.postalCode}</div>
                  )}
                </div>

                {userRole === 'seller' && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="businessName" className="form-label">Business Name</label>
                      <input
                        type="text"
                        className={getInputClassName('businessName')}
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        required
                      />
                      {errors.businessName && (
                        <div className="invalid-feedback">{errors.businessName}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="taxId" className="form-label">Tax ID</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        id="taxId"
                        name="taxId"
                        value={formData.taxId}
                        disabled
                      />
                    </div>
                  </>
                )}

                <div className="mb-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h5 className="card-title">Two-Factor Authentication</h5>
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="mfa_enabled"
                          name="mfa_enabled"
                          checked={formData.mfa_enabled}
                          onChange={handleMFAToggle}
                          disabled={isSubmitting}
                        />
                        <label className="form-check-label" htmlFor="mfa_enabled">
                          {formData.mfa_enabled ? 'Enabled' : 'Disabled'}
                        </label>
                      </div>
                      <small className="text-muted d-block mt-2">
                        When enabled, you'll need to verify your identity using a code sent to your email each time you log in.
                      </small>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Updating...
                    </>
                  ) : 'Update Profile'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showMFAConfirm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {pendingMFAState ? 'Enable' : 'Disable'} Two-Factor Authentication?
                </h5>
              </div>
              <div className="modal-body">
                {pendingMFAState ? (
                  <p>
                    By enabling 2FA, you'll need to enter a verification codesent to your email each time you log in. This adds an extra layer of security to your account.
                  </p>
                ) : (
                  <p>
                    Disabling 2FA will remove the additional security layer from your account. 
                    Are you sure you want to continue?
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => confirmMFAChange(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className={`btn ${pendingMFAState ? 'btn-success' : 'btn-danger'}`}
                  onClick={() => confirmMFAChange(true)}
                >
                  {pendingMFAState ? 'Enable 2FA' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProfile;