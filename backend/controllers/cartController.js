const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.addToCart = async (req, res) => {
  try {
    console.log('Received request body:', req.body);

    const { product, quantity, price, userId } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (!product) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }
    if (!price || price <= 0) {
      return res.status(400).json({ error: 'Valid price is required' });
    }

    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Product document fetched:', {
      productId: productDoc._id,
      availableFields: Object.keys(productDoc.toObject())
    });

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        products: [],
        totalPrice: 0
      });
    }

    const existingItem = cart.products.find(
      (item) => item.productId.toString() === product
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.products.push({
        productId: product,
        quantity,
        price
      });
    }

    // Recalculate total price
    cart.totalPrice = cart.products.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const saved = await cart.save();

    // Populate product details before sending response
    const populatedCart = await Cart.findById(saved._id)
      .populate('products.productId')
      .lean();

    res.status(201).json(populatedCart);
  } catch (err) {
    console.error('Error in addToCart:', err);
    res.status(500).json({
      error: 'Error adding to cart',
      details: err.message
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId })
      .populate({
        path: 'products.productId',
        populate: {
          path: 'exporter',
          model: 'User',
          select: 'name companyInfo'
        }
      })
      .lean();

    if (!cart) {
      return res.json({ products: [], totalPrice: 0 });
    }

    res.json(cart);
  } catch (err) {
    console.error('Error in getCart:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCartCount = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    res.json({ count: cart ? cart.products.length : 0 });
  } catch (err) {
    console.error('Error getting cart count:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.clearGuestCart = async (req, res) => {
  try {
    const { guestSessionId } = req.params;
    await Cart.findOneAndDelete({ guestSessionId });
    res.json({ message: 'Guest cart cleared' });
  } catch (err) {
    console.error('Error in clearGuestCart:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.params;
    await Cart.findOneAndDelete({ userId });
    res.json({ message: 'Cart cleared successfully' });
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCartQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Validate required fields
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const cart = await Cart.findOne({ userId: req.params.userId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const product = cart.products.find(
      (item) => item.productId.toString() === productId
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    // Update the quantity
    product.quantity = quantity;

    // Recalculate total price
    cart.totalPrice = cart.products.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    await cart.save();

    res.json({ message: 'Quantity updated successfully', cart });
  } catch (err) {
    console.error('Error in updateCartQuantity:', err);
    res.status(500).json({ error: err.message });
  }
};
exports.removeFromCart = async (req, res) => {
  try {
    console.log('Remove from cart request received:', {
      params: req.params,
      body: req.body,
      headers: req.headers
    });

    const { productId } = req.body;
    const { userId } = req.params;

    if (!productId) {
      console.log('Product ID missing');
      return res.status(400).json({ error: 'Product ID is required' });
    }

    console.log('Attempting to remove product:', productId, 'from user:', userId);

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { products: { productId } } },
      { new: true }
    ).populate('products.productId');

    if (!cart) {
      console.log('Cart not found for user:', userId);
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Recalculate total
    cart.totalPrice = cart.products.reduce((total, item) => total + (item.price * item.quantity), 0);
    await cart.save();

    console.log('Product removed successfully');
    res.json({
      message: 'Product removed from cart',
      products: cart.products
    });
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({ error: err.message });
  }
};

// In cartController.js
exports.applyPromoToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { promoCode } = req.body;

    // validate the promo code
    const promoResponse = await axios.post(`${process.env.API_URL}/promo/validate`, {
      code: promoCode,
      userId,
      cartTotal: 0 
    });

    if (!promoResponse.data.success) {
      return res.status(400).json({ error: promoResponse.data.error });
    }

    const { promo, discountAmount } = promoResponse.data;

    // Update cart with promo info
    const cart = await Cart.findOneAndUpdate(
      { userId },
      {
        appliedPromo: {
          code: promo.code,
          discountAmount,
          exporterId: promo.exporterId
        },
        discount: discountAmount
      },
      { new: true }
    ).populate('products.productId');

    res.json(cart);
  } catch (err) {
    console.error('Error applying promo code:', err);
    res.status(500).json({ error: 'Error applying promo code' });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId })
      .populate({
        path: 'products.productId',
        populate: {
          path: 'exporter', 
          model: 'User',
          select: 'name companyInfo'
        }
      })
      .lean();

    if (!cart) {
      return res.json({ products: [], totalPrice: 0 });
    }

    res.json(cart);
  } catch (err) {
    console.error('Error in getCart:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getExporter = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId }).populate('products.productId.exporterId').lean();

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const exporters = cart.products.map(item => item.productId.exporterId);
    res.json(exporters);
  } catch (err) {
    console.error('Error fetching exporter:', err);
    res.status(500).json({ error: 'Error fetching exporter' });
  }
}

exports.applyPromoToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { promoCode } = req.body;

    // validate the promo code
    const promoResponse = await axios.post(`${process.env.API_URL}/promo/validate`, {
      code: promoCode,
      userId,
      cartTotal: 0 
    });

    if (!promoResponse.data.success) {
      return res.status(400).json({ error: promoResponse.data.error });
    }

    const { promo, discountAmount, eligibleAmount } = promoResponse.data;

    // Check if promo code is applicable to cart items
    const cartItems = req.body.cartItems;
    const applicableItems = cartItems.filter(item => item.productId.exporterId === promo.exporterId);
    if (applicableItems.length === 0) {
      return res.status(400).json({ error: `This promo code only applies to products from ${promo.exporterName}` });
    }

    // Update cart with promo info
    const cart = await Cart.findOneAndUpdate(
      { userId },
      {
        appliedPromo: {
          code: promo.code,
          discountAmount,
          exporterId: promo.exporterId
        },
        discount: discountAmount
      },
      { new: true }
    ).populate('products.productId');

    res.json({ promo, discountAmount, eligibleAmount });
  } catch (err) {
    console.error('Error applying promo code:', err);
    res.status(500).json({ error: 'Error applying promo code' });
  }
};

exports.addToGuestCart = async (req, res) => {
  try {
    const { guestId, product, quantity, price } = req.body;
    
    // Validate required fields
    if (!guestId) {
      return res.status(400).json({ error: 'Guest ID is required' });
    }
    
    // Use guestSessionId consistently
    let cart = await Cart.findOne({ guestSessionId: guestId });
    
    if (!cart) {
      cart = new Cart({ 
        guestSessionId: guestId, // Store as guestSessionId
        products: [], 
        totalPrice: 0 
      });
    }

    const existingItem = cart.products.find(
      (item) => item.productId.toString() === product
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.products.push({
        productId: product,
        quantity,
        price
      });
    }

    cart.totalPrice = cart.products.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const saved = await cart.save();

    const populatedCart = await Cart.findById(saved._id)
      .populate('products.productId')
      .lean();

    res.status(201).json(populatedCart);
  } catch (err) {
    console.error('Error in addToGuestCart:', err);
    res.status(500).json({
      error: 'Error adding to guest cart',
      details: err.message
    });
  }
};

exports.updateGuestCartQuantity = async (req, res) => {
  try {
    const { guestSessionId } = req.params;
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    if (!quantity || quantity < 0) { // Allow 0 for removal
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const cart = await Cart.findOne({ guestSessionId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Find the product index
    const productIndex = cart.products.findIndex(
      item => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    if (quantity === 0) {
      // Remove the product if quantity is 0
      cart.products.splice(productIndex, 1);
    } else {
      // Update quantity
      cart.products[productIndex].quantity = quantity;
    }

    // Recalculate total
    cart.totalPrice = cart.products.reduce(
      (total, item) => total + (item.price * item.quantity), 
      0
    );

    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('products.productId')
      .lean();

    res.json(populatedCart);
  } catch (err) {
    console.error('Error updating guest cart:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.removeFromGuestCart = async (req, res) => {
  try {
    const { guestSessionId, productId } = req.params;

    const cart = await Cart.findOneAndUpdate(
      { guestSessionId },
      { $pull: { products: { productId } } },
      { new: true }
    ).populate('products.productId');

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Recalculate total
    cart.totalPrice = cart.products.reduce(
      (total, item) => total + (item.price * item.quantity), 
      0
    );
    await cart.save();

    res.json(cart);
  } catch (err) {
    console.error('Error removing from guest cart:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getGuestCart = async (req, res) => {
  try {
    const { guestSessionId } = req.params;
    console.log('Searching for guest cart with session ID:', guestSessionId);

    const cart = await Cart.findOne({ guestSessionId })
      .populate({
        path: 'products.productId',
        populate: {
          path: 'exporter',
          model: 'User',
          select: 'name companyInfo'
        }
      })
      .lean();

    if (!cart) {
      console.log('No cart found for guest session');
      return res.json({ products: [], totalPrice: 0 });
    }

    res.json(cart);
  } catch (err) {
    console.error('Error in getGuestCart:', {
      message: err.message,
      stack: err.stack,
      params: req.params
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: err.message 
    });
  }
};
exports.clearGuestCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ guestId: req.params.guestId });
    res.json({ message: 'Guest cart cleared' });
  } catch (err) {
    console.error('Error in clearGuestCart:', err);
    res.status(500).json({ error: err.message });
  }
};

//not used
exports.migrateGuestCart = async (req, res) => {
  try {
    const { guestId, userId } = req.body;

    // Find guest cart
    const guestCart = await Cart.findOne({ guestId });
    if (!guestCart) return res.json({ message: 'No guest cart found' });

    // Find or create user cart
    let userCart = await Cart.findOne({ userId });
    if (!userCart) {
      userCart = new Cart({ userId, products: [], totalPrice: 0 });
    }

    // Merge products
    guestCart.products.forEach(guestItem => {
      const existingItem = userCart.products.find(
        item => item.productId.toString() === guestItem.productId.toString()
      );

      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
      } else {
        userCart.products.push(guestItem);
      }
    });

    // Recalculate total
    userCart.totalPrice = userCart.products.reduce(
      (total, item) => total + (item.price * item.quantity), 0
    );

    await userCart.save();
    await Cart.deleteOne({ guestId });

    res.json(userCart);
  } catch (err) {
    console.error('Error migrating cart:', err);
    res.status(500).json({ error: 'Error migrating cart' });
  }
};

// checkout
exports.createCheckoutSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const { totalAmount, successUrl, cancelUrl, promoCode } = req.body;

    // Get the user's cart and user information
    const [cart, user] = await Promise.all([
      Cart.findOne({ userId })
        .populate('products.productId')
        .populate('appliedPromo.exporterId')
        .lean(),
      User.findById(userId).lean() 
    ]);

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate amounts
    const subtotal = cart.products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = cart.appliedPromo ? cart.discount || 0 : 0;
    const calculatedTotal = subtotal - discount;

   
    const finalTotal = totalAmount !== undefined ? totalAmount : calculatedTotal;

    // Create line items
    const lineItems = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Your Order Total',
          description: `Order from ${user.name} (${cart.products.length} items)`, 
        },
        unit_amount: Math.round(finalTotal * 100),
      },
      quantity: 1,
    }];

    // Create Stripe session 
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl || `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/cart`,
      metadata: {
        userId: userId.toString(),
        cartId: cart._id.toString(),
        promoCode: promoCode || cart.appliedPromo?.code || 'none',
        discountAmount: discount.toString(),
        originalTotal: subtotal.toString(),
        finalTotal: finalTotal.toString()
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ 
      error: err.message,
      details: err.stack 
    });
  }
};

exports.handleSuccessfulPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Verify the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ 
        success: false,
        message: 'Payment not completed' 
      });
    }

    const userId = session.metadata.userId;

    // Get the user's cart
    const cart = await Cart.findOne({ userId })
      .populate('products.productId');

    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    const order = new Order({
      userId,
      products: cart.products.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.price,
        exporterId: item.productId.exporter 
      })),
      totalAmount: cart.totalPrice - (cart.discount || 0), 
      paymentId: session.payment_intent,
      status: 'pending' 
    });

    // Save the order and clear the cart
    await Promise.all([
      order.save(),
      Cart.findOneAndDelete({ userId })
    ]);

    res.json({ 
      success: true, 
      orderId: order._id,
      message: 'Order placed successfully. Waiting for exporter approval.' 
    });

  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};


exports.createGuestCheckoutSession = async (req, res) => {
  try {
    const { guestSessionId } = req.params;
    const { successUrl, cancelUrl } = req.body;

    // Get the guest's cart
    const cart = await Cart.findOne({ guestSessionId })
      .populate('products.productId')
      .lean();

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Create line items for Stripe
    const lineItems = cart.products.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.productId.title,
          description: item.productId.description.substring(0, 100),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        guestSessionId,
        cartId: cart._id.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating guest checkout session:', err);
    res.status(500).json({ error: err.message });
  }
};
