import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002");

// ── OPEN FILE HELPER ───────────────────────────────────────────────────────
const openFile = (src) => {
  if (src.startsWith("http")) {
    window.open(src, "_blank", "noreferrer");
    return;
  }
  const [meta, data] = src.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "application/octet-stream";
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: mime });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank", "noreferrer");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
};

// ── TO BASE64 HELPER ───────────────────────────────────────────────────────
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

// ── MESSAGE BUBBLE ─────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isOwn }) => {
  return (
    <div className={`message-row flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
      {/* Avatar for others */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-medium mr-2 shrink-0 self-end">
          {msg.sender_id?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}

      <div
        className={`
          max-w-[75%] px-4 py-2 rounded-2xl shadow-md transition
          hover:shadow-lg hover:scale-[1.01] duration-200 ease-in-out
          ${isOwn
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-200 text-black rounded-bl-none"}
        `}
      >
        {/* TEXT */}
        {msg.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {msg.content}
          </p>
        )}

        {/* FILES */}
        {msg.fetchables?.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {msg.fetchables.map((file, i) => {
              const src = typeof file === "string" ? file : file.url;
              const type =
                typeof file === "string"
                  ? file.startsWith("data:image")
                    ? "image"
                    : file.startsWith("data:video")
                    ? "video"
                    : "other"
                  : file.type;

              if (type === "image") {
                return (
                  <img
                    key={i}
                    src={src}
                    alt="attachment"
                    className="rounded-lg max-h-60 object-cover border hover:opacity-90 transition"
                  />
                );
              }

              if (type === "video") {
                return (
                  <video
                    key={i}
                    controls
                    className="rounded-lg max-h-60 border hover:opacity-90 transition"
                  >
                    <source src={src} />
                  </video>
                );
              }

              return (
                <button
                  key={i}
                  onClick={() => openFile(src)}
                  className="block text-sm underline opacity-80 hover:opacity-100 text-left"
                >
                  📎 Open file
                </button>
              );
            })}
          </div>
        )}

        {/* TIME */}
        <div className="text-[10px] opacity-60 mt-1 text-right">
          {new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};

// ── MAIN PAGE ──────────────────────────────────────────────────────────────
const GroupChatPage = ({ userId }) => {
  const { id: groupChatId } = useParams();

  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchCursor, setSearchCursor] = useState(0);

  // Scroll-to-bottom state
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const bottomRef = useRef();
  const fileInputRef = useRef();
  const messagesContainerRef = useRef();
  const searchInputRef = useRef();
  const messageRefs = useRef({});

  // ── JOIN + LISTEN ────────────────────────────────────────────────────────
  useEffect(() => {
    socket.emit("join-group-chat", { groupChatId });

    socket.on("chat-history", (history) => {
      setMessages(history);
    });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);

      const container = messagesContainerRef.current;
      if (container) {
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceFromBottom > 120) {
          setUnreadCount((c) => c + 1);
          return;
        }
      }
    });

    return () => {
      socket.off("chat-history");
      socket.off("receive-message");
    };
  }, [groupChatId]);

  // ── AUTO SCROLL on mount ─────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ── SCROLL OBSERVER ──────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distanceFromBottom > 120);
    if (distanceFromBottom <= 120) setUnreadCount(0);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
    setShowScrollBtn(false);
  };

  // ── SEARCH ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchCursor(0);
      return;
    }
    const q = searchQuery.toLowerCase();
    const hits = messages.reduce((acc, msg, idx) => {
      if (msg.content?.toLowerCase().includes(q)) acc.push(idx);
      return acc;
    }, []);
    setSearchResults(hits);
    setSearchCursor(0);
  }, [searchQuery, messages]);

  useEffect(() => {
    if (searchResults.length === 0) return;
    const idx = searchResults[searchCursor];
    const el = messageRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchCursor, searchResults]);

  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    setSearchCursor((c) => (c + 1) % searchResults.length);
  };

  const goToPrevResult = () => {
    if (searchResults.length === 0) return;
    setSearchCursor((c) => (c - 1 + searchResults.length) % searchResults.length);
  };

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchCursor(0);
  };

  // ── SEND MESSAGE ─────────────────────────────────────────────────────────
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
    setMessages((prev) => [...prev, message]);
    setContent("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setTimeout(() => scrollToBottom(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-base-200">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-base-100 border-b border-base-300 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-medium shrink-0">
            G
          </div>
          <div>
            <h2 className="font-medium text-base leading-tight">Group Chat</h2>
            <p className="text-xs text-base-content/50">Group conversation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search toggle */}
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm text-base-content/50 hover:text-base-content"
            onClick={searchOpen ? closeSearch : openSearch}
            title="Search messages"
          >
            {searchOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </button>

          <Link to="/" className="btn btn-ghost btn-sm text-base-content/60">
            ← Back
          </Link>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-4 py-2 bg-base-100 border-b border-base-300 shrink-0">
          <div className="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="input input-bordered input-sm w-full pl-8 rounded-full text-sm"
              placeholder="Search in messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goToNextResult();
                if (e.key === "Escape") closeSearch();
              }}
            />
          </div>

          <span className="text-xs text-base-content/50 shrink-0 min-w-[52px] text-center">
            {searchResults.length === 0
              ? searchQuery ? "0 found" : ""
              : `${searchCursor + 1} / ${searchResults.length}`}
          </span>

          <button
            type="button"
            className="btn btn-ghost btn-circle btn-xs text-base-content/50 hover:text-base-content disabled:opacity-20"
            onClick={goToPrevResult}
            disabled={searchResults.length === 0}
            title="Previous result"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-xs text-base-content/50 hover:text-base-content disabled:opacity-20"
            onClick={goToNextResult}
            disabled={searchResults.length === 0}
            title="Next result"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 relative"
      >
        {messages.map((msg, idx) => {
          const isSearchHit = searchResults.includes(idx);
          const isActiveHit = searchResults[searchCursor] === idx;

          return (
            <div
              key={msg.message_id || idx}
              ref={(el) => { messageRefs.current[idx] = el; }}
              className={
                isActiveHit
                  ? "rounded-xl ring-2 ring-yellow-300 ring-offset-1 transition-all"
                  : isSearchHit
                  ? "rounded-xl ring-1 ring-yellow-200 transition-all"
                  : ""
              }
            >
              <MessageBubble
                msg={msg}
                isOwn={msg.sender_id === userId}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── SCROLL TO BOTTOM BUTTON ── */}
      {showScrollBtn && (
        <div className="absolute bottom-[80px] right-5 z-10">
          <button
            type="button"
            onClick={scrollToBottom}
            className="btn btn-circle btn-sm bg-base-100 border border-base-300 shadow-md hover:shadow-lg transition-all"
            title="Jump to latest"
          >
            {unreadCount > 0 ? (
              <span className="text-xs font-semibold text-primary">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* ── FILE PREVIEW STRIP ── */}
      {files.length > 0 && (
        <div className="flex gap-2 px-4 py-2 bg-base-100 border-t border-base-300 flex-wrap shrink-0">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1 bg-base-200 rounded-lg px-3 py-1 text-xs text-base-content/70"
            >
              <span>📎</span>
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                className="ml-1 opacity-50 hover:opacity-100 leading-none"
                onClick={() => setFiles((prev) => prev.filter((_, fi) => fi !== i))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── INPUT BAR ── */}
      <div className="flex items-center gap-2 px-4 py-3 bg-base-100 border-t border-base-300 shrink-0">
        <button
          type="button"
          className="btn btn-ghost btn-circle btn-sm text-base-content/50 hover:text-base-content"
          onClick={() => fileInputRef.current?.click()}
          title="Attach files"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => setFiles(Array.from(e.target.files))}
        />

        <input
          type="text"
          className="input input-bordered flex-1 rounded-full text-sm h-10"
          placeholder="Type a message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          type="button"
          className="btn btn-primary btn-circle btn-sm"
          onClick={handleSend}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GroupChatPage;
