import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const UnapprovedProductsPage = () => {
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();

    const carouselStyle = {
        height: '200px',
        overflow: 'hidden'
    };

    const imageStyle = {
        width: '100%',
        height: '200px',
        objectFit: 'contain',
        backgroundColor: '#f8f9fa'
    };

    useEffect(() => {
        const fetchUnapprovedProducts = async () => {
            try {
                const response = await axios.get('http://localhost:8000/products/unapproved');
                setProducts(response.data);
            } catch (error) {
                console.error('Error fetching unapproved products:', error);
            }
        };
        fetchUnapprovedProducts();
    }, []);

    const handleReviewClick = (productId) => {
        navigate(`/admin/review-product/${productId}`);
    };

    return (
        <div className="container py-4">
            <h1 className="mb-4">Review Products</h1>
            {products.length === 0 ? (
                <div className="alert alert-info">No unapproved products found.</div>
            ) : (
                <div className="row">
                    {products.map(product => (
                        <div key={product._id} className="col-md-4 mb-4">
                            <div className="card h-100">
                                {product.images && product.images.length > 0 ? (
                                    <div 
                                        id={`carousel-${product._id}`} 
                                        className="carousel slide" 
                                        data-bs-ride="carousel" 
                                        style={carouselStyle}
                                    >
                                        <div className="carousel-inner">
                                            {product.images.map((image, index) => (
                                                <div 
                                                    key={index} 
                                                    className={`carousel-item ${index === 0 ? 'active' : ''}`}
                                                >
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
                                                <button 
                                                    className="carousel-control-prev" 
                                                    type="button" 
                                                    data-bs-target={`#carousel-${product._id}`} 
                                                    data-bs-slide="prev"
                                                >
                                                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                                    <span className="visually-hidden">Previous</span>
                                                </button>
                                                <button 
                                                    className="carousel-control-next" 
                                                    type="button" 
                                                    data-bs-target={`#carousel-${product._id}`} 
                                                    data-bs-slide="next"
                                                >
                                                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                                    <span className="visually-hidden">Next</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center p-4 bg-light" style={{ height: "200px" }}>
                                        No image available
                                    </div>
                                )}

                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title">{product.product_name}</h5>
                                    <p className="card-text flex-grow-1" style={{
                                        overflow: "hidden",
                                        display: "-webkit-box",
                                        WebkitLineClamp: "3",
                                        WebkitBoxOrient: "vertical"
                                    }}>
                                        {product.description}
                                    </p>
                                    <div className="mt-auto">
                                        <p className="card-text">
                                            <strong>Price:</strong> ${product.price.toFixed(2)}
                                        </p>
                                        {product.category && (
                                            <p className="card-text">
                                                <strong>Category:</strong> {product.category}
                                            </p>
                                        )}
                                        {product.seller_id && (
                                            <p className="card-text">
                                                <strong>Seller:</strong> {product.seller_id}
                                            </p>
                                        )}
                                        <button 
                                            className="btn btn-primary w-100"
                                            onClick={() => handleReviewClick(product._id)}
                                        >
                                            Review Product
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

export default UnapprovedProductsPage;