import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Cart = () => {
  const navigate = useNavigate();
  const { userEmail } = useAuth();
  const { cartItems, removeFromCart, updateCart } = useCart();

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

  const handleProceedToCheckout = () => {
    navigate('/payments', {
      state: {
        cart: cartItems,
        total: total.toFixed(2)
      }
    });
  };

  const handleRemoveFromCart = async (productId) => {
    await removeFromCart(productId);
    updateCart();
  };

  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Shopping Cart</h2>
        <span className="badge bg-primary rounded-pill">{cartItems.length} items</span>
      </div>

      {cartItems.length === 0 ? (
        <div className="alert alert-info text-center">
          Your cart is empty.
        </div>
      ) : (
        <>
          {cartItems.map((item) => (
            <div key={item._id} className="card mb-4">
              <div className="row g-0">
                <div className="col-md-4">
                  {item.images && item.images.length > 0 ? (
                    <div id={`carousel-${item._id}`} className="carousel slide" data-bs-ride="carousel" style={carouselStyle}>
                      <div className="carousel-inner">
                        {item.images.map((image, index) => (
                          <div key={index} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                            <img
                              src={`http://localhost:8000/upload_images/${image}`}
                              alt={`${item.product_name} ${index + 1}`}
                              style={imageStyle}
                            />
                          </div>
                        ))}
                      </div>
                      {item.images.length > 1 && (
                        <>
                          <button
                            className="carousel-control-prev"
                            type="button"
                            data-bs-target={`#carousel-${item._id}`}
                            data-bs-slide="prev"
                          >
                            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Previous</span>
                          </button>
                          <button
                            className="carousel-control-next"
                            type="button"
                            data-bs-target={`#carousel-${item._id}`}
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
                </div>
                <div className="col-md-8">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="card-title">{item.product_name}</h5>
                        <p className="card-text text-muted">{item.category}</p>
                      </div>
                      <div className="text-end">
                        <h5 className="text-primary mb-2">${(item.price * item.quantity).toFixed(2)}</h5>
                        <p className="text-muted mb-0">
                          ${item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="card-text mt-3">{item.description}</p>
                    <button
                      onClick={() => handleRemoveFromCart(item._id)}
                      className="btn btn-outline-danger btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="card mt-4">
            <div className="card-body">
              <h4 className="card-title">Order Summary</h4>
              <div className="d-flex justify-content-between mb-3">
                <span>Total ({cartItems.length} items)</span>
                <span className="h5 mb-0">${total.toFixed(2)}</span>
              </div>
              <button
                className="btn btn-primary w-100"
                onClick={handleProceedToCheckout}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;