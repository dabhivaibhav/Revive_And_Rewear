import React, { useState, useEffect } from "react";
import axios from "axios";

const TEST_CARDS = [
  { number: "4111111111111111", brand: "Visa" },
  { number: "5555555555554444", brand: "Mastercard" },
  { number: "378282246310005", brand: "American Express" },
];

const BASE_URL = "http://localhost:8000";

const ManagePaymentMethods = () => {
  // State management
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newPaymentType, setNewPaymentType] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingMethod, setEditingMethod] = useState(null);
  const [showTestCards, setShowTestCards] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    paypalEmail: ""
  });
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    paypalEmail: ""
  });

  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    fetchPaymentMethods();
  }, []);
  // Validation functions
  const validateCardNumber = (number) => {
    const cleaned = number.replace(/\s/g, "");
    if (!cleaned) return "Card number is required";
    if (cleaned.length < 15) return "Card number must be at least 15 digits";
    if (!/^\d+$/.test(cleaned)) return "Card number must contain only digits";
    return "";
  };

  const validateCardName = (name) => {
    if (!name || !name.trim()) return "Cardholder name is required";
    if (name.length < 3) return "Name must be at least 3 characters";
    return "";
  };

  const validateExpiryDate = (date) => {
    if (!date) return "Expiry date is required";
    if (!/^\d{2}\/\d{2}$/.test(date)) return "Use MM/YY format";

    const [month, year] = date.split('/').map(num => parseInt(num, 10));
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (isNaN(month) || isNaN(year)) return "Invalid date format";
    if (month < 1 || month > 12) return "Invalid month";
    if (year < currentYear) return "Card has expired";
    if (year === currentYear && month < currentMonth) return "Card has expired";

    return "";
  };

  const validateCVV = (cvv) => {
    if (!cvv) return "CVV is required";
    if (!/^\d{3,4}$/.test(cvv)) return "CVV must be 3 or 4 digits";
    return "";
  };

  const validatePayPalEmail = (email) => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format";
    return "";
  };

  const validateAllFields = () => {
    const newErrors = {};
    if (newPaymentType === "card") {
      newErrors.cardNumber = validateCardNumber(paymentDetails.cardNumber);
      newErrors.cardName = validateCardName(paymentDetails.cardName);
      newErrors.expiryDate = validateExpiryDate(paymentDetails.expiryDate);
      newErrors.cvv = validateCVV(paymentDetails.cvv);
    } else {
      newErrors.paypalEmail = validatePayPalEmail(paymentDetails.paypalEmail);
    }

    setFieldErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };
  const handleCardNumberChange = (e) => {
    const value = e.target.value;
    const formatted = formatCardNumber(value);
    setPaymentDetails(prev => ({ ...prev, cardNumber: formatted }));
    setFieldErrors(prev => ({ ...prev, cardNumber: validateCardNumber(formatted) }));
  };

  const handleCardNameChange = (e) => {
    const value = e.target.value;
    setPaymentDetails(prev => ({ ...prev, cardName: value }));
    setFieldErrors(prev => ({ ...prev, cardName: validateCardName(value) }));
  };

  const handleExpiryDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    setPaymentDetails(prev => ({ ...prev, expiryDate: value }));
    setFieldErrors(prev => ({ ...prev, expiryDate: value.length === 5 ? validateExpiryDate(value) : "Invalid expiry date" }));
  };

  const handleCVVChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setPaymentDetails(prev => ({ ...prev, cvv: value }));
    setFieldErrors(prev => ({ ...prev, cvv: validateCVV(value) }));
  };

  const handlePayPalEmailChange = (e) => {
    const value = e.target.value;
    setPaymentDetails(prev => ({ ...prev, paypalEmail: value }));
    setFieldErrors(prev => ({ ...prev, paypalEmail: validatePayPalEmail(value) }));
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    }
    return value;
  };
 
  const fetchPaymentMethods = async () => {
    if (!userEmail) {
      setError("Please log in to manage payment methods");
      return;
    }
  
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/user/payment-methods?email=${userEmail}`);
      
      // Ensure each method has an id
      const methodsWithIds = (response.data.methods || []).map(method => {
        if (!method.id && method._id) {
          return { ...method, id: method._id };
        }
        return method;
      });
      
      setPaymentMethods(methodsWithIds);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (method) => {
  
    if (!method) {
      console.error("Invalid method:", method);
      return;
    }
  
    // Ensure we have a valid ID
    const methodId = method.id || method._id;
    if (!methodId) {
      console.error("Method has no ID:", method);
      return;
    }
  
    setEditingMethod({
      ...method,
      id: methodId
    });
    setNewPaymentType(method.type);
    
    if (method.type === "card") {
      setPaymentDetails({
        cardNumber: method.cardNumber,
        cardName: method.cardName,
        expiryDate: method.expiryDate,
        cvv: method.cvv,
        paypalEmail: ""
      });
    } else {
      setPaymentDetails({
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: "",
        paypalEmail: method.paypalEmail
      });
    }
    setFieldErrors({
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
      paypalEmail: ""
    });
  };

  const handleCancelEdit = () => {
    setEditingMethod(null);
    setPaymentDetails({
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
      paypalEmail: ""
    });
    setFieldErrors({
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
      paypalEmail: ""
    });
    setShowTestCards(false);
  };

  const handleTestCardSelect = (cardNumber) => {
    const formatted = formatCardNumber(cardNumber);
    setPaymentDetails(prev => ({
      ...prev,
      cardNumber: formatted
    }));
    setFieldErrors(prev => ({
      ...prev,
      cardNumber: validateCardNumber(formatted)
    }));
    setShowTestCards(false);
  };

  const handleDeleteMethod = async (methodId) => {
    
    if (!methodId) {
      setError("Invalid payment method ID");
      return;
    }
  
    if (window.confirm("Are you sure you want to delete this payment method?")) {
      try {
        setLoading(true);
        const response = await axios.delete(
          `${BASE_URL}/user/payment-methods/${methodId}?email=${userEmail}`
        );
        setSuccessMessage("Payment method deleted");
        await fetchPaymentMethods();
      } catch (error) {
        console.error("Delete error:", error.response?.data || error);
        setError(error.response?.data?.detail || "Failed to delete payment method");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccessMessage("");

    if (!userEmail) {
      setError("Please log in to manage payment methods");
      return;
    }

    if (!validateAllFields()) {
      setError("Please correct the errors in the form");
      return;
    }

    try {
      setLoading(true);
      const newMethod = newPaymentType === "card"
        ? {
          type: "card",
          cardNumber: paymentDetails.cardNumber.replace(/\s/g, ""),
          cardName: paymentDetails.cardName,
          expiryDate: paymentDetails.expiryDate,
          cvv: paymentDetails.cvv
        }
        : {
          type: "paypal",
          paypalEmail: paymentDetails.paypalEmail
        };


      let response;
      if (editingMethod && editingMethod.id) {
        response = await axios.put(
          `${BASE_URL}/user/payment-methods/${editingMethod.id}`,
          {
            email: userEmail,
            paymentMethod: newMethod
          }
        );
        setSuccessMessage("Payment method updated");
      } else {
        response = await axios.post(
          `${BASE_URL}/user/payment-methods`,
          {
            email: userEmail,
            paymentMethod: newMethod
          }
        );
        setSuccessMessage("Payment method added");
      }


      await fetchPaymentMethods();
      handleCancelEdit();
    } catch (error) {
      console.error("Payment method error:", error.response?.data || error);
      setError(editingMethod ?
        `Failed to update payment method: ${error.response?.data?.detail || error.message}` :
        `Failed to add payment method: ${error.response?.data?.detail || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!userEmail) {
    return <div className="alert alert-warning">Please log in to manage payment methods.</div>;
  }

  return (
    <div className="container mt-5">
      <h2>{editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="card mb-4">
        <div className="card-body">
          <select
            className="form-select mb-3"
            value={newPaymentType}
            onChange={(e) => setNewPaymentType(e.target.value)}
            disabled={loading || editingMethod}
          >
            <option value="card">Credit Card</option>
            <option value="paypal">PayPal</option>
          </select>

          {newPaymentType === "card" ? (
            <div className="card-form">
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Card Number"
                  className={`form-control ${fieldErrors.cardNumber ? 'is-invalid' : ''}`}
                  value={paymentDetails.cardNumber}
                  onChange={handleCardNumberChange}
                  disabled={loading}
                  maxLength="19"
                />
                {fieldErrors.cardNumber && (
                  <div className="invalid-feedback">{fieldErrors.cardNumber}</div>
                )}
                {!editingMethod && (
                  <button
                    className="btn btn-link btn-sm"
                    onClick={() => setShowTestCards(!showTestCards)}
                    type="button"
                  >
                    Use test card
                  </button>
                )}
                {showTestCards && (
                  <div className="list-group mt-2">
                    {TEST_CARDS.map((card) => (
                      <button
                        key={card.number}
                        className="list-group-item list-group-item-action"
                        onClick={() => handleTestCardSelect(card.number)}
                      >
                        {card.brand}: {card.number}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  className={`form-control ${fieldErrors.cardName ? 'is-invalid' : ''}`}
                  value={paymentDetails.cardName}
                  onChange={handleCardNameChange}
                  disabled={loading}
                />
                {fieldErrors.cardName && (
                  <div className="invalid-feedback">{fieldErrors.cardName}</div>
                )}
              </div>
              <div className="row">
                <div className="col">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className={`form-control ${fieldErrors.expiryDate ? 'is-invalid' : ''}`}
                    value={paymentDetails.expiryDate}
                    onChange={handleExpiryDateChange}
                    disabled={loading}
                    maxLength="5"
                  />
                  {fieldErrors.expiryDate && (
                    <div className="invalid-feedback">{fieldErrors.expiryDate}</div>
                  )}
                </div>
                <div className="col">
                  <input
                    type="password"
                    placeholder="CVV"
                    className={`form-control ${fieldErrors.cvv ? 'is-invalid' : ''}`}
                    value={paymentDetails.cvv}
                    onChange={handleCVVChange}
                    disabled={loading}
                    maxLength="4"
                  />
                  {fieldErrors.cvv && (
                    <div className="invalid-feedback">{fieldErrors.cvv}</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <input
                type="email"
                placeholder="PayPal Email"
                className={`form-control ${fieldErrors.paypalEmail ? 'is-invalid' : ''}`}
                value={paymentDetails.paypalEmail}
                onChange={handlePayPalEmailChange}
                disabled={loading}
              />
              {fieldErrors.paypalEmail && (
                <div className="invalid-feedback">{fieldErrors.paypalEmail}</div>
              )}
            </div>
          )}

          <div className="mt-3">
            <button
              className="btn btn-primary me-2"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : editingMethod ? 'Update Method' : 'Add Method'}
            </button>
            {editingMethod && (
              <button
                className="btn btn-secondary"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Saved Payment Methods</h5>
          {loading && !editingMethod ? (
            <p>Loading payment methods...</p>
          ) : paymentMethods.length === 0 ? (
            <p className="text-muted">No payment methods saved yet.</p>
          ) : (
            <ul className="list-group">
              {paymentMethods.map((method) => (
                <li key={method.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      {method.type === "card" ? (
                        <>
                          <i className="bi bi-credit-card me-2"></i>
                          Card ending in {method.cardNumber.slice(-4)}
                          <br />
                          <small className="text-muted">
                            {method.cardName} • Expires {method.expiryDate}
                          </small>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-paypal me-2"></i>
                          PayPal: {method.paypalEmail}
                        </>
                      )}
                    </div>
                    <div>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => handleStartEdit(method)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteMethod(method.id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePaymentMethods;