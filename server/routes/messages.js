const express = require("express");
const db = require("../database");

const router = express.Router();

// Get conversations
router.get("/conversations", async (req, res) => {
  try {
    const userId = req.user.id;

    const [conversations] = await db.execute(
      `SELECT DISTINCT 
        u.id, u.firstName, u.lastName, u.username, u.profileImage,
        (SELECT content FROM messages 
         WHERE (senderId = ? AND receiverId = u.id) 
         OR (senderId = u.id AND receiverId = ?) 
         ORDER BY createdAt DESC LIMIT 1) as lastMessage,
        (SELECT createdAt FROM messages 
         WHERE (senderId = ? AND receiverId = u.id) 
         OR (senderId = u.id AND receiverId = ?) 
         ORDER BY createdAt DESC LIMIT 1) as lastMessageTime,
        (SELECT COUNT(*) FROM messages 
         WHERE senderId = u.id AND receiverId = ? AND \`read\` = 0) as unreadCount
       FROM messages m
       JOIN users u ON (m.senderId = u.id OR m.receiverId = u.id)
       WHERE (m.senderId = ? OR m.receiverId = ?) AND u.id != ?
       GROUP BY u.id
       ORDER BY lastMessageTime DESC`,
      [userId, userId, userId, userId, userId, userId, userId, userId]
    );

    const formattedConversations = conversations.map(conv => ({
      user: {
        id: conv.id,
        fullName: `${conv.firstName} ${conv.lastName}`,
        username: conv.username,
        profileImage: conv.profileImage
      },
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      unreadCount: conv.unreadCount
    }));

    res.json(formattedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

// Get messages with a specific user
router.get("/:userId", async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    // Mark messages as read
    await db.execute(
      "UPDATE messages SET `read` = 1 WHERE senderId = ? AND receiverId = ?",
      [otherUserId, currentUserId]
    );

    // Get messages
    const [messages] = await db.execute(
      `SELECT m.*, 
        u.firstName, u.lastName, u.username, u.profileImage
       FROM messages m
       JOIN users u ON m.senderId = u.id
       WHERE (m.senderId = ? AND m.receiverId = ?)
       OR (m.senderId = ? AND m.receiverId = ?)
       ORDER BY m.createdAt ASC`,
      [currentUserId, otherUserId, otherUserId, currentUserId]
    );

    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      senderId: message.senderId,
      receiverId: message.receiverId,
      read: message.read === 1
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Send a message
router.post("/", async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    const [result] = await db.execute(
      "INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)",
      [senderId, receiverId, content]
    );

    const messageId = result.insertId;

    const [messages] = await db.execute(
      `SELECT m.*, u.firstName, u.lastName, u.username, u.profileImage
       FROM messages m
       JOIN users u ON m.senderId = u.id
       WHERE m.id = ?`,
      [messageId]
    );

    if (messages.length === 0) {
      return res.status(404).json({ message: "Message not found" });
    }

    const message = messages[0];

    res.status(201).json({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      senderId: message.senderId,
      receiverId: message.receiverId,
      read: message.read === 1
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Mark messages as read
router.put("/:userId/read", async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    await db.execute(
      "UPDATE messages SET `read` = 1 WHERE senderId = ? AND receiverId = ?",
      [otherUserId, currentUserId]
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
});

module.exports = router;