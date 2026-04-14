import express from 'express';
import { identify } from '../middleware/identify.js';
import {
    acceptFriendRequest,
    getFriendRequests,
    getSentFriendRequests,
    getFriendsList,
    getMutualFriends,
    getSuggestions,
    getUsersbyUsername,
    rejectFriendRequest,
    sendFriendRequest,
    unfriend
} from '../controller/friendController.js';
import {
    getPrivateChat,
    sendPrivateMessage,
    uploadFileMessage
} from '../controller/privateChatController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config — store temp files in backend/uploads/
const upload = multer({
    dest: path.join(__dirname, '..', 'uploads'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const router = express.Router();

router.use(identify);

// ── Friend management ────────────────────────────────────────────────────────
router.get('/friendlist', getFriendsList);
router.get('/friendrequests', getFriendRequests);
router.get('/sentrequests', getSentFriendRequests);
router.get('/suggestions', getSuggestions);
router.post('/sendrequest', sendFriendRequest);
router.post('/acceptrequest', acceptFriendRequest);
router.post('/rejectrequest', rejectFriendRequest);
router.get('/getMutualfriends', getMutualFriends);
router.get('/search', getUsersbyUsername);
router.post('/unfriend', unfriend);

// ── Private chat ─────────────────────────────────────────────────────────────
router.get('/private-chat', getPrivateChat);
router.post('/send-message', sendPrivateMessage);
router.post('/upload-file', upload.single('file'), uploadFileMessage);

export default router;