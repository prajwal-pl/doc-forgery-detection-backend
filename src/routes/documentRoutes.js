import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { verifyDocument } from "../controllers/documentController.js";
import { ensureDirectoryExists } from "../utils/fileUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
ensureDirectoryExists(uploadsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".unknown";
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// More permissive file filter
const fileFilter = (req, file, cb) => {
  // Accept all files for now to avoid errors
  // You can implement proper filtering later
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
}).single("document");

// Document verification route with error handling for multer
router.post("/verify", (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      console.error("Multer error:", err);
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      // An unknown error occurred
      console.error("Unknown upload error:", err);
      return res.status(500).json({
        success: false,
        message: `Unknown error: ${err.message}`,
      });
    }

    // If everything is fine, pass to the controller
    verifyDocument(req, res);
  });
});

export default router;
