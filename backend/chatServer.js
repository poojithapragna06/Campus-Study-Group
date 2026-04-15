import http from "http"
import express from "express"
import jwtLib from "jsonwebtoken";
import { Server } from "socket.io"
//  we will use a bit of in memory store aswell... no problem
import Redis from "ioredis";
import { GroupChat } from "./models/groupChat.js";
import { sql } from "./dbUtils/sql_utl/sql_connector.js";
import { connectToDatabase } from './dbUtils/mongoConnect.js';
import { PrivateChat } from "./models/privateChat.js";

function getChatId(userId1, userId2) {
    const a = String(userId1);
    const b = String(userId2);
    return a < b ? `${a}_${b}` : `${b}_${a}`;
}

await connectToDatabase();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

const redis = new Redis(
    {
        host: "127.0.0.1",
        port: 6379
    }
);

redis.on("error", (err) => {
    console.error("Redis connection error:", err.message);
});

redis.on("connect", () => {
    console.log("Connected to Redis successfully");
});

async function pushToredis(groupChatId, message) {
    await redis.rpush(groupChatId, JSON.stringify(message));
}
io.on("connection", async (socket) => {
    console.log("new socket connected : ", socket.id);
    socket.on("join-group-chat", async ({ groupChatId }) => {
        socket.join(groupChatId);

        const raw = await redis.lrange(groupChatId, 0, -1);
        let history;

        if (raw.length > 0) {
            history = raw.map(r => JSON.parse(r));
        } else {
            const group = await GroupChat.findById(groupChatId);
            if (!group) return;

            history = group.messages;

            for (const message of history) {
                await pushToredis(groupChatId, message);
            }
        }

        socket.emit("chat-history", history);
    });


    // utility function to generate UUID 
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    socket.on("send-message", async ({ groupChatId, message }) => {
        if (!groupChatId || !message) return;
        message.message_id = generateUUID();
        // collision possibility tends to 0.
        socket.to(groupChatId).emit("receive-message", message);

        await redis.rpush(groupChatId, JSON.stringify(message));

        const group = await GroupChat.findById(groupChatId);
        if (!group) return;
        // please dont try to optimise this ... we are not going to run this in prod ...
        // we will atmost handle a loadd of 2 users with 10 or more chats...so no problem if it fails please keep this intact 
        // and please see the message structure in the group chat model for corrrect frontend call
        group.messages.push(message);
        await group.save();
    });

    // ── PRIVATE CHAT EVENTS ────────────────────────────────────────────────
    socket.on("join-private-chat", async ({ friendId, jwt: token }) => {
        try {
            const decoded = jwtLib.verify(token, process.env.JWT_SECRET || 'MOKSHU_SECRET');
            const userId = decoded.Uid;
            const chatId = getChatId(userId, friendId);
            socket.join(chatId);

            console.log(`User ${userId} joined private chat ${chatId}`);

            // Fetch history from Redis or Mongo
            const raw = await redis.lrange(chatId, 0, -1);
            let history;
            if (raw.length > 0) {
                history = raw.map(r => JSON.parse(r));
            } else {
                let chat = await PrivateChat.findOne({ chat_id: chatId });
                if (!chat) {
                    chat = new PrivateChat({ chat_id: chatId, messages: [] });
                    await chat.save();
                }
                history = chat.messages;
                for (const msg of history) {
                    await redis.rpush(chatId, JSON.stringify(msg));
                }
            }
            socket.emit("private-chat-history", history);
        } catch (err) {
            socket.emit("error", { error: "Failed to join private chat" });
        }
    });

    socket.on("send-private-message", async ({ friendId, message, jwt: token }) => {
        try {
            const decoded = jwtLib.verify(token, process.env.JWT_SECRET || 'MOKSHU_SECRET');
            const userId = decoded.Uid;
            const chatId = getChatId(userId, friendId);

            message.message_id = generateUUID();
            message.sender_id = userId; // Ensure sender_id is set correctly from token

            // Emit to the other user in the room
            socket.to(chatId).emit("receive-private-message", message);

            // Persist to Redis
            await redis.rpush(chatId, JSON.stringify(message));

            // Persist to Mongo
            const chat = await PrivateChat.findOne({ chat_id: chatId });
            if (chat) {
                chat.messages.push(message);
                await chat.save();
            }
        } catch (err) {
            console.error(err);
        }
    });

    socket.on("delete-post", async ({ groupChatId, jwt: token, postId }) => {
        try {
            const decoded = jwtLib.verify(token, process.env.JWT_SECRET || 'MOKSHU_SECRET');
            const userId = decoded.Uid;

            const users = await sql`SELECT * FROM users WHERE userID = ${userId}`;
            if (users.length === 0) {
                return socket.emit("error", { error: "Invalid user" });
            }
            if (!groupChatId || !postId) {
                return socket.emit("error", { error: "Missing groupChatId or postId" });
            }
            const group = await GroupChat.findById(groupChatId);
            if (!group) {
                return socket.emit("error", { error: "Group not found" });
            }

            if (!group.group_admins?.map(String).includes(String(userId))) {
                return socket.emit("error", { error: "Only admins can delete posts" });
            }
            const newMessages = group.messages.filter(
                msg => String(msg.message_id) !== String(postId)
            );

            group.messages = newMessages;

            await group.save();

            await redis.del(groupChatId);
            if (newMessages.length > 0) {
                await redis.rpush(
                    groupChatId,
                    ...newMessages.map(m => JSON.stringify(m))
                );
            }

            socket.to(groupChatId).emit("deleted-post", {
                postId,
                groupChatId
            });
            socket.emit("delete-post-success", {
                postId,
                groupChatId
            });

        } catch (err) {
            console.error(err);
            socket.emit("error", { error: "Invalid token or server error" });
        }
    });

    socket.on("disconnect", () => {
        console.log("socket disconnected : ", socket.id);
    });
})

server.listen(5002, () => {
    console.log("Chat server up and running on port : 5002");
})
