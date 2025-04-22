"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import CreatePost from "../components/CreatePost"
import Post from "../components/Post"
import UserCard from "../components/UserCard"
import "./Home.css"

const Home = () => {
  const [posts, setPosts] = useState([])
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchFeed()
    fetchSuggestedUsers()
  }, [])

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/posts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Posts fetched: ", response.data);
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching feed:", error);
      setError("Failed to load your feed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:5000/api/users/suggestions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setSuggestedUsers(response.data)
    } catch (error) {
      console.error("Error fetching suggested users:", error)
    }
  }

  const handleFollowChange = (userId, isFollowing) => {
    setSuggestedUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isFollowing } : user)))
  }

  return (
    <div className="home-container">
      <div className="feed-container">
        <CreatePost onPostCreated={fetchFeed} />

        {loading ? (
          <div className="loading-container">Loading your feed...</div>
        ) : error ? (
          <div className="error-container">{error}</div>
        ) : posts.length > 0 ? (
          posts.map((post) => <Post key={post.id} post={post} onUpdate={fetchFeed} />)
        ) : (
          <div className="empty-feed">
            <h3>Your feed is empty</h3>
            <p>Follow more users to see their posts here, or create your first post!</p>
          </div>
        )}
      </div>

      <div className="sidebar">
        <div className="sidebar-section">
          <h3>People you might know</h3>
          {suggestedUsers.length > 0 ? (
            <div className="suggested-users">
              {suggestedUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isFollowing={user.isFollowing}
                  onFollowChange={handleFollowChange}
                />
              ))}
            </div>
          ) : (
            <p className="no-suggestions">No suggestions available right now.</p>
          )}
        </div>

        <div className="sidebar-section">
          <h3>Trending Tags</h3>
          <div className="trending-tags">
            <div className="tag">#photography</div>
            <div className="tag">#travel</div>
            <div className="tag">#food</div>
            <div className="tag">#technology</div>
            <div className="tag">#music</div>
          </div>
        </div>

        <footer className="sidebar-footer">
          <p>© 2023 Trend Engage by shrikeshshetty</p>
          <div className="footer-links">
            <a href="#">About</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Home
