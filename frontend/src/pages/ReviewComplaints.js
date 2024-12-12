import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const ReviewComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [status, setStatus] = useState("In review");
  const navigate = useNavigate();

  // Use useCallback to ensure fetchComplaints has a stable reference
  const fetchComplaints = useCallback(async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/complaints/status/${status}?user_role=admin`
      );
      const result = await response.json();
      console.log("API Response:", result);

      // Ensure complaints is always set as an array
      setComplaints(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  }, [status]); // Add `status` as a dependency to ensure it updates when status changes

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]); // Include fetchComplaints as a dependency

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Review Complaints</h1>

      <div className="mb-3">
        <button
          className={`btn btn-${
            status === "In review" ? "primary" : "secondary"
          } me-2`}
          onClick={() => setStatus("In review")}
        >
          In review
        </button>
        <button
          className={`btn btn-${
            status === "Resolved" ? "primary" : "secondary"
          }`}
          onClick={() => setStatus("Resolved")}
        >
          Resolved
        </button>
      </div>

      {complaints.length === 0 ? (
        <p>No complaints found for the selected status.</p>
      ) : (
        <div className="row">
          {complaints.map((complaint) => (
            <div
              key={complaint.id}
              className="col-md-4 mb-3"
              onClick={() =>
                navigate(`/complaint/${complaint.id}`, {
                  state: { from: status }, // Pass the status in the state
                })
              }
            >
              <div className="card shadow-sm">
                <div className="card-body">
                  <p className="card-text mb-2">
                    <strong>Complaint ID:</strong>{" "}
                    <span style={{ fontSize: "0.9rem" }}>{complaint.id}</span>
                  </p>
                  <p className="card-text mb-2">
                    <strong>Name:</strong> {complaint.firstname}{" "}
                    {complaint.lastname}
                  </p>
                  <p className="card-text mb-2">
                    <strong>Complaint Type:</strong> {complaint.issue_type}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span
                      className={`badge ${
                        status === "In review"
                          ? "bg-warning text-dark"
                          : "bg-success"
                      }`}
                    >
                      {status}
                    </span>
                    <button
                      className="btn btn-link text-decoration-none p-0"
                      onClick={() =>
                        navigate(`/complaint/${complaint.id}`, {
                          state: { from: status }, // Pass the status in the state
                        })
                      }
                    >
                      View Details &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewComplaints;
