const express = require("express");
const db = require("../database");
const { upload } = require("../middleware/upload");

const router = express.Router();

// Create a new post
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;
    const image = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null;

    const [result] = await db.execute(
      "INSERT INTO posts (userId, content, image) VALUES (?, ?, ?)",
      [userId, content, image]
    );

    const postId = result.insertId;

    const [posts] = await db.execute(
      `SELECT p.*, u.firstName, u.lastName, u.username, u.profileImage
       FROM posts p
       JOIN users u ON p.userId = u.id
       WHERE p.id = ?`,
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    const post = posts[0];

    res.status(201).json({
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
      likes: [],
      comments: [],
      likeCount: 0,
      commentCount: 0,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
});

// Get a single post
router.get("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const [posts] = await db.execute(
      `SELECT p.*, u.firstName, u.lastName, u.username, u.profileImage,
              (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likeCount,
              (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount,
              (SELECT COUNT(*) FROM likes WHERE postId = p.id AND userId = ?) as userLiked
       FROM posts p
       JOIN users u ON p.userId = u.id
       WHERE p.id = ?`,
      [userId, postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    const post = posts[0];

    const [likes] = await db.execute("SELECT userId FROM likes WHERE postId = ?", [postId]);

    const [comments] = await db.execute(
      `SELECT c.*, u.firstName, u.lastName, u.username, u.profileImage
       FROM comments c
       JOIN users u ON c.userId = u.id
       WHERE c.postId = ?
       ORDER BY c.createdAt DESC`,
      [postId]
    );

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: {
        id: comment.userId,
        fullName: `${comment.firstName} ${comment.lastName}`,
        username: comment.username,
        profileImage: comment.profileImage,
      },
    }));

    res.json({
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
      comments: formattedComments,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      userLiked: post.userLiked > 0,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Failed to fetch post" });
  }
});

// Get user posts
router.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user.id;

    const [users] = await db.execute("SELECT id FROM users WHERE username = ?", [username]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const profileUserId = users[0].id;

    const [posts] = await db.execute(
      `SELECT p.*, u.firstName, u.lastName, u.username, u.profileImage,
              (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likeCount,
              (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount,
              (SELECT COUNT(*) FROM likes WHERE postId = p.id AND userId = ?) as userLiked
       FROM posts p
       JOIN users u ON p.userId = u.id
       WHERE p.userId = ?
       ORDER BY p.createdAt DESC`,
      [userId, profileUserId]
    );

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        const [likes] = await db.execute("SELECT userId FROM likes WHERE postId = ?", [post.id]);

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
        };
      })
    );

    res.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Failed to fetch user posts" });
  }
});

// Like or unlike a post
router.post("/:postId/like", async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if the user already liked the post
    const [existingLike] = await db.execute(
      "SELECT * FROM likes WHERE postId = ? AND userId = ?",
      [postId, userId]
    );

    if (existingLike.length > 0) {
      // Unlike the post
      await db.execute("DELETE FROM likes WHERE postId = ? AND userId = ?", [postId, userId]);
      return res.status(200).json({ message: "Post unliked" });
    } else {
      // Like the post
      await db.execute("INSERT INTO likes (postId, userId) VALUES (?, ?)", [postId, userId]);
      return res.status(200).json({ message: "Post liked" });
    }
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ message: "Failed to like/unlike the post" });
  }
});

// Add comment to a post
router.post("/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const [result] = await db.execute(
      "INSERT INTO comments (postId, userId, content) VALUES (?, ?, ?)",
      [postId, userId, content]
    );

    const commentId = result.insertId;

    const [comments] = await db.execute(
      `SELECT c.*, u.firstName, u.lastName, u.username, u.profileImage
       FROM comments c
       JOIN users u ON c.userId = u.id
       WHERE c.id = ?`,
      [commentId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const comment = comments[0];

    // Create notification for post owner
    const [posts] = await db.execute("SELECT userId FROM posts WHERE id = ?", [postId]);
    if (posts.length > 0 && posts[0].userId !== userId) {
      await db.execute(
        "INSERT INTO notifications (userId, senderId, type, postId) VALUES (?, ?, ?, ?)",
        [posts[0].userId, userId, "comment", postId]
      );
    }

    res.status(201).json({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: {
        id: comment.userId,
        fullName: `${comment.firstName} ${comment.lastName}`,
        username: comment.username,
        profileImage: comment.profileImage,
      },
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Failed to add comment" });
  }
});

// Get feed posts
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const [posts] = await db.execute(
      `SELECT p.*, u.firstName, u.lastName, u.username, u.profileImage,
              (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likeCount,
              (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount,
              EXISTS(SELECT 1 FROM likes WHERE postId = p.id AND userId = ?) as userLiked
       FROM posts p
       JOIN users u ON p.userId = u.id
       WHERE p.userId = ? OR p.userId IN (SELECT followedId FROM follows WHERE followerId = ?)
       ORDER BY p.createdAt DESC
       LIMIT 20`,
      [userId, userId, userId]
    );

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        const [likes] = await db.execute("SELECT userId FROM likes WHERE postId = ?", [post.id]);
        const [comments] = await db.execute(
          `SELECT c.*, u.firstName, u.lastName, u.username, u.profileImage 
           FROM comments c 
           JOIN users u ON c.userId = u.id 
           WHERE c.postId = ?
           ORDER BY c.createdAt DESC`, 
          [post.id]
        );

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
          comments: comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            user: {
              id: comment.userId,
              fullName: `${comment.firstName} ${comment.lastName}`,
              username: comment.username,
              profileImage: comment.profileImage,
            }
          })),
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          userLiked: post.userLiked === 1,
        };
      })
    );

    res.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching feed:", error);
    res.status(500).json({ message: "Failed to fetch feed" });
  }
});

router.get("/explore/trending", async (req, res) => {
  try {
    const userId = req.user.id;

    const [posts] = await db.execute(
      `SELECT p.*, u.firstName, u.lastName, u.username, u.profileImage,
              (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likeCount,
              (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount,
              EXISTS(SELECT 1 FROM likes WHERE postId = p.id AND userId = ?) as userLiked
       FROM posts p
       JOIN users u ON p.userId = u.id
       ORDER BY (
         SELECT COUNT(*) FROM likes WHERE postId = p.id
       ) + (
         SELECT COUNT(*) FROM comments WHERE postId = p.id
       ) DESC, p.createdAt DESC
       LIMIT 20`,
      [userId]
    );

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        const [likes] = await db.execute("SELECT userId FROM likes WHERE postId = ?", [post.id]);
        const [comments] = await db.execute(
          `SELECT c.*, u.firstName, u.lastName, u.username, u.profileImage 
           FROM comments c 
           JOIN users u ON c.userId = u.id 
           WHERE c.postId = ?
           ORDER BY c.createdAt DESC`, 
          [post.id]
        );

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
          comments: comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            user: {
              id: comment.userId,
              fullName: `${comment.firstName} ${comment.lastName}`,
              username: comment.username,
              profileImage: comment.profileImage,
            }
          })),
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          userLiked: post.userLiked === 1,
        };
      })
    );

    res.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching trending posts:", error);
    res.status(500).json({ message: "Failed to fetch trending posts" });
  }
});

router.get("/explore/latest", async (req, res) => {
  try {
    const userId = req.user.id;

    const [posts] = await db.execute(
      `SELECT p.*, u.firstName, u.lastName, u.username, u.profileImage,
              (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likeCount,
              (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount,
              EXISTS(SELECT 1 FROM likes WHERE postId = p.id AND userId = ?) as userLiked
       FROM posts p
       JOIN users u ON p.userId = u.id
       ORDER BY p.createdAt DESC
       LIMIT 20`,
      [userId]
    );

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        const [likes] = await db.execute("SELECT userId FROM likes WHERE postId = ?", [post.id]);
        const [comments] = await db.execute(
          `SELECT c.*, u.firstName, u.lastName, u.username, u.profileImage 
           FROM comments c 
           JOIN users u ON c.userId = u.id 
           WHERE c.postId = ?
           ORDER BY c.createdAt DESC`, 
          [post.id]
        );

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
          comments: comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            user: {
              id: comment.userId,
              fullName: `${comment.firstName} ${comment.lastName}`,
              username: comment.username,
              profileImage: comment.profileImage,
            }
          })),
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          userLiked: post.userLiked === 1,
        };
      })
    );

    res.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching latest posts:", error);
    res.status(500).json({ message: "Failed to fetch latest posts" });
  }
});

module.exports = router;
