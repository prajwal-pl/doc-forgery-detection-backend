import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} directoryPath Path to ensure exists
 * @returns {string} The confirmed directory path
 */
export const ensureDirectoryExists = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
  return directoryPath;
};

/**
 * Get the absolute path from a relative path
 * @param {string} relativePath Path relative to the project root
 * @returns {string} Absolute path
 */
export const getAbsolutePath = (relativePath) => {
  // Navigate up from utils directory to project root
  const projectRoot = path.resolve(__dirname, "..", "..");
  return path.join(projectRoot, relativePath);
};

/**
 * Cleans up temporary files
 * @param {Array<string>} filePaths Array of file paths to clean up
 */
export const cleanupTempFiles = (filePaths) => {
  filePaths.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
      }
    }
  });
};

/**
 * Gets an array of all valid image files in a directory
 * @param {string} directory Directory to scan
 * @returns {Array<string>} Array of full image file paths
 */
export const getImageFilesInDirectory = (directory) => {
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory)
    .filter((file) => /\.(jpg|jpeg|png|tif|tiff|bmp)$/i.test(file));
};
