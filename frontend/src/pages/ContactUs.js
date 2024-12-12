import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

const ContactUs = () => {
  const { user } = useAuth(); // Assuming AuthContext is being used
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
    // Check if the user role is not admin; otherwise, block access
    if (user?.role === "admin") {
      setIsAuthorized(false);
    }
  }, [user]);

  const handleDetailsChange = (e) => {
    setDetails(e.target.value);
    setMessage(""); // Clear the message when the user types
  };

  const submitQuery = async (event) => {
    event.preventDefault(); // Prevent default form behavior

    if (details.trim().length < 5) {
      setMessage("Details must be at least 5 characters long.");
      return;
    }

    const payload = {
      firstname: user.first_name,
      lastname: user.last_name,
      mobilenumber: user.phone,
      email: user.email,
      details,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/contact_us", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setMessage("Your inquiry has been submitted successfully.");
        setDetails(""); // Clear the details field

        // Clear the message after 2 seconds
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage(result.message || "Failed to submit your inquiry. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("An error occurred. Please try again later.");
    }
  };

  // Redirect unauthorized users (admins) to the home page
  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">
        <i className="bi bi-envelope-fill me-2"></i>Contact Us
      </h1>
      <form onSubmit={submitQuery} className="mt-4">
        <div className="mb-4">
          <label htmlFor="details" className="form-label">
            <i className="bi bi-question-circle me-2"></i>Your Query:
          </label>
          <textarea
            id="details"
            className="form-control"
            rows="5"
            value={details}
            onChange={handleDetailsChange}
            placeholder="Enter your query or concern here..."
            required
          ></textarea>
        </div>

        <div className="d-flex justify-content-start">
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </div>
      </form>

      {message && <p className="mt-4 alert alert-info">{message}</p>}
    </div>
  );
};

export default ContactUs;
