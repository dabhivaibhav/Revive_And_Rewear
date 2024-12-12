import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ComplaintDetails = () => {
  const { complaintId } = useParams(); // Extract complaintId from URL
  const [complaint, setComplaint] = useState(null);
  const [resolution, setResolution] = useState("");
  const [message, setMessage] = useState(null); // For displaying feedback messages
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const navigate = useNavigate();

  // Function to fetch complaint details
  const fetchComplaint = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/complaints/${complaintId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch complaint details");
      }
      const data = await response.json();
      console.log("Fetched complaint details:", data); // Debugging log
      setComplaint(data);
      setResolution(data.resolution || ""); // Set the resolution field if exists
    } catch (error) {
      console.error("Error fetching complaint details:", error);
    }
  };

  const closeComplaint = async () => {
    if (!resolution.trim()) {
      setMessageType("error");
      setMessage("Resolution cannot be empty.");
      setTimeout(() => setMessage(null), 2000); // Hide message after 2 seconds
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/complaints/${complaintId}/close`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resolution: resolution.trim() }), // Send resolution in the request body
      });

      if (response.ok) {
        setMessageType("success");
        setMessage("Complaint closed successfully.");
        setTimeout(() => {
          setMessage(null);
          navigate("/review-complaints"); // Redirect to the review complaints page
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error("Failed to close complaint:", errorData);
        setMessageType("error");
        setMessage(`Failed to close complaint: ${errorData.detail[0]?.msg}`);
        setTimeout(() => setMessage(null), 2000); // Hide message after 2 seconds
      }
    } catch (error) {
      console.error("Error closing complaint:", error);
      setMessageType("error");
      setMessage("An error occurred while closing the complaint.");
      setTimeout(() => setMessage(null), 2000); // Hide message after 2 seconds
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [complaintId]);

  // Display a loading state while fetching data
  if (!complaint) {
    return <p>Loading complaint details...</p>;
  }

  const isResolved = complaint.status === "Resolved";

  // Render the complaint details
  return (
    <div className="container mt-4">
      <h1 className="mb-4">Complaint Details</h1>
      <div className="card shadow-sm p-4">
        {/* Complaint Details - Aligned Side by Side */}
        <div className="row">
          <div className="col-md-6">
            <p>
              <strong>Complaint ID:</strong>{" "}
              <span className="text-muted">{complaint.id}</span>
            </p>
            <p>
              <strong>Name:</strong>{" "}
              <span className="text-muted">
                {complaint.firstname} {complaint.lastname}
              </span>
            </p>
            <p>
              <strong>Complaint Type:</strong>{" "}
              <span className="text-muted">{complaint.issue_type}</span>
            </p>
          </div>
          <div className="col-md-6">
            <p>
              <strong>Description:</strong>{" "}
              <span className="text-muted">{complaint.details}</span>
            </p>
            {complaint.issue_type === "Product Return" && (
              <p>
                <strong>Order ID:</strong>{" "}
                <span className="text-muted">{complaint.orderID}</span>
              </p>
            )}
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`badge ${
                  isResolved ? "bg-success" : "bg-warning text-dark"
                }`}
              >
                {complaint.status}
              </span>
            </p>
          </div>
        </div>
        {/* Resolution Section */}
        <div className="mt-4">
          <label htmlFor="resolution" className="form-label">
            <strong>Resolution:</strong>
          </label>
          <textarea
            id="resolution"
            className="form-control"
            rows="4"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            disabled={isResolved} // Disable field if resolved
          ></textarea>
        </div>
        {/* Buttons */}
        <div className="d-flex justify-content-end mt-3">
          {!isResolved && (
            <button className="btn btn-primary" onClick={closeComplaint}>
              Close Complaint
            </button>
          )}
        </div>
      </div>

      {/* Display feedback message */}
      {message && (
        <div
          className={`mt-3 p-2 text-center ${
            messageType === "success" ? "alert alert-success" : "alert alert-danger"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default ComplaintDetails;
