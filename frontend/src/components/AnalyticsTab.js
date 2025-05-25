import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  XAxis, YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import api from '../utils/api';

const AnalyticsTab = () => {
    const [analyticsData, setAnalyticsData] = useState({
        productStats: {},
        topSellingProducts: [],
        recentStockChanges: [],
        neverOrderedProducts: [],
        dailyRevenue: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('30days');
    const [startDate, setStartDate] = useState(new Date());

    // Calculate start date when timeRange changes
    useEffect(() => {
        const calculateStartDate = () => {
            const date = new Date();
            switch(timeRange) {
                case '7days':
                    date.setDate(date.getDate() - 7);
                    break;
                case '30days':
                    date.setDate(date.getDate() - 30);
                    break;
                default: 
                    date.setTime(0); 
            }
            return date;
        };
        setStartDate(calculateStartDate());
    }, [timeRange]);

    // Fetch analytics data
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/analytics?timeRange=${timeRange}`);
                setAnalyticsData({
                    productStats: response.data.productStats || {
                        totalProducts: 0,
                        totalStock: 0,
                        averagePrice: 0,
                        lowStockProducts: 0,
                        outOfStockProducts: 0,
                        totalWishlisted: 0,
                        totalOrders: 0,
                        approvedOrders: 0,
                        totalRevenue: 0,
                        wishlistPercentage: 0,
                        wishlistFraction: '0/0'
                    },
                    topSellingProducts: response.data.topSellingProducts || [],
                    recentStockChanges: response.data.recentStockChanges || [],
                    neverOrderedProducts: response.data.neverOrderedProducts || [],
                    dailyRevenue: response.data.dailyRevenue || []
                });
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.error || err.message);
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [timeRange]);

    // Format date labels based on time range
    const formatXAxis = (tickItem) => {
        const date = new Date(tickItem);
        if (timeRange === '7days') {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

  //for graph
    const renderTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-date">
                        {new Date(label).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                    <p className="tooltip-value">
                        Revenue: <strong>${payload[0].value.toFixed(2)}</strong>
                    </p>
                </div>
            );
        }
        return null;
    };

    const completeRevenueData = () => {
        if (!analyticsData.dailyRevenue || analyticsData.dailyRevenue.length === 0) {
            return [];
        }

        const result = [];
        const currentDate = new Date(startDate);
        const endDate = new Date();
        
    
        const revenueData = [...analyticsData.dailyRevenue];
        
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const existingData = revenueData.find(d => d.date === dateStr);
            
            result.push({
                date: dateStr,
                revenue: existingData ? existingData.revenue : 0
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return result;
    };

    const revenueData = completeRevenueData();

    if (loading) return (
        <div className="analytic-loading-state">
            <div className="analytic-loading-spinner"></div>
            <p>Loading analytics data...</p>
        </div>
    );

    if (error) return (
        <div className="analytic-error-state">
            <div className="analytic-error-icon">!</div>
            <p className="analytic-error-message">Error: {error}</p>
            <button
                className="analytic-retry-button"
                onClick={() => window.location.reload()}
            >
                Retry
            </button>
        </div>
    );

    return (
        <div className="analytic-container">
            <div className="analytic-header">
                <h2 className="analytic-title">Product Analytics Dashboard</h2>

                {/* Time range selector */}
                <div className="analytic-time-selector">
                    <button
                        onClick={() => setTimeRange('7days')}
                        className={`analytic-time-button ${timeRange === '7days' ? 'analytic-time-active' : ''}`}
                    >
                        Last 7 Days
                    </button>
                    <button
                        onClick={() => setTimeRange('30days')}
                        className={`analytic-time-button ${timeRange === '30days' ? 'analytic-time-active' : ''}`}
                    >
                        Last 30 Days
                    </button>
                    {/* <button
                        onClick={() => setTimeRange('all')}
                        className={`analytic-time-button ${timeRange === 'all' ? 'analytic-time-active' : ''}`}
                    >
                        All Time
                    </button> */}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="analytic-summary-grid">
                <div className="analytic-summary-card analytic-products">
                    <h3 className="analytic-summary-label">Total Products</h3>
                    <p className="analytic-summary-value">{analyticsData.productStats.totalProducts || 0}</p>
                    <div className="analytic-summary-icon">📊</div>
                </div>

                <div className="analytic-summary-card analytic-wishlist">
                    <h3 className="analytic-summary-label">Wishlisted 
                        <span className="percentage">
                            ({analyticsData.productStats.wishlistPercentage || 0}%)
                        </span>
                    </h3>
                    <p className="analytic-summary-value">
                        {analyticsData.productStats.wishlistFraction || '0/0'}
                    </p>
                    <div className="analytic-summary-icon">❤️</div>
                </div>

                <div className="analytic-summary-card analytic-orders">
                    <h3 className="analytic-summary-label">Total Orders</h3>
                    <p className="analytic-summary-value">{analyticsData.productStats.totalOrders || 0}</p>
                    <div className="analytic-summary-icon">📦</div>
                </div>

                <div className="analytic-summary-card analytic-approved">
                    <h3 className="analytic-summary-label">Approved Orders</h3>
                    <p className="analytic-summary-value">{analyticsData.productStats.approvedOrders || 0}</p>
                    <div className="analytic-summary-icon">✅</div>
                </div>

                <div className="analytic-summary-card analytic-revenue">
                    <h3 className="analytic-summary-label">Total Revenue</h3>
                    <p className="analytic-summary-value">
                        ${(analyticsData.productStats.totalRevenue || 0).toFixed(2)}
                    </p>
                    <div className="analytic-summary-icon">💰</div>
                </div>

                <div className="analytic-summary-card analytic-stock">
                    <h3 className="analytic-summary-label">Low Stock</h3>
                    <p className="analytic-summary-value">{analyticsData.productStats.lowStockProducts || 0}</p>
                    <div className="analytic-summary-icon">⚠️</div>
                </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="analytic-chart-container">
                <h3 className="analytic-chart-title">
                    Revenue Trend ({timeRange === '7days' ? 'Last 7 Days' : 
                                  timeRange === '30days' ? 'Last 30 Days' : 
                                  'All Time'})
                </h3>
                <div className="chart-content-wrapper">
                    {revenueData.length > 0 ? (
                        <div className="analytic-chart-wrapper">
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={formatXAxis}
                                        tick={{ fill: '#64748b' }}
                                    />
                                    <YAxis 
                                        tickFormatter={(value) => `$${value}`}
                                        tick={{ fill: '#64748b' }}
                                    />
                                    <Tooltip 
                                        content={renderTooltip}
                                        contentStyle={{
                                            background: 'rgba(255, 255, 255, 0.98)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '0.5rem',
                                            padding: '12px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        name="Daily Revenue" 
                                        stroke="#3b82f6" 
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="analytic-no-data">
                            <p>No revenue data available for the selected period</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Selling Products Chart */}
            <div className="analytic-chart-container">
    <h3 className="analytic-chart-title">Top Selling Products</h3>
    <div className="chart-content-wrapper">
        {analyticsData.topSellingProducts?.length > 0 ? (
            <div className="analytic-chart-wrapper">
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analyticsData.topSellingProducts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="_id" hide />
                        <YAxis 
                            tickFormatter={(value) => `$${value}`}
                            tick={{ fill: '#64748b' }}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="custom-tooltip">
                                            <p className="tooltip-product">
                                                {payload[0].payload.productId?.title || 'Product'}
                                            </p>
                                            <p className="tooltip-value">
                                                Revenue: <strong>${payload[0].value.toFixed(2)}</strong>
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                            contentStyle={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Legend />
                        <Bar
                            dataKey="totalRevenue"
                            name="Revenue"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        ) : (
            <div className="analytic-no-data">
                <p>No sales data available for the selected period</p>
            </div>
        )}
    </div>
</div>
        </div>
    );
};

export default AnalyticsTab;