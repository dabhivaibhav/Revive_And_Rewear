import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';  // Import useAuth
import 'bootstrap/dist/css/bootstrap.min.css';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();  // Get current user

  // Styles
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
    fetchProducts();
  }, []); // Add useEffect to fetch products when component mounts

  const fetchProducts = async () => {
    try {
      // Fetch products for the specific seller
      const response = await axios.get(`http://localhost:8000/products/seller/${user.business_name}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleEditClick = (product) => {
    navigate(`/edit-product/${product._id}`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: 'bg-success',
      rejected: 'bg-danger',
      pending: 'bg-warning'
    };

    return (
      <span className={`badge ${badges[status]} me-2`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleResubmit = async (product) => {
    if (window.confirm('Are you sure you want to resubmit this product for review?')) {
      try {
        const response = await axios.put(
          `http://localhost:8000/products/${product._id}/resubmit`,
          {},  // Empty body since we're handling all changes on backend
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.status === 200) {
          alert('Product has been resubmitted for review');
          fetchProducts(); // Refresh the product list
        } else {
          throw new Error('Failed to resubmit product');
        }
      } catch (error) {
        console.error('Error resubmitting product:', error);
        alert('Failed to resubmit product. Please try again.');
      }
    }
  };

  const getActionButton = (product) => {
    switch (product.status.toLowerCase()) {
      case 'approved':
        return (
          <button
            className="btn btn-primary mt-auto"
            onClick={() => handleEditClick(product)}
          >
            Edit Product
          </button>
        );
      case 'rejected':
        return (
          <div className="d-grid gap-2">
            <button
              className="btn btn-primary mt-auto"
              onClick={() => handleEditClick(product)}
            >
              Edit Product
            </button>
            <button
              className="btn btn-success"
              onClick={() => handleResubmit(product)}
            >
              Resubmit for Review
            </button>
          </div>
        );
      case 'pending':
        return (
          <button className="btn btn-secondary mt-auto" disabled>
            Pending Review
          </button>
        );
      default:
        return (
          <button className="btn btn-secondary mt-auto" disabled>
            Status: {product.status}
          </button>
        );
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Manage Products</h2>
      <div className="row">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product._id} className="col-md-4 mb-4">
              <div className="card h-100">
                {/* Add back the carousel section */}
                {product.images && product.images.length > 0 ? (
                  <div id={`carousel-${product._id}`} className="carousel slide" data-bs-ride="carousel" style={carouselStyle}>
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
                  <div className="d-flex justify-content-between align-items-start">
                    <h5 className="card-title">{product.product_name}</h5>
                    {getStatusBadge(product.status)}
                  </div>

                  <p className="card-text">
                    <strong>Category:</strong> {product.category || 'N/A'}
                  </p>
                  <p className="card-text flex-grow-1" style={{
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: "3",
                    WebkitBoxOrient: "vertical"
                  }}>
                    {product.description}
                  </p>
                  <p className="card-text">
                    <strong>Price:</strong> ${product.price ? product.price.toFixed(2) : 'N/A'}
                  </p>

                  {product.admin_comments && (
                    <div className="mt-2 mb-3">
                      <div className={`card ${product.status === 'rejected' ? 'border-danger' : 'border-success'}`}>
                        <div className="card-body py-2 px-3">
                          <h6 className="card-subtitle mb-1 text-muted">Admin Comments</h6>
                          <p className="card-text small mb-1">{product.admin_comments}</p>
                          {product.reviewed_at && (
                            <small className="text-muted">
                              Reviewed on: {new Date(product.reviewed_at).toLocaleDateString()}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {getActionButton(product)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col">
            <p>No products found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProducts;