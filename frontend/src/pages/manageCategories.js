import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageCategories = () => {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [editName, setEditName] = useState('');

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await axios.get('http://localhost:8000/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Add new category
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;  // Don't submit if empty

        try {
            const formData = new FormData();
            formData.append('name', newCategory.trim());

            const response = await axios.post(
                'http://localhost:8000/categories',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
            console.log('Category created:', response.data);
            setNewCategory(''); // Clear the input after successful creation
            fetchCategories(); // Refresh the categories list
        } catch (error) {
            console.error('Error creating category:', error);
        }
    };

    // Delete category
    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await axios.delete(`http://localhost:8000/categories/${categoryId}`);
                fetchCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    };

    // Start editing
    const startEditing = (category) => {
        setEditingCategory(category._id);
        setEditName(category.name);
    };

    // Update category
    const handleUpdateCategory = async (categoryId) => {
        try {
            const formData = new FormData();
            formData.append('name', editName.trim());

            await axios.put(
                `http://localhost:8000/categories/${categoryId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            console.error('Error updating category:', error);
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4">Manage Categories</h2>

            {/* Add Category Form */}
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">Add New Category</h5>
                    <form onSubmit={handleAddCategory} className="d-flex gap-2">
                        <input
                            type="text"
                            className="form-control"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Enter category name"
                            required
                        />
                        <button type="submit" className="btn btn-primary">
                            Add Category
                        </button>
                    </form>
                </div>
            </div>

            {/* Categories List */}
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Existing Categories</h5>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Category Name</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <tr key={category._id}>
                                        <td>
                                            {editingCategory === category._id ? (
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                />
                                            ) : (
                                                category.name
                                            )}
                                        </td>
                                        <td>
                                            {editingCategory === category._id ? (
                                                <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handleUpdateCategory(category._id)}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => setEditingCategory(null)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                            ) : (
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-warning btn-sm"
                                                    onClick={() => startEditing(category)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDeleteCategory(category._id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageCategories;