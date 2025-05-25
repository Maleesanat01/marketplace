const Product = require('../models/Product');
const Order = require('../models/Order');
const Wishlist = require('../models/Wishlist');
const mongoose = require('mongoose');

exports.getProductAnalytics = async (req, res) => {
  try {
    const exporterId = req.user.id;
    const { timeRange = '30days' } = req.query;

    // Calculate date range based on timeRange
    let startDate;
    const endDate = new Date();

    switch (timeRange) {
      case '7days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      default: 
        startDate = new Date(0); 
    }

    // Get basic product stats and count in parallel
    const [productStats, productCount, wishlistStats] = await Promise.all([
      Product.aggregate([
        { $match: { exporter: new mongoose.Types.ObjectId(exporterId) } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: "$stock" },
            averagePrice: { $avg: "$price" },
            lowStockProducts: {
              $sum: {
                $cond: [{ $lt: ["$stock", 10] }, 1, 0]
              }
            },
            outOfStockProducts: {
              $sum: {
                $cond: [{ $eq: ["$stock", 0] }, 1, 0]
              }
            }
          }
        }
      ]),
      Product.countDocuments({ exporter: exporterId }),
      Wishlist.aggregate([
        { $unwind: "$products" },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" },
        { $match: { "product.exporter": new mongoose.Types.ObjectId(exporterId) } },
        {
          $group: {
            _id: "$products.productId" // Group by product ID for uniqueness
          }
        },
        {
          $group: {
            _id: null,
            uniqueWishlisted: { $sum: 1 } // Count unique products
          }
        }
      ])
    ]);

    // Calculate wishlist metrics
    const uniqueWishlisted = wishlistStats[0]?.uniqueWishlisted || 0;
    const wishlistPercentage = productCount > 0
      ? Math.round((uniqueWishlisted / productCount) * 100)
      : 0;

    // Enhanced order stats with time range filter
    const enhancedOrderStats = await Order.aggregate([
      { $unwind: "$products" },
      {
        $match: {
          "products.exporterId": new mongoose.Types.ObjectId(exporterId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          approvedOrders: {
            $sum: {
              $cond: [{ $eq: ["$products.status", "approved"] }, 1, 0]
            }
          },
          totalRevenue: {
            $sum: {
              $multiply: ["$products.quantity", "$products.price"]
            }
          }
        }
      }
    ]);

    // Get order trends
    const orderTrends = await Order.aggregate([
      { $unwind: "$products" },
      {
        $match: {
          "products.exporterId": new mongoose.Types.ObjectId(exporterId),
          "products.status": "approved",
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$products.productId",
          productId: { 
            $first: {
              _id: "$productDetails._id",
              title: "$productDetails.title"
            }
          },
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } },
          lastOrderDate: { $max: "$createdAt" }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    // Get stock changes
    const stockChanges = await Product.aggregate([
      { $match: { exporter: new mongoose.Types.ObjectId(exporterId) } },
      { $sort: { updatedAt: -1 } },
      { $limit: 10 },
      { $project: { title: 1, stock: 1, updatedAt: 1 } }
    ]);

    //not used
    const neverOrderedProducts = await Product.aggregate([
      { $match: { exporter: new mongoose.Types.ObjectId(exporterId) } },
      {
        $lookup: {
          from: "orders",
          let: { productId: "$_id" },
          pipeline: [
            { $unwind: "$products" },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$products.productId", "$$productId"] },
                    { $eq: ["$products.exporterId", new mongoose.Types.ObjectId(exporterId)] },
                    { $gte: ["$createdAt", startDate] },
                    { $lte: ["$createdAt", endDate] }
                  ]
                }
              }
            }
          ],
          as: "orders"
        }
      },
      { $match: { orders: { $size: 0 } } },
      { $project: { title: 1, stock: 1, price: 1, createdAt: 1 } }
    ]);

    // Get daily revenue data
    const dailyRevenue = await Order.aggregate([
      { $unwind: "$products" },
      {
        $match: {
          "products.exporterId": new mongoose.Types.ObjectId(exporterId),
          "products.status": "approved",
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          date: { $first: "$createdAt" },
          dailyRevenue: {
            $sum: { $multiply: ["$products.quantity", "$products.price"] }
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Format daily revenue data for chart
    const formattedRevenueData = dailyRevenue.map(item => ({
      date: item._id,
      revenue: item.dailyRevenue
    }));

    // Merge all stats
    const mergedStats = {
      ...(productStats[0] || {}),
      totalProducts: productCount, 
      uniqueWishlisted,
      wishlistFraction: `${uniqueWishlisted}/${productCount}`,
      wishlistPercentage,
      ...(enhancedOrderStats[0] || {
        totalOrders: 0,
        approvedOrders: 0,
        totalRevenue: 0
      })
    };

    res.json({
      productStats: mergedStats,
      topSellingProducts: orderTrends,
      recentStockChanges: stockChanges,
      neverOrderedProducts,
      dailyRevenue: formattedRevenueData,
      lastUpdated: new Date()
    });

  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};