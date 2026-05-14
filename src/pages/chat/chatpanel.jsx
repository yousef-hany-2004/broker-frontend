// src/components/chat/ChatPanel.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Loader2, Trash2, MessageCircle } from "lucide-react";
import {
  getMessages,
  sendMessage,
  markConversationAsRead,
  deleteMessage,
} from "../../services/chatService";
import useAuth from "../../hooks/useAuth";

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateDivider = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Group messages by date
const groupByDate = (messages) => {
  const groups = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const day = new Date(msg.sentAt).toDateString();
    if (day !== lastDate) {
      groups.push({ type: "divider", label: formatDateDivider(msg.sentAt), key: `d-${msg.sentAt}` });
      lastDate = day;
    }
    groups.push({ type: "message", ...msg });
  });
  return groups;
};

export default function ChatPanel({ trip, onClose, onUnreadCleared }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Fetch messages & mark as read
  useEffect(() => {
    if (!trip) return;
    setLoading(true);
    setMessages([]);

    const load = async () => {
      try {
        const res = await getMessages(trip.bookingId, {
          PageNumber: 1,
          PageSize: 50,
        });
        if (res.succeeded) {
          // API may return oldest-first or newest-first — normalise to oldest-first
          const sorted = [...(res.data ?? [])].sort(
            (a, b) => new Date(a.sentAt) - new Date(b.sentAt)
          );
          setMessages(sorted);
        }
        // Mark as read silently
        await markConversationAsRead(trip.bookingId);
        onUnreadCleared?.(trip.bookingId);
      } catch {
        // silently fail — chat panel still shows empty state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [trip?.bookingId]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (!loading) {
      scrollToBottom("auto");
      inputRef.current?.focus();
    }
  }, [loading]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText("");
    setSending(true);

    // Optimistic update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content,
      sentAt: new Date().toISOString(),
      senderId: user?.id,
      senderName: user?.firstName ?? "You",
      isOwn: true,
      _temp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    scrollToBottom();

    try {
      const res = await sendMessage(trip.bookingId, content);
      if (res.succeeded && res.data) {
        // Replace temp with real message
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? { ...res.data, isOwn: true } : m))
        );
      }
    } catch {
      // Remove temp message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setText(content); // restore text
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const handleDelete = async (msgId) => {
    setDeletingId(msgId);
    try {
      await deleteMessage(trip.bookingId, msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const grouped = groupByDate(messages);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-[#111] border-l border-white/10 shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 bg-[#0d0d0d]">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[3px] uppercase text-[var(--gold)] mb-0.5">
              Chat
            </p>
            <h3
              className="text-white text-base font-semibold truncate"
              style={{ fontFamily: "Cormorant Garamond, serif" }}
            >
              {trip.propertyTitle}
            </h3>
            <p className="text-white/40 text-xs">{trip.city}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-xs tracking-widest uppercase">Loading messages</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/25">
              <MessageCircle size={36} strokeWidth={1} />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Send the first message to the landlord</p>
            </div>
          ) : (
            grouped.map((item) => {
              if (item.type === "divider") {
                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-[10px] tracking-[2px] uppercase text-white/25">
                      {item.label}
                    </span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>
                );
              }

              const isOwn = item.isOwn;
              return (
                <div
                  key={item.id}
                  className={`flex group ${isOwn ? "justify-end" : "justify-start"} mb-1`}
                >
                  <div className={`flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                    {!isOwn && (
                      <span className="text-[10px] text-white/30 mb-1 ml-1">
                        {item.senderName}
                      </span>
                    )}
                    <div className="flex items-end gap-1.5">
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id || item._temp}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white/25 hover:text-red-400 disabled:opacity-20 p-0.5"
                        >
                          {deletingId === item.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Trash2 size={11} />
                          )}
                        </button>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isOwn
                            ? "bg-[var(--gold)] text-[#0d0d0d] rounded-br-sm font-medium"
                            : "bg-white/8 text-white/80 rounded-bl-sm"
                        } ${item._temp ? "opacity-60" : ""}`}
                      >
                        {item.content}
                      </div>
                    </div>
                    <span className="text-[10px] text-white/25 mt-1 mx-1">
                      {formatTime(item.sentAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-white/8 bg-[#0d0d0d]">
          <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus-within:border-[var(--gold)]/40 transition-colors">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              style={{ resize: "none" }}
              className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none leading-relaxed max-h-32 overflow-y-auto"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gold)] text-[#0d0d0d] disabled:opacity-30 hover:bg-[var(--gold-light)] transition-all duration-200 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
          <p className="text-[10px] text-white/20 mt-2 text-center tracking-wide">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </>
  );
}
