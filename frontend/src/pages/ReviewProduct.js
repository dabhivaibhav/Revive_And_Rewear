import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ReviewProduct = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "error" or "success"
  const [reviewExists, setReviewExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchReviewDetails = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/reviews?orderId=${orderId}&userId=${user.email}`
        );
        const result = await response.json();

        if (response.ok && result.exists) {
          setReviewExists(true);
          setRating(result.review.rating); // Pre-fill rating
          setReviewText(result.review.reviewText || ""); // Pre-fill review text or keep it blank
          setMessageType("success");
          setMessage("A review for this order has already been submitted.");
        }
      } catch (error) {
        console.error("Error fetching review details:", error);
        setMessageType("error");
        setMessage("An error occurred while fetching the review.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviewDetails();
  }, [orderId, user.email]);

  const handleStarClick = (value) => {
    if (!reviewExists) {
      setRating(value);
      setMessage("");
      setMessageType("");
    }
  };

  const handleReviewTextChange = (e) => {
    if (!reviewExists) {
      setReviewText(e.target.value);
      setMessage("");
      setMessageType("");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();

    if (reviewExists) {
      setMessageType("error");
      setMessage("A review for this order has already been submitted.");
      return;
    }

    if (!rating) {
      setMessageType("error");
      setMessage("Please select a rating before submitting your review.");
      return;
    }

    const payload = {
      userId: user.email,
      orderId,
      rating,
      reviewText: reviewText.trim() || null,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setMessageType("success");
        setMessage("Your review has been submitted successfully.");
        setTimeout(() => navigate(-1), 2000);
      } else {
        setMessageType("error");
        setMessage(result.message);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      setMessageType("error");
      setMessage("An error occurred while submitting the review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="container mt-4">
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">
        <i className="bi bi-pencil-fill me-2"></i>
        {reviewExists ? "View Review" : "Review Product"}
      </h1>
      <form onSubmit={submitReview} className="mt-4">
        <div className="mb-4">
          <label htmlFor="rating" className="form-label">
            <i className="bi bi-star-fill me-2"></i>Rating:
          </label>
          <div className="d-flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <i
                key={star}
                className={`bi bi-star${rating >= star ? "-fill" : ""}`}
                style={{
                  cursor: reviewExists ? "not-allowed" : "pointer",
                  color: rating >= star ? "#ffc107" : "#e4e5e9",
                  fontSize: "24px",
                }}
                onClick={() => handleStarClick(star)}
              ></i>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="reviewText" className="form-label">
            <i className="bi bi-chat-left-text-fill me-2"></i>Review (Optional):
          </label>
          <textarea
            id="reviewText"
            className="form-control"
            rows="5"
            value={reviewText}
            onChange={handleReviewTextChange}
            placeholder={reviewExists && !reviewText ? "" : "Write your review here"}
            disabled={reviewExists}
          ></textarea>
        </div>

        <div className="d-flex justify-content-start">
          <button
            type="button"
            className="btn btn-secondary me-2"
            onClick={handleBack}
          >
            Back
          </button>
          {!reviewExists && (
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          )}
        </div>
      </form>
      {message && (
        <p
          className={`mt-4 text-center alert ${
            messageType === "error" ? "alert-danger" : "alert-primary"
          }`}
          style={{
            border: `2px solid ${messageType === "error" ? "red" : "blue"}`,
            color: `${messageType === "error" ? "red" : "blue"}`,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default ReviewProduct;
