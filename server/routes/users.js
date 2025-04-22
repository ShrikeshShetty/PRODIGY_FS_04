const express = require("express");
const db = require("../database");
const { upload } = require("../middleware/upload");

const router = express.Router();

// Get user profile by username
router.get("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.id;

    const [users] = await db.execute(
      `SELECT u.id, u.firstName, u.lastName, u.username, u.email, u.profileImage, 
              u.coverImage, u.bio, u.createdAt,
              (SELECT COUNT(*) FROM follows WHERE followedId = u.id) as followersCount,
              (SELECT COUNT(*) FROM follows WHERE followerId = u.id) as followingCount,
              (SELECT COUNT(*) FROM follows WHERE followerId = ? AND followedId = u.id) as isFollowing
       FROM users u
       WHERE u.username = ?`,
      [currentUserId, username]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    user.isFollowing = user.isFollowing > 0;

    // Construct full URLs for images
    const baseURL = "http://localhost:5000";

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage ? `${baseURL}${user.profileImage}` : null,
      coverImage: user.coverImage ? `${baseURL}${user.coverImage}` : null,
      bio: user.bio,
      createdAt: user.createdAt,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      isFollowing: user.isFollowing,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
});





// Update user profile
router.put(
  "/profile",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, bio } = req.body;

      const [users] = await db.execute("SELECT profileImage, coverImage FROM users WHERE id = ?", [userId]);

      if (users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentUser = users[0];

      const updateData = {
        firstName,
        lastName,
        bio: bio || null,
      };

      // Build base URL
      const baseURL = `${req.protocol}://${req.get("host")}`;

      // Profile Image
      if (req.files && req.files.profileImage) {
        const filename = req.files.profileImage[0].filename.replace(/\\/g, "/");
        updateData.profileImage = `${baseURL}/uploads/${filename}`;
      }

      // Cover Image
      if (req.files && req.files.coverImage) {
        const filename = req.files.coverImage[0].filename.replace(/\\/g, "/");
        updateData.coverImage = `${baseURL}/uploads/${filename}`;
      }

      const columns = Object.keys(updateData)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(updateData);

      await db.execute(`UPDATE users SET ${columns} WHERE id = ?`, [...values, userId]);

      const [updatedUsers] = await db.execute(
        "SELECT id, firstName, lastName, username, email, profileImage, coverImage, bio, createdAt FROM users WHERE id = ?",
        [userId]
      );

      const updatedUser = updatedUsers[0];

      res.json({
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        coverImage: updatedUser.coverImage,
        bio: updatedUser.bio,
        createdAt: updatedUser.createdAt,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
);













// Follow a user
router.post("/:userId/follow", async (req, res) => {
  try {
    const followerId = req.user.id;
    const followedId = Number.parseInt(req.params.userId);

    const [users] = await db.execute("SELECT id FROM users WHERE id = ?", [followedId]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [follows] = await db.execute("SELECT * FROM follows WHERE followerId = ? AND followedId = ?", [
      followerId,
      followedId,
    ]);

    if (follows.length > 0) {
      return res.status(400).json({ message: "Already following this user" });
    }

    await db.execute("INSERT INTO follows (followerId, followedId) VALUES (?, ?)", [followerId, followedId]);

    await db.execute("INSERT INTO notifications (userId, senderId, type) VALUES (?, ?, ?)", [
      followedId,
      followerId,
      "follow",
    ]);

    res.status(201).json({ message: "Successfully followed user" });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ message: "Failed to follow user" });
  }
});

// Unfollow a user
router.post("/:userId/unfollow", async (req, res) => {
  try {
    const followerId = req.user.id;
    const followedId = Number.parseInt(req.params.userId);

    const [users] = await db.execute("SELECT id FROM users WHERE id = ?", [followedId]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.execute("DELETE FROM follows WHERE followerId = ? AND followedId = ?", [followerId, followedId]);

    res.json({ message: "Successfully unfollowed user" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ message: "Failed to unfollow user" });
  }
});

// Get suggested users
router.get("/suggestions", async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.execute(
      `SELECT u.id, u.firstName, u.lastName, u.username, u.profileImage,
              (SELECT COUNT(*) FROM follows WHERE followerId = ? AND followedId = u.id) as isFollowing
       FROM users u
       WHERE u.id != ?
       ORDER BY RAND()
       LIMIT 5`,
      [userId, userId]
    );

    const baseURL = "http://localhost:5000";

    const suggestions = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      username: user.username,
      profileImage: user.profileImage ? `${baseURL}${user.profileImage}` : null,
      isFollowing: user.isFollowing > 0,
    }));

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching user suggestions:", error);
    res.status(500).json({ message: "Failed to fetch user suggestions" });
  }
});

module.exports = router;
