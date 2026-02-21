const { pool } = require('../config/database');

class Post {
  static async create(postData) {
    const { title, content, user_id, category_id } = postData;
    
    const query = `
      INSERT INTO posts (title, content, user_id, category_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [title, content, user_id, category_id || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT p.*, u.username, c.name as category_name,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT p.*, u.username, u.id as user_id, c.name as category_name,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    
    // Increment views
    if (result.rows[0]) {
      await pool.query('UPDATE posts SET views = views + 1 WHERE id = $1', [id]);
    }
    
    return result.rows[0];
  }

  static async findByCategory(categoryId) {
    const query = `
      SELECT p.*, u.username, c.name as category_name,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [categoryId]);
    return result.rows;
  }

  static async update(id, postData) {
    const { title, content, category_id } = postData;
    
    const query = `
      UPDATE posts 
      SET title = $1, content = $2, category_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const values = [title, content, category_id, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM posts WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getPopular(limit = 5) {
    const query = `
      SELECT p.*, u.username, c.name as category_name,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.views DESC, comment_count DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}

module.exports = Post;