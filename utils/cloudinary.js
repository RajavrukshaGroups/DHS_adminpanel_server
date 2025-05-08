import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (fileInput, folder = "dhs-project-status/member-uploads") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) {
        console.error("Cloudinary upload error:", error);
        reject(error);
      } else {
        resolve(result);
      }
    });

    if (Buffer.isBuffer(fileInput)) {
      streamifier.createReadStream(fileInput).pipe(uploadStream);
    } else if (typeof fileInput === "string") {
      fs.createReadStream(fileInput).pipe(uploadStream);
    } else {
      reject(new Error("Invalid file input: must be Buffer or path string"));
    }
  });
};

