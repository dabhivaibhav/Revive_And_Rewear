import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProductReview = () => {
    const [product, setProduct] = useState(null);
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { productId } = useParams();
    const navigate = useNavigate();

    const carouselStyle = {
        height: '400px',
        overflow: 'hidden'
    };

    const imageStyle = {
        width: '100%',
        height: '400px',
        objectFit: 'contain',
        backgroundColor: '#f8f9fa'
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/products/${productId}`);
                setProduct(response.data);
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        };

        fetchProduct();
    }, [productId]);

    const handleDecision = async (isApproved) => {
        if (!comments.trim()) {
            alert('Please provide comments before submitting your decision.');
            return;
        }

        setIsSubmitting(true);
        try {
            const review_data = {
                isApproved: isApproved,
                admin_comments: comments,
                review_status: isApproved ? 'approved' : 'rejected'
            };

            await axios.put(
                `http://localhost:8000/products/${productId}/review`,
                review_data,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            alert(`Product has been ${isApproved ? 'approved' : 'denied'} successfully`);
            navigate('/unapproved-products');
        } catch (error) {
            console.error('Error updating product status:', error);
            alert('Failed to update product status. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!product) {
        return <div className="container mt-4">Loading...</div>;
    }

    return (
        <div className="container py-4">
            <button
                className="btn btn-outline-primary mb-4"
                onClick={() => navigate('/unapproved-products')}
            >
                <i className="bi bi-arrow-left"></i> Back to Products List
            </button>

            <div className="row">
                {/* Image Column */}
                <div className="col-md-6">
                    {product.images && product.images.length > 0 ? (
                        <div id="productCarousel" className="carousel slide" data-bs-ride="carousel" style={carouselStyle}>
                            <div className="carousel-inner">
                                {product.images.map((image, index) => (
                                    <div key={index} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                                        <img
                                            src={`http://localhost:8000/upload_images/${image}`}
                                            alt={`${product.product_name} ${index + 1}`}
                                            style={imageStyle}
                                        />
                                    </div>
                                ))}
                            </div>
                            {product.images.length > 1 && (
                                <>
                                    <button className="carousel-control-prev" type="button" data-bs-target="#productCarousel" data-bs-slide="prev">
                                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                        <span className="visually-hidden">Previous</span>
                                    </button>
                                    <button className="carousel-control-next" type="button" data-bs-target="#productCarousel" data-bs-slide="next">
                                        <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                        <span className="visually-hidden">Next</span>
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-center p-4 bg-light" style={{ height: "400px" }}>
                            No image available
                        </div>
                    )}
                </div>

                {/* Details Column */}
                <div className="col-md-6">
                    <h2>{product.product_name}</h2>
                    <p className="text-muted">Category: {product.category || 'N/A'}</p>
                    <p className="text-muted">Seller: {product.seller_id || 'N/A'}</p>
                    <h3 className="mt-3">${product.price.toFixed(2)}</h3>

                    <div className="mt-4">
                        <h4>Description</h4>
                        <p>{product.description}</p>
                    </div>

                    <div className="mt-4">
                        <h4>Review Comments</h4>
                        <textarea
                            className="form-control mb-3"
                            rows="4"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Enter your comments for the seller..."
                            required
                        />
                    </div>

                    <div className="d-flex gap-3 mt-4">
                        <button
                            className="btn btn-success btn-lg flex-grow-1"
                            onClick={() => handleDecision(true)}
                            disabled={isSubmitting}
                        >
                            Approve Product
                        </button>
                        <button
                            className="btn btn-danger btn-lg flex-grow-1"
                            onClick={() => handleDecision(false)}
                            disabled={isSubmitting}
                        >
                            Deny Product
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductReview;