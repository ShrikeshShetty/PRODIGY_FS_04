const express = require("express")
const db = require("../database")

const router = express.Router()

// Search posts
router.get("/posts", async (req, res) => {
  try {
    const { q } = req.query
    const userId = req.user.id

    if (!q) {
      return res.json([])
    }

    // Search posts by content
    const [posts] = await db.execute(
      `SELECT p.*, u.firstName, u.lastName, u.username, u.profileImage,
              (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likeCount,
              (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount,
              (SELECT COUNT(*) FROM likes WHERE postId = p.id AND userId = ?) as userLiked
       FROM posts p
       JOIN users u ON p.userId = u.id
       WHERE p.content LIKE ?
       ORDER BY p.createdAt DESC
       LIMIT 20`,
      [userId, `%${q}%`],
    )

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        // Get likes
        const [likes] = await db.execute("SELECT userId FROM likes WHERE postId = ?", [post.id])

        return {
          id: post.id,
          content: post.content,
          image: post.image,
          createdAt: post.createdAt,
          user: {
            id: post.userId,
            fullName: `${post.firstName} ${post.lastName}`,
            username: post.username,
            profileImage: post.profileImage,
          },
          likes: likes.map((like) => like.userId),
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          userLiked: post.userLiked > 0,
        }
      }),
    )

    res.json(formattedPosts)
  } catch (error) {
    console.error("Error searching posts:", error)
    res.status(500).json({ message: "Failed to search posts" })
  }
})

// Search users
router.get("/users", async (req, res) => {
  try {
    const { q } = req.query
    const userId = req.user.id

    if (!q) {
      return res.json([])
    }

    // Search users by name or username
    const [users] = await db.execute(
      `SELECT u.id, u.firstName, u.lastName, u.username, u.profileImage,
              (SELECT COUNT(*) FROM follows WHERE followerId = ? AND followedId = u.id) as isFollowing
       FROM users u
       WHERE u.id != ? AND (
         u.firstName LIKE ? OR
         u.lastName LIKE ? OR
         u.username LIKE ? OR
         CONCAT(u.firstName, ' ', u.lastName) LIKE ?
       )
       LIMIT 20`,
      [userId, userId, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`],
    )

    const formattedUsers = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      username: user.username,
      profileImage: user.profileImage,
      isFollowing: user.isFollowing > 0,
    }))

    res.json(formattedUsers)
  } catch (error) {
    console.error("Error searching users:", error)
    res.status(500).json({ message: "Failed to search users" })
  }
})

module.exports = router
