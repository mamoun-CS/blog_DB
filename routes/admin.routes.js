const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Post = require('../models/post.model');
const Category = require('../models/category.model');
const Comment = require('../models/comment.model');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).render('error', { 
    title: 'Access Denied',
    message: 'Admin access required' 
  });
};

// Admin dashboard
router.get('/', isAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    const posts = await Post.findAll();
    const categories = await Category.findAll();
    
    res.render('admin/index', { 
      title: 'Admin Dashboard',
      users,
      posts,
      categories
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.render('error', { 
      title: 'Error',
      message: 'Error loading admin dashboard' 
    });
  }
});

// Category management
router.get('/categories', isAdmin, async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.render('admin/categories', { 
      title: 'Manage Categories',
      categories,
      error: null
    });
  } catch (error) {
    console.error('Error loading categories:', error);
    res.redirect('/admin');
  }
});

router.post('/categories/create', isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      const categories = await Category.findAll();
      return res.render('admin/categories', { 
        title: 'Manage Categories',
        categories,
        error: 'Category name is required' 
      });
    }
    
    await Category.create({ name, description });
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Error creating category:', error);
    res.redirect('/admin/categories');
  }
});

router.post('/categories/:id/delete', isAdmin, async (req, res) => {
  try {
    await Category.delete(req.params.id);
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Error deleting category:', error);
    res.redirect('/admin/categories');
  }
});

module.exports = router;