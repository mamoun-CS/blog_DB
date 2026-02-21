const express = require('express');
const router = express.Router();
const Post = require('../models/post.model');
const Category = require('../models/category.model');
const Comment = require('../models/comment.model');

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
};

// List all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.findAll();
    const categories = await Category.findAll();
    const popularPosts = await Post.getPopular(5);
    
    res.render('posts/index', { 
      title: 'All Posts',
      posts: posts || [],
      categories: categories || [],
      popularPosts: popularPosts || [],
      currentCategory: null // Add this line to fix the error
    });
  } catch (error) {
    console.error('Error loading posts:', error);
    res.render('posts/index', { 
      title: 'All Posts',
      posts: [],
      categories: [],
      popularPosts: [],
      currentCategory: null,
      error: 'Error loading posts'
    });
  }
});

// Show create post form
router.get('/create', isAuthenticated, async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.render('posts/create', { 
      title: 'Create Post',
      categories: categories || [],
      error: null 
    });
  } catch (error) {
    console.error('Error loading create form:', error);
    res.redirect('/posts');
  }
});

// Create post
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    const { title, content, category_id } = req.body;
    
    if (!title || !content) {
      const categories = await Category.findAll();
      return res.render('posts/create', { 
        title: 'Create Post',
        categories: categories || [],
        error: 'Title and content are required' 
      });
    }
    
    await Post.create({
      title,
      content,
      user_id: req.session.user.id,
      category_id: category_id || null
    });
    
    res.redirect('/posts');
  } catch (error) {
    console.error('Error creating post:', error);
    res.redirect('/posts');
  }
});

// View single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.render('error', { 
        title: 'Not Found',
        message: 'Post not found' 
      });
    }
    
    const comments = await Comment.findByPost(req.params.id);
    const categories = await Category.findAll();
    const popularPosts = await Post.getPopular(5);
    
    res.render('posts/show', { 
      title: post.title,
      post: post,
      comments: comments || [],
      categories: categories || [],
      popularPosts: popularPosts || []
    });
  } catch (error) {
    console.error('Error loading post:', error);
    res.render('error', { 
      title: 'Error',
      message: 'Error loading post' 
    });
  }
});

// Add comment
router.post('/:id/comments', isAuthenticated, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (content && content.trim()) {
      await Comment.create({
        content: content.trim(),
        user_id: req.session.user.id,
        post_id: req.params.id
      });
    }
    
    res.redirect(`/posts/${req.params.id}`);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.redirect(`/posts/${req.params.id}`);
  }
});

// Show edit post form
router.get('/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.redirect('/posts');
    }
    
    // Check if user owns the post or is admin
    if (post.user_id !== req.session.user.id && req.session.user.role !== 'admin') {
      return res.status(403).render('error', { 
        title: 'Access Denied',
        message: 'You can only edit your own posts' 
      });
    }
    
    const categories = await Category.findAll();
    res.render('posts/edit', { 
      title: 'Edit Post',
      post: post,
      categories: categories || [],
      error: null 
    });
  } catch (error) {
    console.error('Error loading edit form:', error);
    res.redirect('/posts');
  }
});

// Update post
router.post('/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.redirect('/posts');
    }
    
    // Check if user owns the post or is admin
    if (post.user_id !== req.session.user.id && req.session.user.role !== 'admin') {
      return res.status(403).render('error', { 
        title: 'Access Denied',
        message: 'You can only edit your own posts' 
      });
    }
    
    const { title, content, category_id } = req.body;
    
    await Post.update(req.params.id, { title, content, category_id });
    res.redirect(`/posts/${req.params.id}`);
  } catch (error) {
    console.error('Error updating post:', error);
    res.redirect('/posts');
  }
});

// Delete post
router.post('/:id/delete', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.redirect('/posts');
    }
    
    // Check if user owns the post or is admin
    if (post.user_id !== req.session.user.id && req.session.user.role !== 'admin') {
      return res.status(403).render('error', { 
        title: 'Access Denied',
        message: 'You can only delete your own posts' 
      });
    }
    
    await Post.delete(req.params.id);
    res.redirect('/posts');
  } catch (error) {
    console.error('Error deleting post:', error);
    res.redirect('/posts');
  }
});

// Category routes
router.get('/category/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    // Validate category ID
    if (isNaN(categoryId)) {
      return res.redirect('/posts');
    }
    
    const posts = await Post.findByCategory(categoryId);
    const category = await Category.findById(categoryId);
    const categories = await Category.findAll();
    const popularPosts = await Post.getPopular(5);
    
    res.render('posts/index', { 
      title: category ? category.name : 'Category',
      posts: posts || [],
      categories: categories || [],
      popularPosts: popularPosts || [],
      currentCategory: category || null // This is now properly defined
    });
  } catch (error) {
    console.error('Error loading category:', error);
    res.redirect('/posts');
  }
});

module.exports = router;