"use client"

import { useState, useContext } from "react"
import { Link } from "react-router-dom"
import { FaHeart, FaRegHeart, FaComment, FaShare } from "react-icons/fa"
import moment from "moment"
import axios from "axios"
import { AuthContext } from "../context/AuthContext"
import "./Post.css"

const Post = ({ post, onUpdate }) => {
  const { currentUser } = useContext(AuthContext)
  const [comment, setComment] = useState("")
  const [showComments, setShowComments] = useState(false)
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser.id))
  const [likeCount, setLikeCount] = useState(post.likes.length)

  const handleLike = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/posts/${post.id}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
      }
    } catch (error) {
      console.error("Error liking/unliking post:", error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `http://localhost:5000/api/posts/${post.id}/comments`,
        { content: comment },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setComment("")
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error("Error commenting on post:", error)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`http://localhost:3000/post/${post.id}`)
      alert("Post link copied to clipboard!")
    } catch (error) {
      console.error("Error sharing post:", error)
    }
  }

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.user.username}`} className="post-user">
          <img src={post.user.profileImage ? `http://localhost:5000${post.user.profileImage}` : "/placeholder-user.jpg"} 
               alt={post.user.username} 
               className="avatar" />
          <div>
            <h4>{post.user.fullName}</h4>
            <span className="post-time">{moment(post.createdAt).fromNow()}</span>
          </div>
        </Link>
      </div>

      <div className="post-content">
        <p>{post.content}</p>
        {post.image && <img src={post.image} alt="Post" className="post-image" />}
      </div>

      <div className="post-stats">
        <span>{likeCount} likes</span>
        <span>{post.commentCount} comments</span>
      </div>

      <div className="post-actions">
        <button className={`post-action ${isLiked ? "liked" : ""}`} onClick={handleLike}>
          {isLiked ? <FaHeart /> : <FaRegHeart />}
          <span>Like</span>
        </button>
        <button className="post-action" onClick={() => setShowComments(!showComments)}>
          <FaComment />
          <span>Comment</span>
        </button>
        <button className="post-action" onClick={handleShare}>
          <FaShare />
          <span>Share</span>
        </button>
      </div>

      {showComments && (
        <div className="post-comments">
          <form onSubmit={handleComment} className="comment-form">
            <img
              src={currentUser.profileImage || "/placeholder-user.jpg"}
              alt={currentUser.username}
              className="avatar"
            />
            <input
              type="text"
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="comment-input"
            />
            <button type="submit" className="comment-submit">
              Post
            </button>
          </form>

          {post.comments && post.comments.length > 0 ? (
            <div className="comments-list">
              {post.comments.map((comment) => (
                <div key={comment.id} className="comment">
                  <Link to={`/profile/${comment.user.username}`}>
                    <img
                      src={comment.user.profileImage || "/placeholder-user.jpg"}
                      alt={comment.user.username}
                      className="avatar"
                    />
                  </Link>
                  <div className="comment-content">
                    <Link to={`/profile/${comment.user.username}`} className="comment-user">
                      {comment.user.fullName}
                    </Link>
                    <p>{comment.content}</p>
                    <span className="comment-time">{moment(comment.createdAt).fromNow()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-comments">No comments yet. Be the first to comment!</p>
          )}
        </div>
      )}
    </div>
  )
}

export default Post
