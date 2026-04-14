import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    groupId: { type: String, required: true },       // MongoDB GroupChat _id
    groupName: { type: String, required: false },
    createdBy: { type: String, required: true },      // userId
    date: { type: String, required: true },            // "2026-04-20"
    time: { type: String, required: true },            // "14:00"
    duration: { type: Number, required: true, default: 60 }, // minutes
    location: { type: String, default: "" },
    isOnline: { type: Boolean, default: false },
    description: { type: String, default: "" },
    attendees: [{ type: String }],                     // array of userIds
    maxAttendees: { type: Number, default: 20 },
    createdAt: { type: Date, default: Date.now },
});

export const StudySession = mongoose.model("StudySession", studySessionSchema);
