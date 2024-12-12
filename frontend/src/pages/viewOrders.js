import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ViewOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userEmail = localStorage.getItem("userEmail");
  const navigate = useNavigate();

  const carouselStyle = {
    height: "200px",
    overflow: "hidden",
    backgroundColor: "#f8f9fa",
    position: "relative",
  };

  const imageStyle = {
    width: "100%",
    height: "200px",
    objectFit: "contain",
    backgroundColor: "#f8f9fa",
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userEmail) {
        setError("User email not found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:8000/orders/user?email=${userEmail}`
        );

        setOrders(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to fetch orders. Please try again later.");
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userEmail]);

  const handleViewDetails = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  const handleTrackOrder = (orderId) => {
    navigate(`/order/${orderId}/tracking`);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      await axios.put(`http://localhost:8000/orders/${orderId}/status`, {
        status: "cancelled",
      });

      const response = await axios.get(
        `http://localhost:8000/orders/user?email=${userEmail}`
      );
      setOrders(response.data);
      alert("Order cancelled successfully");
    } catch (error) {
      alert("Failed to cancel order");
    }
  };

  const handleReviewProduct = (orderId) => {
    navigate(`/review-product/${orderId}`);
  };

  const renderCarousel = (item, orderId, itemIndex) => {
    const images = Array.isArray(item.images) ? item.images : [item.image];
    const carouselId = `carousel-${orderId}-${itemIndex}`;

    return (
      <div id={carouselId} className="carousel slide" style={carouselStyle}>
        <div className="carousel-indicators">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              data-bs-target={`#${carouselId}`}
              data-bs-slide-to={idx}
              className={idx === 0 ? "active" : ""}
              aria-current={idx === 0 ? "true" : "false"}
              aria-label={`Slide ${idx + 1}`}
            ></button>
          ))}
        </div>

        <div className="carousel-inner h-100">
          {images.map((image, idx) => (
            <div
              key={idx}
              className={`carousel-item h-100 ${idx === 0 ? "active" : ""}`}
            >
              <img
                src={`http://localhost:8000/upload_images/${image}`}
                className="d-block w-100 h-100"
                alt={`${item.product_name} - ${idx + 1}`}
                style={imageStyle}
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target={`#${carouselId}`}
              data-bs-slide="prev"
            >
              <span
                className="carousel-control-prev-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target={`#${carouselId}`}
              data-bs-slide="next"
            >
              <span
                className="carousel-control-next-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Next</span>
            </button>
          </>
        )}
      </div>
    );
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "placed":
        return "bg-info";
      case "shipped":
        return "bg-primary";
      case "in_transit":
        return "bg-warning";
      case "delivered":
        return "bg-success";
      case "cancelled":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Your Orders</h2>
      {orders.length === 0 ? (
        <div className="alert alert-info">No orders found.</div>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="card mb-4">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Order ID: {order._id}</h5>
              <span
                className={`badge ${getStatusBadgeColor(
                  order.status
                )} text-white`}
              >
                {order.status.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <p>
                    <strong>Order Date:</strong>{" "}
                    {new Date(order.order_date).toLocaleString()}
                  </p>
                  <p>
                    <strong>Total Amount:</strong> $
                    {order.total_amount.toFixed(2)}
                  </p>
                </div>
                <div className="col-md-6 text-md-end">
                  <div className="d-flex gap-2 justify-content-md-end">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleViewDetails(order._id)}
                    >
                      <i className="bi bi-eye me-1"></i> View Details
                    </button>
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => handleTrackOrder(order._id)}
                    >
                      <i className="bi bi-truck me-1"></i> Track Order
                    </button>
                    {order.status === "delivered" && (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleReviewProduct(order._id)}
                      >
                        <i className="bi bi-pencil me-1"></i> Review Product
                      </button>
                    )}
                    {order.can_cancel && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelOrder(order._id)}
                      >
                        <i className="bi bi-x-circle me-1"></i> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {order.items.map((item, index) => (
                <div key={index} className="card mb-3">
                  <div className="row g-0 align-items-center">
                    <div className="col-md-2">
                      {renderCarousel(item, order._id, index)}
                    </div>
                    <div className="col-md-10">
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-8">
                            <h5 className="card-title">{item.product_name}</h5>
                            <p className="card-text">
                              Quantity: {item.quantity} × $
                              {item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="col-md-4 text-md-end">
                            <p className="card-text">
                              <strong>
                                Subtotal: $
                                {(item.quantity * item.price).toFixed(2)}
                              </strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ViewOrders;