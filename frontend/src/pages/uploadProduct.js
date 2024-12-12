import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UploadProducts = () => {
  const { user } = useAuth();
  const sellerId = user?.business_name;
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState([
    { productName: '', description: '', price: '', category: '', imageFiles: [], imagePreviews: [] }
  ]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleProductChange = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };

  const handleImageChange = (e, productIndex) => {
    const files = Array.from(e.target.files);
    const newProducts = [...products];

    // Create previews for the new images
    const previews = files.map(file => URL.createObjectURL(file));

    newProducts[productIndex].imageFiles = [
      ...newProducts[productIndex].imageFiles,
      ...files
    ];
    newProducts[productIndex].imagePreviews = [
      ...newProducts[productIndex].imagePreviews,
      ...previews
    ];

    setProducts(newProducts);
  };

  const handleRemoveImage = (productIndex, imageIndex) => {
    const newProducts = [...products];

    // Clean up the preview URL before removing
    URL.revokeObjectURL(newProducts[productIndex].imagePreviews[imageIndex]);

    // Remove the file and preview
    newProducts[productIndex].imageFiles = newProducts[productIndex].imageFiles.filter((_, index) => index !== imageIndex);
    newProducts[productIndex].imagePreviews = newProducts[productIndex].imagePreviews.filter((_, index) => index !== imageIndex);

    setProducts(newProducts);
  };

  const handleAddProduct = () => {
    setProducts([
      ...products,
      { productName: '', description: '', price: '', category: '', imageFiles: [], imagePreviews: [] }
    ]);
  };

  const handleRemoveProduct = (index) => {
    // Clean up all preview URLs for the product being removed
    products[index].imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    
    const newProducts = [...products];
    newProducts.splice(index, 1);
    setProducts(newProducts);
  };

  const resetFileInputs = () => {
    products.forEach((_, index) => {
      const fileInput = document.querySelector(`#file-input-${index}`);
      if (fileInput) {
        fileInput.value = '';
      }
    });
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      // Clean up all preview URLs
      products.forEach(product => {
        product.imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
      });
      resetFileInputs();
      setProducts([{
        productName: '',
        description: '',
        price: '',
        category: '',
        imageFiles: [],
        imagePreviews: []
      }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    for (const product of products) {
      if (!product.productName || !product.description || !product.price || !product.category || product.imageFiles.length === 0) {
          alert('Please fill in all required fields and upload at least one image for each product');
          return;
      }
    }

    const formData = new FormData();

    // File validation and formData preparation
    for (const product of products) {
      // File validation
      for (const file of product.imageFiles) {
        if (file.size > (5 * 1024 * 1024)) {
          alert(`Image ${file.name} is too large. Maximum size is 5MB`);
          return;
        }

        const allowedFormats = ['.jpg', '.jpeg', '.png'];
        const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!allowedFormats.includes(fileExt)) {
          alert(`Invalid file format for ${file.name}. Allowed formats: jpg, jpeg, png`);
          return;
        }
      }
    }

    // Prepare form data
    products.forEach((product) => {
      formData.append('product_names', product.productName);
      formData.append('descriptions', product.description);
      formData.append('prices', product.price);
      formData.append('categories', product.category);
      formData.append('seller_ids', sellerId);

      product.imageFiles.forEach((file) => {
        formData.append('images', file);
      });
    });

    try {
      setIsSubmitting(true);
      const response = await fetch('http://localhost:8000/upload-products', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Clean up preview URLs
        products.forEach(product => {
          product.imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
        });

        // Reset file inputs and form
        resetFileInputs();
        setProducts([{
          productName: '',
          description: '',
          price: '',
          category: '',
          imageFiles: [],
          imagePreviews: []
        }]);

        alert('Products uploaded successfully! You will receive a confirmation email shortly.');
      } else {
        throw new Error(data.detail || 'Failed to upload products');
      }
    } catch (error) {
      console.error('Error uploading products:', error);
      alert(error.message || 'Error uploading products. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Upload Products</h2>
      <br/>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {products.map((product, productIndex) => (
          <div key={productIndex} className="mb-5">
            <h4>Product {productIndex + 1}</h4>
            <div className="mb-3">
              <label>Product Name</label>
              <input
                type="text"
                className="form-control"
                value={product.productName}
                onChange={(e) => handleProductChange(productIndex, 'productName', e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label>Description</label>
              <textarea
                className="form-control"
                value={product.description}
                onChange={(e) => handleProductChange(productIndex, 'description', e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label>Price</label>
              <input
                type="number"
                className="form-control"
                value={product.price}
                onChange={(e) => handleProductChange(productIndex, 'price', e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label>Category</label>
              <select
                className="form-control"
                value={product.category}
                onChange={(e) => handleProductChange(productIndex, 'category', e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label>Images</label>
              <input
                id={`file-input-${productIndex}`}
                type="file"
                accept="image/*"
                multiple
                className="form-control"
                onChange={(e) => handleImageChange(e, productIndex)}
              />
              {product.imagePreviews.length > 0 && (
                <div className="mt-3">
                  <div className="d-flex flex-wrap gap-2">
                    {product.imagePreviews.map((preview, imageIndex) => (
                      <div key={imageIndex} className="position-relative">
                        <img
                          src={preview}
                          alt={`Preview ${imageIndex + 1}`}
                          style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover'
                          }}
                          className="rounded"
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm position-absolute top-0 end-0"
                          onClick={() => handleRemoveImage(productIndex, imageIndex)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {products.length > 1 && (
              <div className="mb-3">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleRemoveProduct(productIndex)}
                >
                  Remove Product
                </button>
              </div>
            )}
            <hr />
          </div>
        ))}
        <div className="d-flex justify-content-between align-items-center">
          <button
            type="button"
            className="btn btn-primary mb-3"
            onClick={handleAddProduct}
          >
            Add Another Product
          </button>
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-danger me-2"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Uploading...
                </>
              ) : products.length > 1 ? 'Upload All Products' : 'Submit for Review'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UploadProducts;