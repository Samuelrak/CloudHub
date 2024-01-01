<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Comment({ file_id }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  const fetchComments = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/comments/${file_id}`);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const postComment = async () => {
    try {
      await axios.post(`http://localhost:5000/api/comments/${file_id}`, { commentText });
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
=======
import React, { useState } from 'react';
import axios from 'axios';


function Comment({ file_id, user_id, username }) {
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        // Submit comment to the server
        await axios.post(`http://localhost:5000/api/comments/${file_id}`, {
          user_id: user_id,  // Pass the user_id
          username: username,  // Pass the username
          commentText,
        });
  
        // Fetch updated comments and update state
        const response = await axios.get(`http://localhost:5000/api/comments/${file_id}`);
        setComments(response.data.comments);
  
        // Clear the comment input
        setCommentText('');
      } catch (error) {
        console.error('Error submitting comment:', error);
      }
    };

  return (
    <div>
      <h3>Comments</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
        />
        <button type="submit">Submit</button>
      </form>
      <div>
        {/* Display existing comments */}
        {comments.map((comment) => (
          <div key={comment.comment_id}>
            <p>{comment.username}: {comment.comment_text}</p>
            <small>{comment.created_at}</small>
          </div>
        ))}
>>>>>>> 3546cf8f1c90c75ffa6d0ee4f8baacbf45e4d0b6
      </div>
    </div>
  );
}

<<<<<<< HEAD
export default Comment;

=======
export default Comment;
>>>>>>> 3546cf8f1c90c75ffa6d0ee4f8baacbf45e4d0b6
