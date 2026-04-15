import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Ensure cloudinary is configured. Usually configured elsewhere, but safe to re-init just in case if not global
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
    api_key: process.env.CLOUDINARY_API_KEY ,
    api_secret: process.env.CLOUDINARY_API_SECRET ,
});

export async function uploadFileGeneral(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: "error",
                message: "No file uploaded",
            });
        }

        const isRaw = req.file.originalname.match(/\.(pdf|zip|rar|tar|gz|txt|docx|doc|xls|xlsx|csv)$/i);
        
        let finalUrl = "";
        
        if (isRaw) {
            // Bypass Cloudinary completely due to "show_original_customer_untrusted" free tier lock
            // We use the persistent local storage for documents, and Cloudinary strictly for images/media
            
            // Rename file to include original extension so browsers can parse the local static URL natively
            const ext = path.extname(req.file.originalname);
            const newFilename = `${req.file.filename}${ext}`;
            const newPath = path.join(req.file.destination, newFilename);
            fs.renameSync(req.file.path, newPath);
            
            finalUrl = `http://localhost:5000/uploads/${newFilename}`;
        } else {
            // Upload images/videos to Cloudinary as normal
            const result = await cloudinary.uploader.upload(req.file.path, {
                resource_type: "auto",
                folder: "campus_study_general",
                public_id: `${Date.now()}_${req.file.originalname.replace(/\.[^.]+$/, "")}`,
            });
            finalUrl = result.secure_url;
            
            // Clean up the temp file only if we pushed to Cloudinary
            try {
                fs.unlinkSync(req.file.path);
            } catch (_) {}
        }

        return res.status(201).json({
            status: "success",
            url: finalUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
        });

    } catch (e) {
        console.error(e);
        // Clean up temp file on error
        if (req.file?.path) {
            try { fs.unlinkSync(req.file.path); } catch (_) {}
        }
        return res.status(500).json({ status: "error", message: "Internal server error during file upload" });
    }
}
