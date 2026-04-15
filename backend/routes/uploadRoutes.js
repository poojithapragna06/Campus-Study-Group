import express from 'express';
import { identify } from '../middleware/identify.js';
import { uploadFileGeneral } from '../controller/uploadController.js';
import multer from 'multer';

// Multer — memory storage so we can pipe directly to Cloudinary (no temp files on disk)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (_req, file, cb) => {
        const allowed = /\.(jpg|jpeg|txt|pdf)$/i;
        if (!allowed.test(file.originalname)) {
            return cb(new Error('Only .jpg, .txt and .pdf files are allowed'));
        }
        cb(null, true);
    },
});

const router = express.Router();
router.use(identify);
router.post('/', upload.single('file'), uploadFileGeneral);

// Multer error handler
router.use((err, _req, res, _next) => {
    return res.status(400).json({ status: 'error', message: err.message });
});

export default router;
