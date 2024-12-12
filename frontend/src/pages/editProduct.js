import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditProduct = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [updatedProduct, setUpdatedProduct] = useState({
        product_name: '',
        description: '',
        price: '',
        category: '',
        images: []
    });
    const [newImages, setNewImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);

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
                const product = response.data;
                setUpdatedProduct({
                    product_name: product.product_name,
                    description: product.description,
                    price: product.price,
                    category: product.category || '',
                    images: product.images || []
                });
                setPreviewImages(product.images.map(img =>
                    `http://localhost:8000/upload_images/${img}`
                ));
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        };

        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:8000/categories');
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchProduct();
        fetchCategories();
    }, [productId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        if (name === 'price') {
            processedValue = parseFloat(value) || 0;
        }

        setUpdatedProduct(prev => ({
            ...prev,
            [name]: processedValue
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setNewImages(prevImages => [...prevImages, ...files]);
        
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviewImages(prevPreviews => [...prevPreviews, ...newPreviews]);
    };

    const handleDeleteImage = (index) => {
        if (previewImages[index].startsWith('blob:')) {
            URL.revokeObjectURL(previewImages[index]);
        }

        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setUpdatedProduct(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        try {
            const formData = new FormData();

            formData.append('product_name', updatedProduct.product_name);
            formData.append('description', updatedProduct.description);
            formData.append('price', updatedProduct.price);
            formData.append('category', updatedProduct.category);

            updatedProduct.images.forEach((image) => {
                formData.append('existing_images', image);
            });

            newImages.forEach((file) => {
                formData.append('new_images', file);
            });

            await axios.put(
                `http://localhost:8000/manage_products/${productId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            alert('Product updated successfully');
            navigate('/manage-products');
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Failed to update product');
        }
    };

    return (
        <div className="container py-4">
            <button 
                className="btn btn-outline-primary mb-4"
                onClick={() => navigate('/manage-products')}
            >
                <i className="bi bi-arrow-left"></i> Back to Manage Products
            </button>

            <div className="row">
                <div className="col-md-6">
                    {previewImages.length > 0 ? (
                        <div id={`carousel-${productId}`} className="carousel slide" data-bs-ride="carousel" style={carouselStyle}>
                            <div className="carousel-inner">
                                {previewImages.map((image, index) => (
                                    <div key={index} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                                        <img
                                            src={image}
                                            alt={`Product ${index + 1}`}
                                            style={imageStyle}
                                        />
                                    </div>
                                ))}
                            </div>
                            {previewImages.length > 1 && (
                                <>
                                    <button 
                                        className="carousel-control-prev" 
                                        type="button" 
                                        data-bs-target={`#carousel-${productId}`} 
                                        data-bs-slide="prev"
                                    >
                                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                        <span className="visually-hidden">Previous</span>
                                    </button>
                                    <button 
                                        className="carousel-control-next" 
                                        type="button" 
                                        data-bs-target={`#carousel-${productId}`} 
                                        data-bs-slide="next"
                                    >
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

                    <div className="mt-4">
                        <h4>Manage Images</h4>
                        <input
                            type="file"
                            className="form-control mb-3"
                            onChange={handleImageChange}
                            accept="image/*"
                            multiple
                        />
                        
                        <div className="d-flex flex-wrap gap-2">
                            {previewImages.map((img, index) => (
                                <div key={index} className="position-relative">
                                    <img
                                        src={img}
                                        alt={`Preview ${index}`}
                                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                        className="rounded"
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm position-absolute top-0 end-0"
                                        onClick={() => handleDeleteImage(index)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <h2>Edit Product</h2>
                    <div className="mb-3">
                        <label className="form-label">Product Name</label>
                        <input
                            type="text"
                            className="form-control"
                            name="product_name"
                            value={updatedProduct.product_name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Category</label>
                        <select
                            className="form-select"
                            name="category"
                            value={updatedProduct.category}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                                <option key={category._id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-control"
                            name="description"
                            value={updatedProduct.description}
                            onChange={handleInputChange}
                            rows="5"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label">Price</label>
                        <input
                            type="number"
                            className="form-control"
                            name="price"
                            value={updatedProduct.price}
                            onChange={handleInputChange}
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleSave}
                        >
                            Save Changes
                        </button>
                        <button
                            className="btn btn-secondary btn-lg"
                            onClick={() => navigate('/manage-products')}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProduct;