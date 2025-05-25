const Order = require('../models/Order');
const Product = require('../models/Product');

exports.getUserOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId: req.user.id })
      .populate({
        path: 'products.productId',
        select: 'title image price'
      })
      .populate({
        path: 'products.exporterId',
        select: 'name'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ userId: req.user.id });

    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('products.productId');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Server Error' });
  }
};


// Get orders for exporter (only their products)
exports.getExporterOrders = async (req, res) => {
  try {
    const exporterId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find orders that contain products from this exporter
    const orders = await Order.find({
      'products.exporterId': exporterId,
      'products.status': 'pending'
    })
    .populate({
      path: 'products.productId',
      select: 'title image price stock'
    })
    .populate({
      path: 'userId',
      select: 'name email'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Filter to only include pending products from this exporter
    const filteredOrders = orders.map(order => {
      const filteredProducts = order.products.filter(
        product => product.exporterId.toString() === exporterId && product.status === 'pending'
      );
      return {
        ...order.toObject(),
        products: filteredProducts
      };
    }).filter(order => order.products.length > 0);

    const totalOrders = await Order.countDocuments({
      'products.exporterId': exporterId,
      'products.status': 'pending'
    });

    res.json({
      orders: filteredOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Approve order and update stock
exports.approveProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const exporterId = req.user.id;

    // Find the order
    const order = await Order.findOne({
      _id: orderId,
      'products._id': productId,
      'products.exporterId': exporterId,
      'products.status': 'pending'
    });

    if (!order) {
      return res.status(404).json({ 
        error: 'Product not found or already processed',
        details: `Order ${orderId} with product ${productId} not found for exporter ${exporterId}`
      });
    }

    // Find the specific product in the order
    const product = order.products.find(
      item => item._id.toString() === productId
    );

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found in order',
        details: `Product ${productId} not found in order ${orderId}`
      });
    }

    // Check stock availability
    const productDoc = await Product.findById(product.productId);
    if (!productDoc) {
      return res.status(404).json({ 
        error: 'Product document not found',
        details: `Product document ${product.productId} not found in database`
      });
    }

    if (productDoc.stock < product.quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock',
        details: `Requested ${product.quantity} but only ${productDoc.stock} available`
      });
    }

    // Update product status and approvedAt
    product.status = 'approved';
    product.approvedAt = new Date();

    // Update product stock
    productDoc.stock -= product.quantity;
    
    // Update overall order status
    const allProductsApproved = order.products.every(
      p => p.status === 'approved'
    );
    const someProductsApproved = order.products.some(
      p => p.status === 'approved'
    );
    
    if (allProductsApproved) {
      order.status = 'approved';
    } else if (someProductsApproved) {
      order.status = 'partially_approved';
    }

    await Promise.all([
      order.save(),
      productDoc.save()
    ]);

    res.json({ 
      success: true,
      message: 'Product approved and stock updated',
      orderId: order._id,
      productId: product._id,
      newStock: productDoc.stock
    });
  } catch (err) {
    console.error('Error in approveProduct:', err.message, err.stack);
    res.status(500).json({ 
      error: 'Server Error',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
