const express = require('express');
require('dotenv').config();
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// Database connection
require('./config/database');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
}));

// Global variables for views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentUrl = req.url;
  next();
});

// Routes
const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');
const adminRoutes = require('./routes/admin.routes');

app.use('/', authRoutes);
app.use('/posts', postRoutes);
app.use('/admin', adminRoutes);

// Home page
app.get('/', async (req, res) => {
  try {
    const Post = require('./models/post.model');
    const Category = require('./models/category.model');
    
    const recentPosts = await Post.findAll();
    const popularPosts = await Post.getPopular(5);
    const categories = await Category.findAll();
    
    res.render('index', {
      title: 'Home',
      message: 'Welcome to my blog',
      recentPosts,
      popularPosts,
      categories
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.render('index', {
      title: 'Home',
      message: 'Welcome to my blog',
      recentPosts: [],
      popularPosts: [],
      categories: []
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: '500 Server Error',
    message: 'Something went wrong on our end.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});