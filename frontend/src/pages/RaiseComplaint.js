import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const RaiseComplaint = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Access the user object
  const [issueType, setIssueType] = useState(""); // Issue type state
  const [details, setDetails] = useState(""); // Details state
  const [orderID, setOrderID] = useState(""); // State for Order ID
  const [message, setMessage] = useState(""); // Message state
  const [detailsError, setDetailsError] = useState(""); // Error state for details field

  const handleOrderIDChange = (e) => {
    setOrderID(e.target.value);
    setMessage(""); // Clear message when the user updates the Order ID field
  };

  const handleDetailsChange = (e) => {
    const value = e.target.value;
    setDetails(value);

    // Validate minimum length
    if (value.length > 0 && value.length < 15) {
      setDetailsError("Please enter at least 15 characters.");
    } else {
      setDetailsError(""); // Clear error if valid
    }
  };

  const submitComplaint = async (event) => {
    event.preventDefault();

    // Check for minimum length validation before submission
    if (details.length < 15) {
      setDetailsError("Please enter at least 15 characters.");
      return;
    }

    const payload = {
      firstname: user.first_name,
      lastname: user.last_name,
      mobilenumber: user.phone,
      email: user.email,
      issue_type: issueType,
      details: details,
      orderID: issueType === "Product Return" ? orderID : null, // Include orderID only for "Product Return"
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/complaints/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message);
        if (result.complaint_id) {
          setTimeout(() => navigate("/complaints"), 1000); // Redirect on success
        }
      } else {
        setMessage(result.message); // Show server error message
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("An error occurred while submitting the complaint.");
    }
  };

  const handleBack = () => {
    navigate(-1); // Redirect to the previous page
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">
        <i className="bi bi-chat-dots-fill me-2"></i>Raise a Complaint
      </h1>
      <form onSubmit={submitComplaint} className="mt-4">
        <div className="row align-items-center mb-4">
          <div className="col-md-6">
            <label htmlFor="issue_type" className="form-label">
              <i className="bi bi-list-task me-2"></i>Issue Type:
            </label>
            <select
              id="issue_type"
              className="form-select"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              required
            >
              <option value="">Select an Issue</option>
              <option value="Product Return">Product Return</option>
              <option value="Website Issue">Website Issue</option>
            </select>
          </div>

          {issueType === "Product Return" && (
            <div className="col-md-6">
              <label htmlFor="orderID" className="form-label">
                <i className="bi bi-tag me-2"></i>Order ID:
              </label>
              <input
                type="text"
                id="orderID"
                className="form-control"
                value={orderID}
                onChange={handleOrderIDChange}
                placeholder="Enter Order ID"
                required
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="details" className="form-label">
            <i className="bi bi-pencil-square me-2"></i>Details:
          </label>
          <textarea
            id="details"
            className="form-control"
            rows="5"
            value={details}
            onChange={handleDetailsChange}
            placeholder={
              issueType === "Product Return"
                ? "Enter the reason to return the product"
                : "Describe the issue in detail"
            }
            required
          ></textarea>
          {detailsError && (
            <p className="text-danger mt-1">{detailsError}</p> // Show error message
          )}
        </div>

        <div className="d-flex justify-content-start">
          <button
            type="button"
            className="btn btn-secondary me-2"
            onClick={handleBack}
          >
            Back
          </button>
          <button type="submit" className="btn btn-primary">
            Submit Complaint
          </button>
        </div>
      </form>

      {message && <p className="mt-4 alert alert-info">{message}</p>}
    </div>
  );
};

export default RaiseComplaint;
