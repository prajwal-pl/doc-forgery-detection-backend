import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { verifyDocument } from "../controllers/documentController.js";
import { ensureDirectoryExists } from "../utils/fileUtils.js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
const genuineDir = path.join(__dirname, "..", "lib", "genuine");
ensureDirectoryExists(uploadsDir);
ensureDirectoryExists(genuineDir);

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

// Configure storage for genuine documents
const genuineStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, genuineDir);
  },
  filename: function (req, file, cb) {
    // For genuine documents, preserve the original filename
    cb(null, file.originalname);
  },
});

// Accept all files
const fileFilter = (req, file, cb) => {
  console.log(
    `Received file: ${file.originalname}, mimetype: ${file.mimetype}`
  );
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
}).single("document");

const genuineUpload = multer({
  storage: genuineStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
}).single("document");

// Document verification route with error handling
router.post("/verify", (req, res) => {
  console.log("Received file upload request for verification");

  // Set a timeout for the upload process
  const uploadTimeout = setTimeout(() => {
    console.error("Upload process timed out");
    return res.status(408).json({
      success: false,
      message: "Upload process timed out",
    });
  }, 30000); // 30 second timeout (increased from 15 seconds)

  upload(req, res, function (err) {
    clearTimeout(uploadTimeout);

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
    console.log("Upload successful, calling document verification");
    verifyDocument(req, res);
  });
});

// Add a genuine document route
router.post("/add-genuine", (req, res) => {
  console.log("Received request to add a genuine document");

  genuineUpload(req, res, function (err) {
    if (err) {
      console.error("Error adding genuine document:", err);
      return res.status(400).json({
        success: false,
        message: `Error adding genuine document: ${err.message}`,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Genuine document added successfully",
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: req.file.path,
      },
    });
  });
});

// Get list of genuine documents
router.get("/genuine-list", (req, res) => {
  try {
    const files = fs
      .readdirSync(genuineDir)
      .filter((file) => /\.(jpg|jpeg|png|tif|tiff|bmp)$/i.test(file));

    return res.status(200).json({
      success: true,
      count: files.length,
      genuineDocuments: files,
    });
  } catch (error) {
    console.error("Error getting genuine document list:", error);
    return res.status(500).json({
      success: false,
      message: `Error retrieving genuine documents: ${error.message}`,
    });
  }
});

// Test endpoint that just confirms upload without processing
router.post("/test-upload", upload, (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  return res.status(200).json({
    success: true,
    message: "File uploaded successfully (test endpoint)",
    file: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
    },
  });
});

export default router;
