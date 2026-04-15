import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
    api_key: process.env.CLOUDINARY_API_KEY ,
    api_secret: process.env.CLOUDINARY_API_SECRET ,
});

// Helper: upload buffer to Cloudinary via stream
function uploadStream(buffer, options) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
        streamifier.createReadStream(buffer).pipe(stream);
    });
}

export async function uploadFileGeneral(req, res) {
    try {
        console.log("[Upload] Received request:", req.file ? req.file.originalname : "No file");
        if (!req.file) {
            return res.status(400).json({ status: "error", message: "No file uploaded" });
        }

        const fileName = req.file.originalname;
        const ext = fileName.split('.').pop().toLowerCase();
        const isImage = ["jpg", "jpeg", "png", "gif"].includes(ext);
        const resource_type = isImage ? "image" : "raw";

        console.log("[Upload] Streaming to Cloudinary...", { resource_type, fileName });

        const result = await uploadStream(req.file.buffer, {
            resource_type,
            folder: "campus_study_general",
            // IMPORTANT: For 'raw' files, the extension must be part of the public_id
            public_id: `${Date.now()}_${fileName.replace(/[^a-z0-9.]/gi, '_')}`,
            use_filename: true,
            unique_filename: false,
        });

        console.log("[Upload] Cloudinary Result:", JSON.stringify(result, null, 2));

        if (!result || !result.secure_url) {
            // Cloudinary sometimes puts error in 'message' if it's not a throw-level error
            throw new Error(result?.error?.message || "Cloudinary upload failed to return a URL.");
        }

        return res.status(201).json({
            status: "success",
            url: result.secure_url,
            fileName,
            fileSize: req.file.size,
        });

    } catch (e) {
        console.error("[Upload Error]", e);
        return res.status(500).json({ status: "error", message: e.message || "Upload failed. Check server logs." });
    }
}
