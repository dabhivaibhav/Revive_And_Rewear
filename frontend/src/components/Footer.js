import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <>
      <style>
        {`
          .footer {
            background-color: white;
            padding: 2rem 0;
            margin-top: auto;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
          }

          .footer-brand {
            font-size: 1.2rem;
            font-weight: bold;
            color: #0d6efd;
            text-decoration: none;
            transition: color 0.3s ease;
          }

          .footer-brand:hover {
            color: #0b5ed7;
          }

          .footer-link {
            color: #4a5568;
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.3s ease;
            padding: 0.5rem 1rem;
          }

          .footer-link:hover {
            color: #0d6efd;
          }

          .footer-divider {
            border-top: 1px solid #e2e8f0;
            margin: 1rem 0;
          }

          .copyright {
            color: #4a5568;
            font-size: 0.9rem;
          }

          @media (max-width: 768px) {
            .footer-links {
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
            }
          }
        `}
      </style>

      <footer className="footer">
        <div className="container">
          <div className="row align-items-center">
            {/* Brand */}
            <div className="col-md-3 text-center text-md-start mb-3 mb-md-0">
              <Link to="/" className="footer-brand">
                Revive & Rewear
              </Link>
            </div>

            {/* Links */}
            <div className="col-md-6 text-center mb-3 mb-md-0">
              <div className="footer-links">
                <Link to="/about" className="footer-link">About</Link>
                <Link to="/contactus" className="footer-link">Contact</Link>
                <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
                <Link to="/terms-conditions" className="footer-link">Terms</Link>
              </div>
            </div>

            {/* Copyright */}
            <div className="col-md-3 text-center text-md-end">
              <span className="copyright">
                © {new Date().getFullYear()} Revive & Rewear
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;