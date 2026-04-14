import mongoose from 'mongoose';

const groupChatRequestSchema = new mongoose.Schema({
    groupChatId: {
        type: String,
        required: true
    },
    requester_id: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    }
}, { timestamps: true });

const GroupChatRequest = mongoose.model('GroupChatRequest', groupChatRequestSchema);

export default GroupChatRequest;
