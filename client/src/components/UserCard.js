"use client"

import { useState, useContext } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { AuthContext } from "../context/AuthContext"
import "./UserCard.css"

const UserCard = ({ user, isFollowing: initialIsFollowing, onFollowChange }) => {
  const { currentUser } = useContext(AuthContext)
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const handleFollow = async () => {
    if (user.id === currentUser.id) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const endpoint = isFollowing ? "unfollow" : "follow"

      await axios.post(
        `http://localhost:5000/api/users/${user.id}/${endpoint}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setIsFollowing(!isFollowing)
      if (onFollowChange) {
        onFollowChange(user.id, !isFollowing)
      }
    } catch (error) {
      console.error(`Error ${isFollowing ? "unfollowing" : "following"} user:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="user-card">
      <Link to={`/profile/${user.username}`} className="user-card-link">
        <img src={user.profileImage || "/placeholder-user.jpg"} alt={user.username} className="user-avatar" />
        <div className="user-info">
          <h4>{user.fullName}</h4>
          <p>@{user.username}</p>
        </div>
      </Link>

      {user.id !== currentUser.id && (
        <button
          onClick={handleFollow}
          className={`follow-button ${isFollowing ? "following" : ""}`}
          disabled={isLoading}
        >
          {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  )
}

export default UserCard
