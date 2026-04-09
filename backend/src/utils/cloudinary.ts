// utils/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { appLogger } from "./logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file to Cloudinary (replaces uploadToS3Bucket)
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `ulearn/${folder}`, // Creates: ulearn/thumbnails, ulearn/demoVideos
        resource_type: "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url); // Returns direct URL
      },
    );

    const readableStream = new Readable();
    readableStream.push(file.buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

// Delete file from Cloudinary (optional, for cleanup)
export const deleteFromCloudinary = async (url: string): Promise<void> => {
  try {
    // Extract public ID from URL
    const match = url.match(/\/ulearn\/([^?]+)/);
    if (match) {
      const publicId = `ulearn/${match[1].split(".")[0]}`;
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    appLogger.error("Error deleting from Cloudinary:", error);
  }
};

// Get optimized image URL
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    crop?: string;
  } = {},
): string => {
  const transformations = [];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.crop) transformations.push(`c_${options.crop}`);

  const transformationStr =
    transformations.length > 0 ? `${transformations.join(",")}/` : "";

  return cloudinary.url(publicId, {
    secure: true,
    transformation: transformationStr,
  });
};

// Extract public ID from Cloudinary URL
export const extractPublicIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/upload\/(?:v\d+\/)?([^.]+)/);
  return match ? match[1] : null;
};

export default cloudinary;
