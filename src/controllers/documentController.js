import { compareImages } from "../services/imageService.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Handles document verification requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const verifyDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or file is not an image",
      });
    }

    const genuineDir = path.join(__dirname, "..", "lib", "genuine");
    const uploadedFilePath = req.file.path;

    console.log(`Processing uploaded file: ${uploadedFilePath}`);

    // Only call compareImages and send one response - not both
    const result = await compareImages(uploadedFilePath, genuineDir);
    return res.status(200).json({
      success: true,
      fileName: req.file.originalname,
      storedAs: path.basename(req.file.path),
      isGenuine: !result.isForged,
      similarity: result.similarity,
      message: result.isForged
        ? "Document appears to be forged"
        : "Document is genuine",
      bestMatch: result.bestMatch,
      details: result.details,
    });
  } catch (error) {
    console.error("Error verifying document:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing document",
      error: error.message,
    });
  }
};
