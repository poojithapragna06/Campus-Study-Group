import 'dotenv/config';
import {pool} from "./dbUtils/sql_utl/db.js"
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
import { connectToDatabase } from './dbUtils/mongoConnect.js';
 const corsOptions = {
     origin: "http://localhost:3000",
     credentials: true
 }
 
 import cookieParser from "cookie-parser";
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());

// Serve static uploads
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

await connectToDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/upload', uploadRoutes);

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});