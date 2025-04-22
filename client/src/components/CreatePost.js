"use client"

import { useState, useContext } from "react"
import { FaImage } from "react-icons/fa"
import axios from "axios"
import { AuthContext } from "../context/AuthContext"
import "./CreatePost.css"

const CreatePost = ({ onPostCreated }) => {
  const { currentUser } = useContext(AuthContext)
  const [content, setContent] = useState("")
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && !image) return

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("content", content)
      if (image) {
        formData.append("image", image)
      }

      const token = localStorage.getItem("token")
      await axios.post("http://localhost:5000/api/posts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      setContent("")
      setImage(null)
      setImagePreview(null)

      if (onPostCreated) {
        onPostCreated()
      }
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="create-post">
      <div className="create-post-header">
        <img src={currentUser.profileImage || "/placeholder-user.jpg"} alt={currentUser.username} className="avatar" />
        <input
          type="text"
          placeholder={`What's on your mind, ${currentUser.firstName}?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="create-post-input"
        />
      </div>

      {imagePreview && (
        <div className="image-preview-container">
          <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="image-preview" />
          <button onClick={removeImage} className="remove-image">
            ×
          </button>
        </div>
      )}

      <div className="create-post-actions">
        <label className="upload-button">
          <FaImage />
          <span>Photo</span>
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
        </label>

        <button onClick={handleSubmit} className="post-button" disabled={isSubmitting || (!content.trim() && !image)}>
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  )
}

export default CreatePost
