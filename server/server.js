const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const multer = require("multer"); // Import multer

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const notificationRoutes = require("./routes/notifications");
const searchRoutes = require("./routes/search");
const messagesRoutes = require("./routes/messages"); // Added messages routes

// Import middleware
const { authenticateToken } = require("./middleware/auth");

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");  // Files will be uploaded to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Save files with unique names
  }
});

const upload = multer({ storage: storage });
// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", authenticateToken, userRoutes);
app.use("/api/posts", authenticateToken, postRoutes);
app.use("/api/notifications", authenticateToken, notificationRoutes);
app.use("/api/search", authenticateToken, searchRoutes);
app.use("/api/messages", authenticateToken, messagesRoutes); // Added messages routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
