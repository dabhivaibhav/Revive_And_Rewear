import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TrackingDetails = () => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { orderId } = useParams();
    const navigate = useNavigate();

    // Status styling
    const statusStyles = {
        placed: { color: 'bg-info', icon: 'bi-box', description: 'Order has been placed' },
        shipped: { color: 'bg-primary', icon: 'bi-truck', description: 'Order has been shipped' },
        in_transit: { color: 'bg-warning', icon: 'bi-arrow-right-circle', description: 'Order is in transit' },
        delivered: { color: 'bg-success', icon: 'bi-check-circle', description: 'Order has been delivered' },
        cancelled: { color: 'bg-danger', icon: 'bi-x-circle', description: 'Order has been cancelled' },
        return_requested: { color: 'bg-info', icon: 'bi-arrow-return-left', description: 'Return request initiated' },
        return_pickup_scheduled: { color: 'bg-primary', icon: 'bi-calendar', description: 'Return pickup scheduled' },
        return_picked: { color: 'bg-warning', icon: 'bi-box-arrow-left', description: 'Product picked up for return' },
        return_in_transit: { color: 'bg-info', icon: 'bi-truck', description: 'Product in transit back to seller' },
        returned: { color: 'bg-success', icon: 'bi-check-circle', description: 'Product returned to seller' }
    };

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/orders/${orderId}`);
                setOrder(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching order:', error);
                setError('Failed to fetch tracking details');
                setLoading(false);
            }
        };

        fetchOrderDetails();

        // Set up polling for status updates
        const interval = setInterval(async () => {
            if (order && !['delivered', 'cancelled', 'returned'].includes(order.status)) {
                try {
                    const response = await axios.put(`http://localhost:8000/orders/${orderId}/status`, {
                        status: order.status // Backend will calculate the correct status based on time
                    });
                    setOrder(response.data);
                } catch (error) {
                    console.error('Error updating status:', error);
                }
            }
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, [orderId, order?.status]);

    const handleBack = () => {
        navigate('/vieworders');
    };

    const getExpectedDelivery = () => {
        if (!order || !order.order_date) return null;

        const orderDate = new Date(order.order_date);
        const expectedDelivery = new Date(orderDate);
        expectedDelivery.setDate(orderDate.getDate() + 5); // Assuming 5 days delivery time

        return expectedDelivery.toLocaleDateString();
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
                            <h2 className="mb-0">Order Tracking</h2>
                        </div>
                        <span className={`badge ${statusStyles[order.status]?.color || 'bg-secondary'}`}>
                            {order.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                    </div>

                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <h5>Order Information</h5>
                                    <p><strong>Order ID:</strong> {order._id}</p>
                                    <p><strong>Order Date:</strong> {new Date(order.order_date).toLocaleString()}</p>
                                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                        <p><strong>Expected Delivery:</strong> {getExpectedDelivery()}</p>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <h5>Shipping Information</h5>
                                    <p><strong>Name:</strong> {order.shipping_address.name}</p>
                                    <p><strong>Address:</strong> {order.shipping_address.address}</p>
                                    <p><strong>Postal Code:</strong> {order.shipping_address.postal_code}</p>
                                </div>
                            </div>

                            <div className="tracking-timeline mt-5">
                                <h5 className="mb-4">Tracking Timeline</h5>
                                <div className="position-relative">
                                    {/* Progress line */}
                                    <div
                                        className="position-absolute h-100"
                                        style={{
                                            width: '2px',
                                            backgroundColor: '#e0e0e0',
                                            left: '15px',
                                            top: '0',
                                            zIndex: 1
                                        }}
                                    ></div>

                                    {/* Timeline items */}
                                    {order.tracking_history.map((track, index) => {
                                        const style = statusStyles[track.status] || { color: 'bg-secondary', icon: 'bi-circle' };
                                        return (
                                            <div key={index} className="timeline-item position-relative mb-4 ps-5">
                                                <div
                                                    className={`timeline-icon ${style.color} p-2 rounded-circle position-absolute`}
                                                    style={{
                                                        left: '0',
                                                        width: '32px',
                                                        height: '32px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        zIndex: 2
                                                    }}
                                                >
                                                    <i className={`bi ${style.icon} text-white`}></i>
                                                </div>
                                                <div className="timeline-content bg-light p-3 rounded">
                                                    <h6 className="mb-1">
                                                        {track.status.replace(/_/g, ' ').toUpperCase()}
                                                    </h6>
                                                    <p className="text-muted mb-1">{track.description}</p>
                                                    <small className="text-muted">
                                                        {new Date(track.timestamp).toLocaleString()}
                                                    </small>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                <div className="alert alert-info mt-4">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Your order is currently {order.status.replace(/_/g, ' ')}.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackingDetails;