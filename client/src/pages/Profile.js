"use client"

import { useState, useEffect, useContext } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import { FaUserEdit, FaUserPlus, FaUserMinus, FaEnvelope } from "react-icons/fa"
import { AuthContext } from "../context/AuthContext"
import Post from "../components/Post"
import "./Profile.css"

const Profile = () => {
  const { username } = useParams()
  const { currentUser } = useContext(AuthContext)
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [activeTab, setActiveTab] = useState("posts")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  useEffect(() => {
    fetchProfile()
  }, [username])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:5000/api/users/profile/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setProfile(response.data)
      setIsFollowing(response.data.isFollowing)
      setFollowersCount(response.data.followersCount)
      setFollowingCount(response.data.followingCount)

      fetchUserPosts()
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("Failed to load profile. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:5000/api/posts/user/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setPosts(response.data)
    } catch (error) {
      console.error("Error fetching user posts:", error)
    }
  }

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem("token")
      const endpoint = isFollowing ? "unfollow" : "follow"

      await axios.post(
        `http://localhost:5000/api/users/${profile.id}/${endpoint}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setIsFollowing(!isFollowing)
      setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1)
    } catch (error) {
      console.error(`Error ${isFollowing ? "unfollowing" : "following"} user:`, error)
    }
  }

  if (loading) {
    return <div className="loading-container">Loading profile...</div>
  }

  if (error) {
    return <div className="error-container">{error}</div>
  }

  if (!profile) {
    return <div className="error-container">User not found</div>
  }

  const isOwnProfile = currentUser.id === profile.id

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-cover">
          <img src={profile.coverImage || "/placeholder-cover.jpg"} alt="Cover" className="cover-image" />
        </div>

        <div className="profile-info">
          <div className="profile-avatar">
            <img src={profile.profileImage || "/placeholder-user.jpg"} alt={profile.username} className="avatar-lg" />
          </div>

          <div className="profile-details">
            <h1>{profile.fullName}</h1>
            <p className="username">@{profile.username}</p>
            {profile.bio && <p className="bio">{profile.bio}</p>}

            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">{posts.length}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat">
                <span className="stat-value">{followersCount}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat">
                <span className="stat-value">{followingCount}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <Link to="/edit-profile" className="edit-profile-button">
                <FaUserEdit />
                <span>Edit Profile</span>
              </Link>
            ) : (
              <>
                <button onClick={handleFollow} className={`follow-button ${isFollowing ? "following" : ""}`}>
                  {isFollowing ? (
                    <>
                      <FaUserMinus />
                      <span>Unfollow</span>
                    </>
                  ) : (
                    <>
                      <FaUserPlus />
                      <span>Follow</span>
                    </>
                  )}
                </button>
                <Link to={`/messages?user=${profile.username}`} className="message-button">
                  <FaEnvelope />
                  <span>Message</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            Posts
          </button>
          <button
            className={`tab-button ${activeTab === "photos" ? "active" : ""}`}
            onClick={() => setActiveTab("photos")}
          >
            Photos
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "posts" && (
            <div className="posts-tab">
              {posts.length > 0 ? (
                posts.map((post) => <Post key={post.id} post={post} onUpdate={fetchUserPosts} />)
              ) : (
                <div className="no-posts">
                  <p>No posts yet</p>
                  {isOwnProfile && <p>Share your first post with the world!</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === "photos" && (
            <div className="photos-tab">
              {posts.filter((post) => post.image).length > 0 ? (
                <div className="photos-grid">
                  {posts
                    .filter((post) => post.image)
                    .map((post) => (
                      <Link to={`/post/${post.id}`} key={post.id} className="photo-item">
                        <img src={post.image || "/placeholder.svg"} alt="Post" />
                      </Link>
                    ))}
                </div>
              ) : (
                <div className="no-photos">
                  <p>No photos yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
