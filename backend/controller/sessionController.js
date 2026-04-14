import { StudySession } from "../models/studySession.js";
import { GroupChat } from "../models/groupChat.js";

// ── GET /api/sessions/my ──────────────────────────────────────────────────────
// Fetch all sessions for groups the current user belongs to
export async function getMySessions(req, res) {
    try {
        const userId = req.user.userID;

        // Find all groups the user is a member of
        const myGroups = await GroupChat.find({ group_members: userId });
        const groupIds = myGroups.map((g) => String(g._id));

        if (groupIds.length === 0) {
            return res.status(200).json({
                status: "success",
                sessions: [],
            });
        }

        const sessions = await StudySession.find({ groupId: { $in: groupIds } }).sort({ date: 1 });

        return res.status(200).json({
            status: "success",
            sessions,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
}

// ── POST /api/sessions/create ─────────────────────────────────────────────────
// Body: { title, groupId, date, time, duration, location, isOnline, description, maxAttendees }
export async function createSession(req, res) {
    try {
        const userId = req.user.userID;
        const { title, groupId, date, time, duration, location, isOnline, description, maxAttendees } = req.body;

        if (!title || !groupId || !date || !time) {
            return res.status(400).json({
                status: "error",
                message: "title, groupId, date, and time are required",
            });
        }

        // Verify user is a member of this group
        const group = await GroupChat.findById(groupId);
        if (!group) {
            return res.status(404).json({ status: "error", message: "Group not found" });
        }

        if (!group.group_members.includes(String(userId))) {
            return res.status(403).json({ status: "error", message: "You are not a member of this group" });
        }

        const session = new StudySession({
            title,
            groupId,
            groupName: group.group_name || "",
            createdBy: userId,
            date,
            time,
            duration: duration || 60,
            location: location || "",
            isOnline: isOnline || false,
            description: description || "",
            attendees: [userId], // creator auto-RSVPs
            maxAttendees: maxAttendees || 20,
        });

        await session.save();

        return res.status(201).json({
            status: "success",
            session,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
}

// ── POST /api/sessions/rsvp ──────────────────────────────────────────────────
// Body: { sessionId }
export async function rsvpSession(req, res) {
    try {
        const userId = String(req.user.userID);
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ status: "error", message: "sessionId is required" });
        }

        const session = await StudySession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ status: "error", message: "Session not found" });
        }

        // Toggle RSVP
        const idx = session.attendees.indexOf(userId);
        if (idx >= 0) {
            session.attendees.splice(idx, 1);
        } else {
            if (session.attendees.length >= session.maxAttendees) {
                return res.status(400).json({ status: "error", message: "Session is full" });
            }
            session.attendees.push(userId);
        }

        await session.save();

        return res.status(200).json({
            status: "success",
            session,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
}

// ── DELETE /api/sessions/delete ───────────────────────────────────────────────
// Body: { sessionId }
export async function deleteSession(req, res) {
    try {
        const userId = String(req.user.userID);
        const { sessionId } = req.body;

        const session = await StudySession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ status: "error", message: "Session not found" });
        }

        if (session.createdBy !== userId) {
            return res.status(403).json({ status: "error", message: "Only the creator can delete this session" });
        }

        await StudySession.findByIdAndDelete(sessionId);

        return res.status(200).json({ status: "success", message: "Session deleted" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
}
