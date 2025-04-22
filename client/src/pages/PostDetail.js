"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import Post from "../components/Post"
import "./PostDetail.css"

const PostDetail = () => {
  const { postId } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchPost()
  }, [postId])

  const fetchPost = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:5000/api/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setPost(response.data)
    } catch (error) {
      console.error("Error fetching post:", error)
      if (error.response && error.response.status === 404) {
        setError("Post not found")
      } else {
        setError("Failed to load post. Please try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading-container">Loading post...</div>
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="back-button">
          Go Back
        </button>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="error-container">
        <p>Post not found</p>
        <button onClick={() => navigate(-1)} className="back-button">
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="post-detail-container">
      <button onClick={() => navigate(-1)} className="back-button">
        ← Back
      </button>

      <Post post={post} onUpdate={fetchPost} />
    </div>
  )
}

export default PostDetail
