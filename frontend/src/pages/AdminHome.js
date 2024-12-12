import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AdminHome = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState({
        user_stats: {
            total_users: 0,
            buyers: 0,
            sellers: 0,
            admins: 0
        },
        pendingProducts: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = {
                    'Authorization': `Bearer ${token}`
                };

                // Fetch dashboard data and pending products
                const [dashboardResponse, productsResponse] = await Promise.all([
                    axios.get('http://localhost:8000/admin/dashboard', { headers }),
                    axios.get('http://localhost:8000/products/unapproved', { headers })
                ]);

                setDashboardData({
                    user_stats: dashboardResponse.data.user_stats,
                    pendingProducts: productsResponse.data.length || 0
                });
                setError(null);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError('Unable to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="container py-4">
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="card-title mb-4">Admin Dashboard</h2>
                            <p className="card-text mb-4">Welcome, {user?.first_name}!</p>

                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <div className="row mb-4">
                                <div className="col-md-3">
                                    <div className="card bg-primary text-white">
                                        <div className="card-body">
                                            <h5 className="card-title">Total Users</h5>
                                            <p className="h3">{loading ? '...' : dashboardData.user_stats.total_users}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-3">
                                    <div className="card bg-success text-white">
                                        <div className="card-body">
                                            <h5 className="card-title">Active Buyers</h5>
                                            <p className="h3">{loading ? '...' : dashboardData.user_stats.buyers}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-3">
                                    <div className="card bg-info text-white">
                                        <div className="card-body">
                                            <h5 className="card-title">Active Sellers</h5>
                                            <p className="h3">{loading ? '...' : dashboardData.user_stats.sellers}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-3">
                                    <div className="card bg-warning text-dark">
                                        <div className="card-body">
                                            <h5 className="card-title">Pending Products</h5>
                                            <p className="h3">{loading ? '...' : dashboardData.pendingProducts}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4>System Status</h4>
                                <div className="card bg-light">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            {loading ? (
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            ) : (
                                                <div className="spinner-grow text-success me-2" 
                                                     role="status" 
                                                     style={{width: '0.5rem', height: '0.5rem'}}>
                                                    <span className="visually-hidden">Online</span>
                                                </div>
                                            )}
                                            <p className="mb-0">
                                                {loading ? 'Checking system status...' : 'All systems operational'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminHome;