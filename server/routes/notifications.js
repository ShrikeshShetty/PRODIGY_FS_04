const express = require("express")
const db = require("../database")

const router = express.Router()

// Get all notifications for current user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id

    // Get notifications with sender info
    const [notifications] = await db.execute(
      `SELECT n.*, u.firstName, u.lastName, u.username, u.profileImage
       FROM notifications n
       JOIN users u ON n.senderId = u.id
       WHERE n.userId = ?
       ORDER BY n.createdAt DESC`,
      [userId],
    )

    const formattedNotifications = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      read: notification.read === 1,
      createdAt: notification.createdAt,
      postId: notification.postId,
      sender: {
        id: notification.senderId,
        fullName: `${notification.firstName} ${notification.lastName}`,
        username: notification.username,
        profileImage: notification.profileImage,
      },
    }))

    res.json(formattedNotifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    res.status(500).json({ message: "Failed to fetch notifications" })
  }
})

// Mark notification as read
router.put("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params
    const userId = req.user.id

    // Check if notification exists and belongs to user
    const [notifications] = await db.execute("SELECT * FROM notifications WHERE id = ? AND userId = ?", [
      notificationId,
      userId,
    ])

    if (notifications.length === 0) {
      return res.status(404).json({ message: "Notification not found" })
    }

    // Mark as read
    await db.execute("UPDATE notifications SET `read` = 1 WHERE id = ?", [notificationId])

    res.json({ message: "Notification marked as read" })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    res.status(500).json({ message: "Failed to mark notification as read" })
  }
})

// Mark all notifications as read
router.put("/read-all", async (req, res) => {
  try {
    const userId = req.user.id

    // Mark all as read
    await db.execute("UPDATE notifications SET `read` = 1 WHERE userId = ?", [userId])

    res.json({ message: "All notifications marked as read" })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    res.status(500).json({ message: "Failed to mark all notifications as read" })
  }
})

module.exports = router
