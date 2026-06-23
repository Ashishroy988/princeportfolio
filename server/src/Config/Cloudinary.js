import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

export const isCloudinaryConfigured = () => Boolean(cloudName && apiKey && apiSecret);

export const getCloudinaryAssetFromUrl = (assetUrl) => {
  if (!assetUrl || !cloudName) {
    return null;
  }

  try {
    const url = new URL(assetUrl);
    const segments = url.pathname.split("/").filter(Boolean);

    if (url.hostname !== "res.cloudinary.com" || segments[0] !== cloudName || segments[2] !== "upload") {
      return null;
    }

    const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
    const publicIdSegments = segments.slice(versionIndex >= 0 ? versionIndex + 1 : 3);
    const lastSegment = publicIdSegments.at(-1);

    if (!lastSegment) {
      return null;
    }

    publicIdSegments[publicIdSegments.length - 1] = lastSegment.replace(/\.[^.]+$/, "");

    return {
      publicId: publicIdSegments.join("/"),
      resourceType: segments[1]
    };
  } catch {
    return null;
  }
};

export const deleteFromCloudinary = async (asset) => {
  if (!isCloudinaryConfigured() || !asset?.publicId) {
    return false;
  }

  await cloudinary.uploader.destroy(asset.publicId, {
    resource_type: asset.resourceType || "image",
    invalidate: true
  });

  return true;
};
