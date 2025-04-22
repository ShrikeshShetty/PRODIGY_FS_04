const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../database");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Setup multer for file uploads (same as before)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Files will be uploaded to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save files with unique names
  }
});

const upload = multer({ storage: storage });

// Register a new user
router.post("/register", upload.fields([{ name: 'profileImage' }, { name: 'coverImage' }]), async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, bio } = req.body;
    const baseURL = `${req.protocol}://${req.get("host")}`;

const profileImage = req.files?.profileImage
  ? `/uploads/${req.files.profileImage[0].filename}`
  : null;

const coverImage = req.files?.coverImage
  ? `/uploads/${req.files.coverImage[0].filename}`
  : null;

    // Check if username or email already exists
    const [existingUsers] = await db.execute(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already taken" });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db.execute(
      "INSERT INTO users (firstName, lastName, username, email, password, profileImage, coverImage, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        firstName,
        lastName,
        username,
        email,
        hashedPassword,
        profileImage || null,
        coverImage || null,
        bio || null,
      ]
    );

    const userId = result.insertId;

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, username, email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data and token
    res.status(201).json({
      token,
      user: {
        id: userId,
        firstName,
        lastName,
        username,
        email,
        profileImage: profileImage || null,
        coverImage: coverImage || null,
        bio: bio || null,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in the database by email
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);

    // If user not found
    if (users.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = users[0];

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user info and the token
    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        coverImage: user.coverImage,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
