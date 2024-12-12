import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const HomeContent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { userEmail, userRole } = useAuth();
  const { cartItems, addToCart, updateCart } = useCart();
  const ITEMS_PER_PAGE = 8;

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
    fetchApprovedProducts();
    fetchCategories();
    if (userEmail) {
      updateCart();
    }
  }, [userEmail, updateCart]);

  const fetchApprovedProducts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:8000/products/approved");
      setAllProducts(response.data);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching approved products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:8000/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const filteredProducts = allProducts.filter(product =>
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setProducts(filteredProducts);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    const selectedFilter = e.target.value;
    setFilter(selectedFilter);
    let filteredProducts = allProducts;
    if (selectedFilter) {
      filteredProducts = allProducts.filter(product => product.category === selectedFilter);
    }
    if (searchQuery) {
      filteredProducts = filteredProducts.filter(product =>
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setProducts(filteredProducts);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    const selectedSort = e.target.value;
    setSortOption(selectedSort);
    let sortedProducts = [...products];  // Create copy of products array

    if (selectedSort === "price-low-high") {
      sortedProducts.sort((a, b) => a.price - b.price);
    } 
    else if (selectedSort === "price-high-low") {
      sortedProducts.sort((a, b) => b.price - a.price);
    } 
    else if (selectedSort === "date-newest") {
      sortedProducts.sort((a, b) => 
        new Date(b.reviewed_at || b._id) - new Date(a.reviewed_at || a._id)
      );
    }
    else if (selectedSort === "date-oldest") {
      sortedProducts.sort((a, b) => 
        new Date(a.reviewed_at || a._id) - new Date(b.reviewed_at || b._id)
      );
    }

    setProducts(sortedProducts);
    setCurrentPage(1); // Reset to first page after sorting
};

  const handleAddToCart = async (product) => {
    if (!userEmail) {
      alert("Please log in to add items to your cart.");
      navigate('/login');
      return;
    }

    if (userRole !== 'buyer') {
      alert("Only buyers can add items to cart.");
      return;
    }

    try {
      const success = await addToCart(product);
      if (success) {
        alert("Product added to cart successfully!");
        await updateCart(); // Refresh cart after adding
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add product to cart. Please try again.");
    }
  };

  const isProductInCart = (product) => {
    return cartItems.some(cartItem => cartItem._id === product._id);
  };

  // Pagination calculations
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = products.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">Home Page</h2>

      <div className="row align-items-center g-3 mb-4">
        <div className="col-md-6">
          <form className="d-flex" onSubmit={handleSearch}>
            <input
              type="text"
              className="form-control me-2"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ minWidth: "300px" }}
            />
            <button type="submit" className="btn btn-outline-primary">Search</button>
          </form>
        </div>

        <div className="col-md-3">
          <div className="d-flex align-items-center">
            <label htmlFor="filter" className="form-label me-2 mb-0">Filter:</label>
            <select
              className="form-select"
              id="filter"
              value={filter}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-md-3">
          <div className="d-flex align-items-center">
            <label htmlFor="sort" className="form-label me-2 mb-0">Sort:</label>
            <select
                className="form-select" id="sort" value={sortOption} onChange={handleSortChange}>
               <option value="">Select sort option</option>
               <option value="price-low-high">Price: Low to High</option>
               <option value="price-high-low">Price: High to Low</option>
               <option value="date-newest">Date: Newest First</option>
               <option value="date-oldest">Date: Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {currentProducts.length === 0 ? (
        <div className="alert alert-info text-center">
          No products found matching your criteria.
        </div>
      ) : (
        <div className="row">
          {currentProducts.map((product) => (
            <div key={product._id} className="col-md-4 mb-4">
              <div className="card h-100">
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
                  <Link
                    to={`/product/${product._id}`}
                    className="text-decoration-none"
                  >
                    <h5 className="card-title text-primary">{product.product_name}</h5>
                  </Link>
                  <p className="card-text flex-grow-1" style={{
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: "3",
                    WebkitBoxOrient: "vertical"
                  }}>
                    {product.description}
                  </p>

                  <div className="mt-auto">
                    <p className="card-text mb-2">
                      <strong>Price:</strong> ${product.price.toFixed(2)}
                    </p>
                    <button
                      className={`btn ${isProductInCart(product) ? 'btn-secondary' : 'btn-primary'} w-100`}
                      onClick={() => handleAddToCart(product)}
                      disabled={isProductInCart(product)}
                    >
                      {isProductInCart(product) ? 'In Cart' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
            </li>
            {[...Array(totalPages)].map((_, index) => (
              <li
                key={index + 1}
                className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default HomeContent;