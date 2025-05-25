const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Define storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const isValid = allowedTypes.test(file.mimetype);
  cb(null, isValid);
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

const createProduct = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File upload failed' });
    }

    const exporterId = req.user._id;
    const newProduct = new Product({
      ...req.body,
      image: req.file.filename,
      exporter: exporterId,
    });

    const saved = await newProduct.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const getProducts = async (req, res) => {
  try {
    console.log('Fetching exporter products...');
    
    if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const exporterId = req.user._id;
    console.log('Fetching products for exporter:', exporterId);
    
    // Populate the exporter field to include companyInfo.name
    const products = await Product.find({ exporter: exporterId })
      .select('title description image category stock price certifications createdAt')
      .populate('exporter', 'companyInfo.name')
      .sort({ createdAt: -1 });

    console.log('Found products:', products.length);

    // Get all unique category IDs
    const categoryIds = [...new Set(products.map(p => p.category))];
    
    // Fetch all categories at once
    const categories = await Category.find({ _id: { $in: categoryIds } })
      .select('name')
      .lean();

    // Create a map of categories for quick lookup
    const categoryMap = categories.reduce((map, cat) => {
      map[cat._id.toString()] = cat;
      return map;
    }, {});

    // Combine the data
    const populatedProducts = products.map(product => ({
      ...product.toObject(),
      category: categoryMap[product.category.toString()]
    }));

    console.log('First product sample:', populatedProducts[0]);

    res.json(populatedProducts);
  } catch (err) {
    console.error('Error in getProducts:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      error: 'Error fetching products', 
      details: err.message 
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    console.log('Fetching all products...');

   const products = await Product.find()
  .select('title description image category stock price certifications createdAt')
  .populate('exporter', 'name companyInfo.name')
  .populate('category', 'name')
  .sort({ createdAt: -1 })
  .lean();
    console.log('Found products:', products.length);

    if (products.length > 0) {
      console.log('First product sample:', {
        title: products[0].title,
        exporter: products[0].exporter,
        category: products[0].category
      });
    }

    res.json(products);
  } catch (err) {
    console.error('Error in getAllProducts:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      error: 'Error fetching products', 
      details: err.message 
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Get category
    const category = await Category.findById(product.category)
      .select('name')
      .lean();

    // Get exporter
    const exporter = await User.findById(product.exporter)
      .select('name companyInfo')
      .lean();

    // Combine the data
    const populatedProduct = {
      ...product.toObject(),
      category,
      exporter
    };

    res.json(populatedProduct);
  } catch (err) {
    console.error('Error in getProductById:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );

    // Get category
    const category = await Category.findById(updated.category)
      .select('name')
      .lean();

    // Combine the data
    const populatedProduct = {
      ...updated.toObject(),
      category
    };

    res.json(populatedProduct);
  } catch (err) {
    console.error('Error in updateProduct:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//advanced search for exporter
const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        error: 'Search query is required' 
      });
    }

    const products = await Product.find(
      { 
        $text: { 
          $search: query,
          $caseSensitive: false,
          $diacriticSensitive: false 
        } 
      },
      { 
        score: { $meta: "textScore" },
        description: 1,
        title: 1,
        category: 1,
        stock: 1,
        price: 1
      }
    )
    .sort({ score: { $meta: "textScore" } })
    .populate('category', 'name')
    .populate('exporter', 'companyInfo.name');

    res.json(products || []);
    
  } catch (err) {
    console.error('Search error:', {
      query: req.query,
      error: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Search failed',
      details: err.message 
    });
  }
};

//advanced search for buyer
const advancedSearch = async (req, res) => {
  try {
    const { 
      query, 
      category, 
      minPrice, 
      maxPrice, 
      exporter, 
      inStock 
    } = req.query;

    // Build the search query
    const searchQuery = {};

    // Text search
    if (query && query.trim() !== '') {
      searchQuery.$text = { 
        $search: query,
        $caseSensitive: false,
        $diacriticSensitive: false
      };
    }

    // Category filter
    if (category) {
      searchQuery.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
    }

    // Exporter filter
    if (exporter) {
      searchQuery.exporter = exporter;
    }

    // In stock filter
    if (inStock === 'true') {
      searchQuery.stock = { $gt: 0 };
    }

    const products = await Product.find(searchQuery)
      .populate('category', 'name')
      .populate('exporter', 'name companyInfo.name')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error('Advanced search error:', {
      query: req.query,
      error: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Advanced search failed',
      details: err.message 
    });
  }
};

module.exports = {
  upload,
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProducts,
  searchProducts,
  advancedSearch
};
