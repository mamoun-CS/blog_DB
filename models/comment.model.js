const { pool } = require('../config/database');

class Comment {
  static async create(commentData) {
    const { content, user_id, post_id } = commentData;
    
    const query = `
      INSERT INTO comments (content, user_id, post_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [content, user_id, post_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByPost(postId) {
    const query = `
      SELECT c.*, u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query, [postId]);
    return result.rows;
  }

  static async delete(id) {
    const query = 'DELETE FROM comments WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async deleteByPost(postId) {
    const query = 'DELETE FROM comments WHERE post_id = $1';
    await pool.query(query, [postId]);
  }
}

module.exports = Comment;