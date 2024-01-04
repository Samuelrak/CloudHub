import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Comment({ file_id }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const headers = {
        Authorization: `Bearer ${token}`
      };
      
      const response = await axios.get(`http://localhost:5000/api/comments/${file_id}`, { headers });
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const postComment = async () => {
    try {
      const token = localStorage.getItem('token'); 
      
      const headers = {
        Authorization: `Bearer ${token}`
      };

      await axios.post(`http://localhost:5000/api/comments/${file_id}`, { commentText }, { headers });
      setCommentText('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [file_id]);

  return (
    <div>
      <h2>Comments</h2>
      <ul>
        {comments.map((comment) => (
          <li key={comment.comment_id}>
            <strong>{comment.username}</strong>: {comment.comment_text}
          </li>
        ))}
      </ul>
      <div>
        <textarea
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button onClick={postComment}>Post Comment</button>
      </div>
    </div>
  );
}

export default Comment;
