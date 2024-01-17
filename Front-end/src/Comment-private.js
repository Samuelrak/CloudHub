import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Comment.css';

function CommentPrivate({ file_id }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [commentsPerPage] = useState(4); 

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const headers = {
        Authorization: `Bearer ${token}`
      };
      
      const response = await axios.get(`http://localhost:5000/api/comments-private/${file_id}`, { headers });
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


  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment);


  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="comment-container">
      <div className="comment-section-container">
        <div className="comment-fixed-header">
          <h2>Comments</h2>
          <div className="comment-input-area">
            <textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ resize: "none" }}
            />
            <button onClick={postComment}>Post Comment</button>
          </div>
        </div>
    
        <div className="comment-scrollable-container">
          <ul className="comments-display">
            {currentComments.map((comment) => (
              <li key={comment.comment_id}>
                <strong>{comment.username}</strong>: {comment.comment_text}
              </li>
            ))}
          </ul>
        </div>
        <div className="pagination">
          {Array.from({ length: Math.ceil(comments.length / commentsPerPage) }).map((_, index) => (
            <button
              key={index}
              className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
              onClick={() => paginate(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CommentPrivate;
