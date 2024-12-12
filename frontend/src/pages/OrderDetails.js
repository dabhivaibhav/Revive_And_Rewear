import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrderDetails = () => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { orderId } = useParams();
    const navigate = useNavigate();

    const carouselStyle = {
        height: '300px',
        overflow: 'hidden',
        backgroundColor: '#f8f9fa'
    };

    const imageStyle = {
        width: '100%',
        height: '300px',
        objectFit: 'contain',
        backgroundColor: '#f8f9fa'
    };

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/orders/${orderId}`);
                setOrder(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching order:', error);
                setError('Failed to fetch order details');
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    useEffect(() => {
        if (order) {
            const initCarousels = () => {
                const carousels = document.querySelectorAll('.carousel');
                carousels.forEach(carousel => {
                    if (!window.bootstrap.Carousel.getInstance(carousel)) {
                        new window.bootstrap.Carousel(carousel, {
                            interval: false,
                            wrap: true
                        });
                    }
                });
            };

            initCarousels();
        }
    }, [order]);

    const renderProductImages = (item) => {
        let imageArray = [];
        
        if (item.images && Array.isArray(item.images) && item.images.length > 0) {
            imageArray = item.images;
        } else if (item.image && typeof item.image === 'string') {
            imageArray = [item.image];
        } else {
            return (
                <div className="text-center p-4 bg-light" style={{ height: "300px" }}>
                    No images available
                </div>
            );
        }

        const carouselId = `carousel-${item.product_id}`;

        return (
            <div id={carouselId} className="carousel slide" data-bs-ride="false" style={carouselStyle}>
                <div className="carousel-inner">
                    {imageArray.map((image, idx) => (
                        <div key={idx} className={`carousel-item ${idx === 0 ? 'active' : ''}`}>
                            <img
                                src={`http://localhost:8000/upload_images/${image}`}
                                alt={`${item.product_name} ${idx + 1}`}
                                style={imageStyle}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'placeholder.jpg';
                                }}
                            />
                        </div>
                    ))}
                </div>

                {imageArray.length > 1 && (
                    <>
                        <button className="carousel-control-prev" type="button" data-bs-target={`#${carouselId}`} data-bs-slide="prev">
                            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Previous</span>
                        </button>
                        <button className="carousel-control-next" type="button" data-bs-target={`#${carouselId}`} data-bs-slide="next">
                            <span className="carousel-control-next-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Next</span>
                        </button>
                    </>
                )}
            </div>
        );
    };

    const handleBack = () => {
        navigate('/vieworders');
    };

    const handleTrackOrder = () => {
        navigate(`/order/${orderId}/tracking`);
    };

    const handleCancelOrder = async () => {
        try {
            if (!order.can_cancel) {
                alert('This order can no longer be cancelled');
                return;
            }

            if (!window.confirm('Are you sure you want to cancel this order?')) {
                return;
            }

            await axios.put(`http://localhost:8000/orders/${orderId}/status`, {
                status: 'cancelled'
            });
            
            const response = await axios.get(`http://localhost:8000/orders/${orderId}`);
            setOrder(response.data);
            alert('Order cancelled successfully');
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Failed to cancel order');
        }
    };

    const handleReturnOrder = async () => {
        try {
            if (!order.can_return) {
                alert('This order is not eligible for return yet');
                return;
            }

            if (!window.confirm('Are you sure you want to return this order?')) {
                return;
            }

            await axios.put(`http://localhost:8000/orders/${orderId}/status`, {
                status: 'return_requested'
            });
            
            const response = await axios.get(`http://localhost:8000/orders/${orderId}`);
            setOrder(response.data);
            alert('Return request submitted successfully');
        } catch (error) {
            console.error('Error requesting return:', error);
            alert('Failed to submit return request');
        }
    };

    if (loading) return (
        <div className="container mt-5">
            <div className="text-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="container mt-5">
            <div className="alert alert-danger" role="alert">{error}</div>
        </div>
    );

    if (!order) return (
        <div className="container mt-5">
            <div className="alert alert-info">Order not found</div>
        </div>
    );

    return (
        <div className="container py-5">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center gap-3">
                            <button onClick={handleBack} className="btn btn-outline-primary">
                                <i className="bi bi-arrow-left"></i> Back to Orders
                            </button>
                            <h2 className="mb-0">Order Details</h2>
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                            <button onClick={handleTrackOrder} className="btn btn-info">
                                <i className="bi bi-truck me-2"></i>Track Order
                            </button>
                            <span className={`badge bg-${order.status === 'delivered' ? 'success' : 
                                           order.status === 'cancelled' ? 'danger' : 
                                           order.status === 'return_requested' ? 'warning' : 'primary'}`}>
                                {order.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <h5>Order Information</h5>
                                    <p><strong>Order ID:</strong> {order._id}</p>
                                    <p><strong>Order Date:</strong> {new Date(order.order_date).toLocaleString()}</p>
                                    <p><strong>Total Amount:</strong> ${order.total_amount.toFixed(2)}</p>
                                </div>
                                <div className="col-md-6">
                                    <h5>Shipping Information</h5>
                                    <p><strong>Name:</strong> {order.shipping_address.name}</p>
                                    <p><strong>Address:</strong> {order.shipping_address.address}</p>
                                    <p><strong>Postal Code:</strong> {order.shipping_address.postal_code}</p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h5>Items Ordered</h5>
                                {order.items.map((item) => (
                                    <div key={item.product_id} className="card mb-3">
                                        <div className="row g-0">
                                            <div className="col-md-4">
                                                {renderProductImages(item)}
                                            </div>
                                            <div className="col-md-8">
                                                <div className="card-body">
                                                    <h5 className="card-title">{item.product_name}</h5>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <p className="card-text">Quantity: {item.quantity}</p>
                                                            <p className="card-text">Price per item: ${item.price.toFixed(2)}</p>
                                                        </div>
                                                        <div className="col-md-6 text-md-end">
                                                            <p className="card-text">
                                                                <strong>Subtotal: ${(item.price * item.quantity).toFixed(2)}</strong>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 d-flex gap-2">
                                {order.can_cancel && (
                                    <button className="btn btn-danger" onClick={handleCancelOrder}>
                                        <i className="bi bi-x-circle me-2"></i>Cancel Order
                                    </button>
                                )}
                                {order.can_return && (
                                    <button className="btn btn-warning" onClick={handleReturnOrder}>
                                        <i className="bi bi-arrow-return-left me-2"></i>Return Order
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;