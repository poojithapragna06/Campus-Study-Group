import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002");

const ChatPage = ({ userId }) => {
  const { id: groupChatId } = useParams();

  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);

  const bottomRef = useRef();

  // Join group and listen for messages
  useEffect(() => {
    socket.emit("join-group-chat", { groupChatId });

    socket.on("chat-history", (history) => {
      setMessages(history);
    });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chat-history");
      socket.off("receive-message");
    };
  }, [groupChatId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message handler
  const handleSend = async () => {
    if (!content && files.length === 0) return;

    const fetchables = [];
    for (const file of files) {
      const base64 = await toBase64(file);
      fetchables.push(base64);
    }

    const message = {
      sender_id: userId,
      content,
      fetchables,
      timestamp: new Date().toISOString(),
    };

    socket.emit("send-message", { groupChatId, message });

    // Optimistic UI update
    setMessages((prev) => [...prev, message]);
    setContent("");
    setFiles([]);
  };

  return (
    <div className="chat-page bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="chat-container container mx-auto space-y-6">

        {/* Header */}
        <div className="chat-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="chat-title text-2xl sm:text-3xl font-bold tracking-tight">
            Group Chat
          </h2>
          <Link to="/" className="btn btn-outline btn-sm">
            Back to Groups
          </Link>
        </div>

        {/* Chat window */}
        <div className="chat-window bg-white rounded-lg shadow flex flex-col h-[70vh]">
          
          {/* Messages list */}
          <div className="messages-list flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={msg.message_id || idx}
                className={`message-row flex items-end ${
                  msg.sender_id === userId ? "justify-end" : "justify-start"
                }`}
              >
                {/* Avatar for other users */}
                {msg.sender_id !== userId && (
                  <div className="message-avatar w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center mr-2 text-white font-bold">
                    {msg.sender_id?.[0]?.toUpperCase()}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`message-bubble max-w-xs px-3 py-2 rounded-lg shadow-md transition hover:shadow-lg ${
                    msg.sender_id === userId
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  {/* Text content */}
                  {msg.content && <p>{msg.content}</p>}

                  {/* File previews */}
                  {msg.fetchables?.length > 0 && (
                    <div className="message-files mt-2 grid grid-cols-2 gap-2">
                      {msg.fetchables.map((file, i) => (
                        <img
                          key={i}
                          src={file}
                          alt="upload"
                          className="file-preview rounded border hover:scale-105 transition-transform"
                        />
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="message-time text-[10px] opacity-70 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="chat-input p-4 border-t flex gap-2 items-center bg-gray-50">
            <input
              type="text"
              className="message-text input input-bordered flex-1 rounded-full"
              placeholder="Type a message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <label className="attach-button btn btn-ghost btn-circle">
              📎
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setFiles([...e.target.files])}
              />
            </label>

            <button className="send-button btn btn-primary btn-circle" onClick={handleSend}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

// Helper function
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}
// import { useEffect, useRef, useState } from "react";
// import { useParams } from "react-router-dom";
// import { io } from "socket.io-client";

// const socket = io("http://localhost:5002");

// const ChatPage = ({ userId }) => {
//   const { id: groupChatId } = useParams();

//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [files, setFiles] = useState([]);

//   const bottomRef = useRef();

//   // 🔥 JOIN + LISTEN
//   useEffect(() => {
//     socket.emit("join-group-chat", { groupChatId });

//     socket.on("chat-history", (history) => {
//       setMessages(history);
//     });

//     socket.on("receive-message", (msg) => {
//       setMessages((prev) => [...prev, msg]);
//     });

//     return () => {
//       socket.off("chat-history");
//       socket.off("receive-message");
//     };
//   }, [groupChatId]);

//   // 🔥 AUTO SCROLL
//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // 🔥 SEND MESSAGE
//   const handleSend = async () => {
//     if (!content && files.length === 0) return;

//     const fetchables = [];

//     for (const file of files) {
//       const base64 = await toBase64(file);
//       fetchables.push(base64);
//     }

//     const message = {
//       sender_id: userId,
//       content,
//       fetchables,
//       timestamp: new Date().toISOString()
//     };

//     socket.emit("send-message", {
//       groupChatId,
//       message
//     });

//     // optimistic UI
//     setMessages((prev) => [...prev, message]);

//     setContent("");
//     setFiles([]);
//   };

//   return (
//     <div className="flex flex-col h-full">

//       {/* MESSAGES */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-3">
//         {messages.map((msg, idx) => (
//           <div
//             key={msg.message_id || idx}
//             className={`chat ${
//               msg.sender_id === userId ? "chat-end" : "chat-start"
//             }`}
//           >
//             <div className="chat-bubble">

//               {/* TEXT */}
//               {msg.content && <p>{msg.content}</p>}

//               {/* FILES */}
//               {msg.fetchables?.length > 0 && (
//                 <div className="mt-2 space-y-2">
//                   {msg.fetchables.map((file, i) => (
//                     <img
//                       key={i}
//                       src={file}
//                       alt="upload"
//                       className="max-w-xs rounded"
//                     />
//                   ))}
//                 </div>
//               )}

//               {/* TIME */}
//               <div className="text-[10px] opacity-60 mt-1">
//                 {new Date(msg.timestamp).toLocaleTimeString()}
//               </div>

//             </div>
//           </div>
//         ))}
//         <div ref={bottomRef} />
//       </div>

//       {/* INPUT */}
//       <div className="p-4 border-t flex gap-2">

//         <input
//           type="text"
//           className="input input-bordered flex-1"
//           placeholder="Type message..."
//           value={content}
//           onChange={(e) => setContent(e.target.value)}
//         />

//         <input
//           type="file"
//           multiple
//           onChange={(e) => setFiles([...e.target.files])}
//         />

//         <button className="btn btn-primary" onClick={handleSend}>
//           Send
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ChatPage;


// // 🔧 helper
// function toBase64(file) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = () => resolve(reader.result);
//     reader.onerror = reject;
//   });
// }



// import React, { useEffect, useRef, useState } from "react";
// import { useParams } from "react-router-dom";
// import { io } from "socket.io-client";

// export default function ChatPage({ userId }) {
//   const { id: friendId } = useParams();
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const roomIdRef = useRef("");
//   const socketRef = useRef(null);
//   const endRef = useRef(null);

//   const getRoomId = (a, b) => [a, b].sort().join("-");

//   useEffect(() => {
//     const roomId = getRoomId(userId, friendId);
//     roomIdRef.current = roomId;

//     const socket = io("http://localhost:5002");
//     socketRef.current = socket;
//     socket.emit("join-chat", { roomId });

//     socket.on("chat-history", (history) => setMessages(history));
//     socket.on("receive-message", (msg) => setMessages((prev) => [...prev, msg]));

//     return () => socket.disconnect();
//   }, [userId, friendId]);

//   useEffect(() => {
//     endRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const sendMessage = () => {
//     if (!input.trim()) return;
//     const msg = {
//       senderId: userId,
//       receiverId: friendId,
//       text: input,
//       timestamp: new Date().toISOString(),
//     };
//     setMessages((prev) => [...prev, msg]);
//     socketRef.current.emit("send-message", { roomId: roomIdRef.current, message: msg });
//     setInput("");
//   };

//   return (
//     <div className="flex flex-col h-screen">
//       {/* chat history */}
//       <div className="flex-1 bg-gray-100 p-4 overflow-y-auto space-y-2">
//         {messages.map((msg, idx) => (
//           <div
//             key={idx}
//             className={`flex flex-col ${
//               msg.senderId === userId ? "items-end" : "items-start"
//             }`}
//           >
//             <div
//               className={`p-2 rounded max-w-xs whitespace-pre-wrap ${
//                 msg.senderId === userId ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
//               }`}
//             >
//               <div>{msg.text}</div>
//               <div className="text-xs text-right opacity-60 mt-1">
//                 {new Date(msg.timestamp).toLocaleTimeString()}
//               </div>
//             </div>
//           </div>
//         ))}
//         <div ref={endRef} />
//       </div>

//       {/* input bar */}
//       <div className="p-4 bg-gray-800 flex">
//         <input
//           type="text"
//           placeholder="Type a message…"
//           className="input input-bordered flex-1 mr-2"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//         />
//         <button className="btn btn-primary" onClick={sendMessage}>
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }
