import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const ComplaintsPage = () => {
  const { user } = useAuth(); // Access the logged-in user
  const [complaints, setComplaints] = useState([]); // State to store fetched complaints
  const [loading, setLoading] = useState(true); // State to show loading spinner
  const [error, setError] = useState(""); // State to store any fetch errors

  // Fetch complaints function
  const fetchComplaints = async () => {
    try {
      const url = `http://127.0.0.1:8000/complaints/?email=${user.email}`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error response from server: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      setComplaints(data); // Set the fetched complaints data
    } catch (error) {
      console.error("Error fetching complaints:", error);
      setError("Failed to fetch complaints. Please try again later.");
    } finally {
      setLoading(false); // Stop loading spinner after fetching
    }
  };

  // Use useEffect to fetch complaints when the component is mounted
  useEffect(() => {
    if (user?.email) {
      fetchComplaints();
    }
  }, [user?.email]);

  // Render loading spinner, error, or complaints
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h1>My Complaints</h1>
        <button
          className="btn btn-primary"
          onClick={() => (window.location.href = "/raisecomplaint")} // Redirect to RaiseComplaint page
        >
          Create Complaint
        </button>
      </div>

      {loading ? (
        <p>Loading complaints...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : complaints.length === 0 ? (
        <p>No complaints created yet.</p>
      ) : (
        <div className="row">
          {complaints.map((complaint) => (
            <div className="col-md-4" key={complaint.id}>
              <div className="card mb-3 position-relative">
                {/* Status Badge */}
                <span
                  className={`badge position-absolute top-0 end-0 m-2 ${
                    complaint.status === "In review"
                      ? "bg-warning"
                      : "bg-success"
                  }`}
                >
                  {complaint.status === "In review" ? "In Review" : "Resolved"}
                </span>

                <div className="card-body">
                  {/* Labeled Complaint Information */}
                  <p className="card-text">
                    <strong>Complaint ID:</strong> {complaint.id}
                  </p>
                  <p className="card-text">
                    <strong>Complaint Type:</strong> {complaint.issue_type}
                  </p>
                  <p className="card-text">
                    <strong>Description:</strong> {complaint.details}
                  </p>

                  {/* Show Order ID only for Product Return */}
                  {complaint.issue_type === "Product Return" && (
                    <p className="text-muted">
                      <strong>Order ID:</strong> {complaint.orderID || "N/A"}
                    </p>
                  )}

                  {/* Resolution before status */}
                  {complaint.resolution && (
                    <p className="mt-2 text-success">
                      <strong>Resolution:</strong> {complaint.resolution}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
