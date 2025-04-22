"use client"

import { useContext, useEffect } from "react"
import { NotificationContext } from "../context/NotificationContext"
import NotificationItem from "../components/NotificationItem"
import "./Notifications.css"

const Notifications = () => {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useContext(NotificationContext)

  useEffect(() => {
    fetchNotifications()
  }, [])

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="mark-all-read">
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} onMarkAsRead={markAsRead} />
          ))}
        </div>
      ) : (
        <div className="no-notifications">
          <p>You don't have any notifications yet</p>
        </div>
      )}
    </div>
  )
}

export default Notifications
