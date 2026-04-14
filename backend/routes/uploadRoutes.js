import express from 'express';
import { identify } from '../middleware/identify.js';
import { uploadFileGeneral } from '../controller/uploadController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config — store temp files in backend/uploads/
const upload = multer({
    dest: path.join(__dirname, '..', 'uploads'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit as per standard rules
});

const router = express.Router();

router.use(identify);

router.post('/', upload.single('file'), uploadFileGeneral);

export default router;
