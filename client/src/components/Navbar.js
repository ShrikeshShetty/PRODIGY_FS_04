"use client"

import { useContext, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FaHome, FaCompass, FaBell, FaUser, FaSignOutAlt, FaSearch, FaEnvelope } from "react-icons/fa"
import { AuthContext } from "../context/AuthContext"
import { NotificationContext } from "../context/NotificationContext"
import "./Navbar.css"

const Navbar = () => {
  const { currentUser, logout } = useContext(AuthContext)
  const { unreadCount } = useContext(NotificationContext)
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  if (!currentUser) {
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            Trend Engage
          </Link>
          <div className="navbar-right">
            <Link to="/login" className="navbar-link">
              Login
            </Link>
            <Link to="/register" className="navbar-link">
              Register
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Trend Engage
        </Link>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            <FaSearch />
          </button>
        </form>

        <div className="navbar-links">
          <Link to="/" className="navbar-icon-link">
            <FaHome />
            <span className="nav-text">Home</span>
          </Link>
          <Link to="/explore" className="navbar-icon-link">
            <FaCompass />
            <span className="nav-text">Explore</span>
          </Link>
          <Link to="/messages" className="navbar-icon-link">
            <FaEnvelope />
            <span className="nav-text">Messages</span>
          </Link>
          <Link to="/notifications" className="navbar-icon-link notification-icon">
            <FaBell />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            <span className="nav-text">Notifications</span>
          </Link>
          <Link to={`/profile/${currentUser.username}`} className="navbar-icon-link">
            <FaUser />
            <span className="nav-text">Profile</span>
          </Link>
          <button onClick={logout} className="navbar-icon-link logout-button">
            <FaSignOutAlt />
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
