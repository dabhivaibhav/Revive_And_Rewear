import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function SalesData() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:8000/seller/sales-data', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!analyticsData) {
    return <div className="alert alert-info">No sales data available.</div>;
  }

  const { stats, recent_sales, revenue_trend, category_sales } = analyticsData;

  // Format revenue trend data for the line chart
  const formattedRevenueTrend = revenue_trend.map(item => ({
    date: `${monthNames[item._id.month - 1]} ${item._id.year}`,
    revenue: item.revenue
  }));

  return (
    <div className="container py-4">
      <div className="row g-4" >
      <h2 className="card-title">View Sales</h2>
        {/* Stats Cards */}
        <div className="col-md-2">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6>Total Products</h6>
              <h3>{stats.total_products}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card bg-warning">
            <div className="card-body">
              <h6>Pending Approvals</h6>
              <h3>{stats.pending_approvals}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6>Rejected Products</h6>
              <h3>{stats.rejected_products}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6>Total Sales</h6>
              <h3>{stats.total_sales}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h6>Total Revenue</h6>
              <h3>${stats.revenue}</h3>
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5>Revenue Trend</h5>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedRevenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      name="Revenue ($)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Category Sales Chart */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5>Sales by Category</h5>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={category_sales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="total_quantity" 
                      fill="#82ca9d" 
                      name="Units Sold" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Recent Sales</h5>
              {recent_sales?.length > 0 ? (
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent_sales.map((sale, index) => (
                        <tr key={index}>
                          <td>{sale.product_name}</td>
                          <td>{sale.quantity}</td>
                          <td>${sale.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted mt-4">
                  No recent sales found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}