import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCart } from '../contexts/CartContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useCart();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <style>
        {`
          .custom-navbar {
            padding: 1rem 0;
            background-color: white !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }

          .navbar-brand {
            font-size: 1.8rem;
            font-weight: bold;
            color: #0d6efd !important;
            transition: color 0.3s ease;
          }

          .navbar-brand:hover {
            color: #0b5ed7 !important;
          }

          .navbar-nav .nav-link {
            font-size: 1rem;
            font-weight: 500;
            padding: 0.5rem 1rem;
            color: #4a5568 !important;
            transition: all 0.3s ease;
            border-radius: 8px;
            margin: 0 0.2rem;
          }

          .navbar-nav .nav-link:hover {
            color: #0d6efd !important;
            background-color: #f8f9fa;
            transform: translateY(-1px);
          }

          .nav-item {
            margin: 0 0.2rem;
          }

          .btn-primary {
            padding: 0.5rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            transition: all 0.3s ease;
            border: none;
            background-color: #0d6efd;
            box-shadow: 0 2px 4px rgba(13, 110, 253, 0.2);
            color: white !important;
          }

          .btn-primary:hover {
            background-color: #0b5ed7 !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(13, 110, 253, 0.3);
          }

          .welcome-text {
            color: #4a5568;
            font-weight: 500;
          }

          .cart-badge {
            position: absolute;
            top: -5px;
            right: -8px;
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 999px;
            background-color: #dc3545;
            color: white;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .navbar-toggler {
            border: none;
            padding: 0.5rem;
          }

          .navbar-toggler:focus {
            box-shadow: none;
            outline: none;
          }

          .navbar-toggler-icon {
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(13, 110, 253, 1)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
          }

          @media (max-width: 992px) {
            .navbar-collapse {
              background-color: white;
              padding: 1rem;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              margin-top: 1rem;
            }

            .navbar-nav .nav-link {
              padding: 0.75rem 1rem;
            }

            .nav-item {
              margin: 0.2rem 0;
            }
          }
        `}
      </style>

      <header>
        <nav className="navbar navbar-expand-lg custom-navbar">
          <div className="container">
            <Link className="navbar-brand" to="/">
              Revive & Rewear
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto align-items-center">
                {!user ? (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/register">Register</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/seller-register">Register Seller</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/admin-register">Register Admin</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="btn btn-primary" to="/login">Login</Link>
                    </li>
                  </>
                ) : user.role === 'buyer' ? (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/">Home</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/manage-profile">Manage Profile</Link>
                    </li>
                    <li className="nav-item position-relative">
                      <Link className="nav-link" to="/cart">
                        Cart
                        {cartItems.length > 0 && (
                          <span className="badge cart-badge">
                            {cartItems.length}
                          </span>
                        )}
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/manage-payments">Payment Methods</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/vieworders">My Orders</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/complaints">Complaints</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/contactus">Contact Us</Link>
                    </li>
                    <li className="nav-item">
                      <span className="nav-link welcome-text">
                        Welcome, {user.first_name}
                      </span>
                    </li>
                    <li className="nav-item">
                      <button onClick={handleLogout} className="btn btn-primary">
                        Logout
                      </button>
                    </li>
                  </>
                ) : user.role === 'seller' ? (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/">Home</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/manage-profile">Manage Profile</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/uploadProducts">Upload Products</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/manage-products">Manage Products</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/manage-coupons">Create Coupons</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/contactus">Contact Us</Link>
                    </li>
                    <li className="nav-item">
                      <span className="nav-link welcome-text">
                        Welcome, {user.first_name}
                      </span>
                    </li>
                    <li className="nav-item">
                      <button onClick={handleLogout} className="btn btn-primary">
                        Logout
                      </button>
                    </li>
                  </>
                ) : user.role === 'admin' ? (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/">Home</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/manage-profile">Manage Profile</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/unapproved-products">Verify Products</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/manage-categories">Manage Categories</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/review-complaints">Review Complaints</Link>
                    </li>
                    <li className="nav-item">
                      <span className="nav-link welcome-text">
                        Welcome, {user.first_name}
                      </span>
                    </li>
                    <li className="nav-item">
                      <button onClick={handleLogout} className="btn btn-primary">
                        Logout
                      </button>
                    </li>
                  </>
                ) : null}
              </ul>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;