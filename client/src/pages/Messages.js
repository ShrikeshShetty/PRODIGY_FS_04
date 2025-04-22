"use client"

import { useState, useEffect, useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import axios from "axios"
import { Link, useLocation } from "react-router-dom"
import moment from "moment"
import "./Messages.css"

const Messages = () => {
  const { currentUser } = useContext(AuthContext)
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const targetUsername = queryParams.get("user")

  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (targetUsername && !selectedUser) {
      initializeDirectMessage()
    }
  }, [targetUsername, conversations])

  useEffect(() => {
    // Auto-scroll to bottom of messages list
    const messagesList = document.getElementById("messages-list")
    if (messagesList) {
      messagesList.scrollTop = messagesList.scrollHeight
    }
  }, [messages])

  const initializeDirectMessage = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:5000/api/users/profile/${targetUsername}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const targetUser = {
        id: response.data.id,
        fullName: response.data.fullName,
        username: response.data.username,
        profileImage: response.data.profileImage,
      }

      setSelectedUser(targetUser)
      fetchMessages(targetUser.id)
    } catch (error) {
      console.error("Error initializing direct message:", error)
    }
  }

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:5000/api/messages/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setConversations(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching conversations:", error)
      setLoading(false)
    }
  }

  const fetchMessages = async (userId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:5000/api/messages/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setMessages(response.data)
      
      // Mark messages as read
      if (response.data.length > 0) {
        await axios.put(
          `http://localhost:5000/api/messages/${userId}/read`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return

    try {
      const token = localStorage.getItem("token")
      await axios.post(
        "http://localhost:5000/api/messages",
        {
          receiverId: selectedUser.id,
          content: newMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setNewMessage("")
      fetchMessages(selectedUser.id)
      fetchConversations()
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  if (loading) {
    return <div className="loading-container">Loading messages...</div>
  }

  return (
    <div className="messages-container">
      <div className="conversations-list">
        <h2>Messages</h2>
        {conversations.length > 0 ? (
          conversations.map((conv) => (
            <div
              key={conv.user.id}
              className={`conversation-item ${selectedUser?.id === conv.user.id ? "active" : ""}`}
              onClick={() => {
                setSelectedUser(conv.user)
                fetchMessages(conv.user.id)
              }}
            >
              <img
                src={conv.user.profileImage ? `http://localhost:5000${conv.user.profileImage}` : "/placeholder-user.jpg"}
                alt={conv.user.username}
                className="avatar"
              />
              <div className="conversation-info">
                <h4>{conv.user.fullName}</h4>
                <p className="last-message">{conv.lastMessage}</p>
                <span className="message-time">{moment(conv.lastMessageTime).fromNow()}</span>
              </div>
              {conv.unreadCount > 0 && <span className="unread-count">{conv.unreadCount}</span>}
            </div>
          ))
        ) : (
          <p className="no-conversations">No conversations yet</p>
        )}
      </div>

      <div className="messages-content">
        {selectedUser ? (
          <>
            <div className="messages-header">
              <Link to={`/profile/${selectedUser.username}`} className="user-info">
                <img
                  src={selectedUser.profileImage ? `http://localhost:5000${selectedUser.profileImage}` : "/placeholder-user.jpg"}
                  alt={selectedUser.username}
                  className="avatar"
                />
                <h3>{selectedUser.fullName}</h3>
              </Link>
            </div>

            <div className="messages-list" id="messages-list">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.senderId === currentUser.id ? "sent" : "received"}`}
                >
                  <div className="message-content">
                    <p>{message.content}</p>
                    <span className="message-time">{moment(message.createdAt).fromNow()}</span>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} className="message-form">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="message-input"
              />
              <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Messages