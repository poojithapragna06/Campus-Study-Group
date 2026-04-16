import { PrivateChat } from "../models/privateChat.js";
import { sql } from "../dbUtils/sql_utl/sql_connector.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// ── Configure Cloudinary ─────────────────────────────────────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME  ,
    api_key: process.env.CLOUDINARY_API_KEY ,
    api_secret: process.env.CLOUDINARY_API_SECRET, 
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

// Helper: generate deterministic chat_id for two users
function getChatId(userId1, userId2) {
    const a = String(userId1);
    const b = String(userId2);
    return a < b ? `${a}_${b}` : `${b}_${a}`;
}

// ── GET /api/friends/private-chat?friendId=xxx ────────────────────────────────
// Fetch the full private chat between current user and a friend
export async function getPrivateChat(req, res) {
    try {
        const userId = req.user.userID;
        const friendId = req.query.friendId;

        if (!friendId) {
            return res.status(400).json({
                status: "error",
                message: "friendId query param is required",
            });
        }

        const chatId = getChatId(userId, friendId);

        let chat = await PrivateChat.findOne({ chat_id: chatId });

        if (!chat) {
            // No chat yet — return empty messages
            return res.status(200).json({
                status: "success",
                chat_id: chatId,
                messages: [],
            });
        }

        return res.status(200).json({
            status: "success",
            chat_id: chatId,
            messages: chat.messages,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
}

// ── POST /api/friends/send-message ────────────────────────────────────────────
// Send a text message in a private chat
// Body: { friendId, content }
export async function sendPrivateMessage(req, res) {
    try {
        const userId = String(req.user.userID);
        const { friendId, content } = req.body;

        if (!friendId || !content) {
            return res.status(400).json({
                status: "error",
                message: "friendId and content are required",
            });
        }

        const chatId = getChatId(userId, friendId);

        let chat = await PrivateChat.findOne({ chat_id: chatId });
        if (!chat) {
            chat = new PrivateChat({ chat_id: chatId, messages: [] });
        }

        const message = {
            sender_id: userId,
            content: content,
            fetchables: [],
            timestamp: new Date(),
        };

        chat.messages.push(message);
        await chat.save();

        // Return the pushed message (last element)
        const saved = chat.messages[chat.messages.length - 1];

        return res.status(201).json({
            status: "success",
            message: saved,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
}

// ── POST /api/friends/upload-file ─────────────────────────────────────────────
// Upload a file to Cloudinary, then store it as a file message in private chat
// Form data: friendId, file (multipart)
export async function uploadFileMessage(req, res) {
    try {
        const userId = String(req.user.userID);
        const friendId = req.body.friendId;

        if (!friendId) {
            return res.status(400).json({
                status: "error",
                message: "friendId is required",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                status: "error",
                message: "No file uploaded",
            });
        }

        // Upload to Cloudinary via stream (no temp files on disk)
        const result = await uploadStream(req.file.buffer, {
            resource_type: "auto",
            folder: "campus_study_chat",
            // Preserve extension for browser identification
            public_id: `${Date.now()}_${req.file.originalname.replace(/[^a-z0-9.]/gi, '_')}`,
        });

        const finalUrl = result.secure_url;

        const chatId = getChatId(userId, friendId);

        let chat = await PrivateChat.findOne({ chat_id: chatId });
        if (!chat) {
            chat = new PrivateChat({ chat_id: chatId, messages: [] });
        }

        const message = {
            sender_id: userId,
            content: `[FILE] ${req.file.originalname}`,
            fetchables: [finalUrl],
            timestamp: new Date(),
        };

        chat.messages.push(message);
        await chat.save();

        const saved = chat.messages[chat.messages.length - 1];

        return res.status(201).json({
            status: "success",
            message: saved,
            fileUrl: finalUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
}
