"use client"

import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import axios from "axios"
import Post from "../components/Post"
import UserCard from "../components/UserCard"
import "./Explore.css"

const Explore = () => {
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const searchQuery = queryParams.get("q") || ""

  const [activeTab, setActiveTab] = useState("trending")
  const [posts, setPosts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (searchQuery) {
      setActiveTab("search")
      searchContent(searchQuery)
    } else {
      fetchTrendingContent()
    }
  }, [searchQuery])

  const fetchTrendingContent = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:5000/api/posts/explore/trending", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setPosts(response.data)
    } catch (error) {
      console.error("Error fetching trending content:", error)
      setError("Failed to load trending content. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const fetchLatestContent = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:5000/api/posts/explore/latest", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setPosts(response.data)
    } catch (error) {
      console.error("Error fetching latest content:", error)
      setError("Failed to load latest content. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const searchContent = async (query) => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      const [postsResponse, usersResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/search/posts?q=${encodeURIComponent(query)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(`http://localhost:5000/api/search/users?q=${encodeURIComponent(query)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      setPosts(postsResponse.data)
      setUsers(usersResponse.data)
    } catch (error) {
      console.error("Error searching content:", error)
      setError("Failed to search content. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)

    if (tab === "trending") {
      fetchTrendingContent()
    } else if (tab === "latest") {
      fetchLatestContent()
    }
  }

  const handleFollowChange = (userId, isFollowing) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isFollowing } : user)))
  }

  return (
    <div className="explore-container">
      {searchQuery ? (
        <h1 className="search-heading">Search results for "{searchQuery}"</h1>
      ) : (
        <div className="explore-tabs">
          <button
            className={`tab-button ${activeTab === "trending" ? "active" : ""}`}
            onClick={() => handleTabChange("trending")}
          >
            Trending
          </button>
          <button
            className={`tab-button ${activeTab === "latest" ? "active" : ""}`}
            onClick={() => handleTabChange("latest")}
          >
            Latest
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">Loading content...</div>
      ) : error ? (
        <div className="error-container">{error}</div>
      ) : (
        <div className="explore-content">
          {searchQuery && users.length > 0 && (
            <div className="users-section">
              <h2>Users</h2>
              <div className="users-grid">
                {users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isFollowing={user.isFollowing}
                    onFollowChange={handleFollowChange}
                  />
                ))}
              </div>
            </div>
          )}

          {posts.length > 0 ? (
            <div className="posts-section">
              {searchQuery && <h2>Posts</h2>}
              {posts.map((post) => (
                <Post key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="no-content">
              {searchQuery ? <p>No results found for "{searchQuery}"</p> : <p>No {activeTab} content available</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Explore
