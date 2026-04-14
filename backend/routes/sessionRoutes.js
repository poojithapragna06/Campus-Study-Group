import express from "express";
import { identify } from "../middleware/identify.js";
import {
    getMySessions,
    createSession,
    rsvpSession,
    deleteSession,
} from "../controller/sessionController.js";

const router = express.Router();

router.use(identify);

router.get("/my", getMySessions);
router.post("/create", createSession);
router.post("/rsvp", rsvpSession);
router.post("/delete", deleteSession);

export default router;
