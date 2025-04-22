"use client"
import { Link } from "react-router-dom"
import moment from "moment"
import { FaHeart, FaComment, FaUserPlus } from "react-icons/fa"
import "./NotificationItem.css"

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case "like":
        return <FaHeart className="notification-icon like" />
      case "comment":
        return <FaComment className="notification-icon comment" />
      case "follow":
        return <FaUserPlus className="notification-icon follow" />
      default:
        return null
    }
  }

  const getNotificationText = () => {
    switch (notification.type) {
      case "like":
        return "liked your post"
      case "comment":
        return "commented on your post"
      case "follow":
        return "started following you"
      default:
        return "interacted with you"
    }
  }

  const getNotificationLink = () => {
    switch (notification.type) {
      case "like":
      case "comment":
        return `/post/${notification.postId}`
      case "follow":
        return `/profile/${notification.sender.username}`
      default:
        return "#"
    }
  }

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <Link
      to={getNotificationLink()}
      className={`notification-item ${!notification.read ? "unread" : ""}`}
      onClick={handleClick}
    >
      <div className="notification-avatar">
        <img
          src={notification.sender.profileImage || "/placeholder-user.jpg"}
          alt={notification.sender.username}
          className="avatar"
        />
        {getNotificationIcon()}
      </div>

      <div className="notification-content">
        <p>
          <span className="notification-sender">{notification.sender.fullName}</span> {getNotificationText()}
        </p>
        <span className="notification-time">{moment(notification.createdAt).fromNow()}</span>
      </div>
    </Link>
  )
}

export default NotificationItem
