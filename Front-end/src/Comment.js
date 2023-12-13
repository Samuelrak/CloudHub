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
      </div>
    </div>
  );
}

export default Comment;