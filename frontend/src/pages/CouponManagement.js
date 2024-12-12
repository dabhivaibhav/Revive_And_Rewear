import React, { useState } from 'react';

const CouponManagement = () => {
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: '',
    expiry_date: '',
    max_uses: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const userEmail = localStorage.getItem('userEmail');
  const businessName = localStorage.getItem('businessName');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
  
      if (!response.ok) {
        let errorMessage = 'Failed to create coupon';
        try {
          const errorData = await response.text();
          // If it's a valid JSON, parse it
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.detail || parsedError.message || errorMessage;
        } catch (parseError) {
          // If parsing fails, use the response status text
          errorMessage = response.statusText || errorMessage;
        }
  
        throw new Error(errorMessage);
      }
  
      setMessage({ text: 'Coupon created successfully!', type: 'success' });
      
      setFormData({
        code: '',
        discount_percentage: '',
        expiry_date: '',
        max_uses: ''
      });
    } catch (error) {
      setMessage({ 
        text: error.message || 'Failed to create coupon', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userEmail || localStorage.getItem('userRole') !== 'seller') {
    return null;
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mb-0">Create Coupon Code</h3>
            </div>
            <div className="card-body">
              {message.text && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="code" className="form-label">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="Enter coupon code (e.g., SUMMER2024)"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="discount_percentage" className="form-label">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="discount_percentage"
                    name="discount_percentage"
                    value={formData.discount_percentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    required
                    placeholder="Enter discount percentage (0-100)"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="expiry_date" className="form-label">
                    Expiry Date
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    id="expiry_date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleChange}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="max_uses" className="form-label">
                    Maximum Uses
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="max_uses"
                    name="max_uses"
                    value={formData.max_uses}
                    onChange={handleChange}
                    min="1"
                    placeholder="Leave empty for unlimited uses"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Coupon...
                    </>
                  ) : 'Create Coupon'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponManagement;