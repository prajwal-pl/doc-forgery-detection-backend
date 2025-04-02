import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import documentRoutes from "./routes/documentRoutes.js";
import { ensureDirectoryExists } from "./utils/fileUtils.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Increase JSON payload size limit
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Set up CORS with more options
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Create necessary directories
const uploadsDir = path.join(__dirname, "uploads");
const genuineDir = path.join(__dirname, "lib", "genuine");

ensureDirectoryExists(uploadsDir);
ensureDirectoryExists(genuineDir);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Document Forgery Detection API");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "up", timestamp: new Date() });
});

// Use document routes
app.use("/api/documents", documentRoutes);

// Serve uploaded files for development/debugging
app.use("/uploads", express.static(uploadsDir));

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err);
  res.status(500).json({
    success: false,
    message: "Server error",
    error: err.message,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
  console.log(`Genuine documents directory: ${genuineDir}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Application continues running
});
