import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from '../contexts/CartContext';

const Payments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const { cart, total } = location.state || { cart: [], total: "0.00" };
  const { updateCart } = useCart();

  const [userDetails, setUserDetails] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    postal_code: ""
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [selectedMethodDetails, setSelectedMethodDetails] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userEmail) {
        setUserDetails((prevDetails) => ({ ...prevDetails, email: "User email not found. Please log in." }));
        return;
      }

      try {
        const userResponse = await axios.get(`http://localhost:8000/user/details?email=${userEmail}`);
        setUserDetails({
          name: userResponse.data.name || "",
          phone: userResponse.data.phone || "",
          email: userEmail,
          address: userResponse.data.address || "",
          postal_code: userResponse.data.postal_code || ""
        });

        const paymentResponse = await axios.get(`http://localhost:8000/user/payment-methods?email=${userEmail}`);
        const methods = Array.isArray(paymentResponse.data.methods) ? paymentResponse.data.methods : [];
        setPaymentMethods([...methods, { type: "cash", displayName: "Cash on Delivery" }]);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserData();
  }, [userEmail]);

  const handlePaymentMethodChange = (e) => {
    const methodType = e.target.value;
    setSelectedPaymentMethod(methodType);
    const methodDetails = paymentMethods.find(method => method.type === methodType);
    setSelectedMethodDetails(methodDetails || null);
  };
  const handleApplyCoupon = async () => {
    try {
      const response = await fetch(`http://localhost:8000/coupons/validate/${couponCode}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        setCouponError(error.detail);
        setAppliedCoupon(null);
        return;
      }

      const data = await response.json();
      setAppliedCoupon(data);
      setCouponError('');
    } catch (error) {
      setCouponError('Failed to apply coupon');
      setAppliedCoupon(null);
    }
  };

  const calculateTotal = () => {
    let finalTotal = parseFloat(total);
    if (appliedCoupon) {
      finalTotal -= (finalTotal * appliedCoupon.discount_percentage) / 100;
    }
    return finalTotal.toFixed(2);
  };

  async function handlePayment() {
    if (!selectedPaymentMethod) {
      alert("Please select a payment method to proceed.");
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare payment method details
      const paymentMethodDetails = selectedMethodDetails ? {
        type: selectedMethodDetails.type,
        ...(selectedMethodDetails.type === 'card'
          ? {
            cardNumber: selectedMethodDetails.cardNumber,
            cardName: selectedMethodDetails.cardName
          }
          : selectedMethodDetails.type === 'paypal'
            ? { paypalEmail: selectedMethodDetails.paypalEmail }
            : { type: 'cash' }
        )
      } : { type: 'cash' };

      const shippingAddress = {
        name: userDetails.name,
        address: userDetails.address,
        postal_code: userDetails.postal_code
      };

      // Update payment status with payment method and shipping address
      const response = await axios.put(`http://localhost:8000/cart/payment-status`, {
        email: userEmail,
        buyed: true,
        payment_method: paymentMethodDetails,
        shipping_address: shippingAddress ,
        coupon_code: appliedCoupon ? couponCode : null
      });

      if (response.data.message) {
        alert("Payment successful! Thank you for your purchase.");
        await updateCart();
        navigate("/vieworders");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      const errorMessage = error.response?.data?.detail || error.message;
      alert(`Payment failed. ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  }


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  const handleBack = () => {
    navigate("/cart");
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <button onClick={handleBack} className="btn btn-outline-primary">
              <i className="bi bi-arrow-left me-2"></i>Back to Cart
            </button>
            <h2 className="mb-0">Payment Details</h2>
          </div>

          {/* Order Summary */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h4 className="card-title mb-4">Order Summary</h4>

              {/* Product List */}
              {cart.map((item) => (
                <div key={item._id} className="card shadow-sm border-0 mb-3">
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col-md-3">
                        <div className="bg-light rounded p-3 text-center" style={{ height: '150px' }}>
                          <img
                            src={`http://localhost:8000/upload_images/${item.images?.[0] || ''}`}
                            className="h-100"
                            alt={item.product_name}
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                      <div className="col-md-9">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h5 className="mb-1">{item.product_name}</h5>
                            <p className="text-muted mb-0">{item.category}</p>
                          </div>
                          <h5 className="text-primary mb-0">${item.price?.toFixed(2)}</h5>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total Amount */}
              <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                <h4 className="mb-0">Total Amount:</h4>
                <h4 className="text-primary mb-0">${total}</h4>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h4 className="card-title mb-4">Shipping Information</h4>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={userDetails.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="phone"
                    value={userDetails.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="text"
                    className="form-control"
                    name="email"
                    value={userDetails.email}
                    readOnly
                  />
                </div>
                <div className="col-md-8 mb-3">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={userDetails.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Postal Code</label>
                  <input
                    type="text"
                    className="form-control"
                    name="postal_code"
                    value={userDetails.postal_code}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h4 className="card-title mb-4">Payment Method</h4>
              <select
                className="form-select mb-4"
                onChange={handlePaymentMethodChange}
                value={selectedPaymentMethod}
              >
                <option value="">Choose Payment Method</option>
                {paymentMethods.map((method, index) => (
                  <option key={index} value={method.type}>
                    {method.type === "card"
                      ? `Credit Card ending in ${method.cardNumber.slice(-4)}`
                      : method.type === "paypal"
                        ? `PayPal (${method.paypalEmail})`
                        : method.displayName}
                  </option>
                ))}
              </select>

              {selectedMethodDetails && (
                <div className="alert alert-info">
                  {selectedMethodDetails.type === "card" && (
                    <>
                      <h5 className="alert-heading">Credit Card Details</h5>
                      <p className="mb-1">Card Number: **** **** **** {selectedMethodDetails.cardNumber.slice(-4)}</p>
                      <p className="mb-0">Cardholder Name: {selectedMethodDetails.cardName}</p>
                    </>
                  )}
                  {selectedMethodDetails.type === "paypal" && (
                    <>
                      <h5 className="alert-heading">PayPal Details</h5>
                      <p className="mb-0">PayPal Email: {selectedMethodDetails.paypalEmail}</p>
                    </>
                  )}
                  {selectedMethodDetails.type === "cash" && (
                    <>
                      <h5 className="alert-heading">Cash on Delivery</h5>
                      <p className="mb-0">Payment will be collected upon delivery.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Coupon Code */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h4>Apply Coupon</h4>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button 
                  className="btn btn-outline-primary" 
                  type="button"
                  onClick={handleApplyCoupon}
                >
                  Apply
                </button>
              </div>
              {couponError && (
                <div className="alert alert-danger">{couponError}</div>
              )}
              {appliedCoupon && (
                <div className="alert alert-success">
                  Coupon applied! {appliedCoupon.discount_percentage}% discount
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h4>Order Summary</h4>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${total}</span>
              </div>
              {appliedCoupon && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Discount:</span>
                  <span>-${(total * appliedCoupon.discount_percentage / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between fw-bold">
                <span>Total:</span>
                <span>${calculateTotal()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePayment}
            className="btn btn-primary btn-lg w-100"
            disabled={isProcessing || !selectedPaymentMethod}
          >
            {isProcessing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing Payment...
              </>
            ) : (
              'Confirm Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payments;