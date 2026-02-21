const express = require('express');
const router = express.Router();
const User = require('../models/user.model');

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).render('error', { 
    title: 'Access Denied',
    message: 'You need admin privileges to access this page' 
  });
};

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login', { title: 'Login', error: null });
});

// Login handler
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.render('login', { 
        title: 'Login', 
        error: 'Invalid email or password' 
      });
    }
    
    const isValidPassword = await User.verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return res.render('login', { 
        title: 'Login', 
        error: 'Invalid email or password' 
      });
    }
    
    // Set session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { 
      title: 'Login', 
      error: 'An error occurred during login' 
    });
  }
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('register', { title: 'Register', error: null });
});

// Register handler
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    
    // Validation
    if (password !== confirmPassword) {
      return res.render('register', { 
        title: 'Register', 
        error: 'Passwords do not match' 
      });
    }
    
    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.render('register', { 
        title: 'Register', 
        error: 'Email already registered' 
      });
    }
    
    // Create user
    const newUser = await User.create({ username, email, password });
    
    // Auto login
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    };
    
    res.redirect('/');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', { 
      title: 'Register', 
      error: 'An error occurred during registration' 
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Admin dashboard
router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    res.render('admin/dashboard', { 
      title: 'Admin Dashboard',
      users 
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.render('error', { 
      title: 'Error',
      message: 'Error loading admin dashboard' 
    });
  }
});

// Admin - Delete user
router.post('/admin/users/:id/delete', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await User.delete(req.params.id);
    res.redirect('/admin');
  } catch (error) {
    console.error('Delete user error:', error);
    res.redirect('/admin');
  }
});

module.exports = router;