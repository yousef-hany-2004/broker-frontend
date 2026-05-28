// src/components/chat/ChatPanel.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Loader2, Trash2, MessageCircle } from "lucide-react";
import {
  getMessages,
  sendMessage,
  markConversationAsRead,
  deleteMessage,
  getConversationPresence,
} from "../../services/chatService";
import {
  onNewMessage,
  offNewMessage,
  onTypingIndicator,
  offTypingIndicator,
  sendTypingIndicator,
} from "../../services/signalRNotificationService";
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

const formatLastSeen = (dateStr) => {
  if (!dateStr) return "a while ago";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const normalizeChatMessage = (messageData, original = {}, currentUserId = null) => {
  let normalized = messageData;
  if (!normalized) return null;
  if (typeof normalized !== "object") return null;

  if (normalized.data && typeof normalized.data === "object") {
    normalized = normalized.data;
  }
  if (normalized.message && typeof normalized.message === "object") {
    normalized = normalized.message;
  }

  const senderId = normalized.senderId ?? original.senderId;

  return {
    id: normalized.id ?? original.id,
    content: normalized.content ?? normalized.message ?? original.content,
    sentAt: normalized.sentAt ?? normalized.createdAt ?? original.sentAt ?? new Date().toISOString(),
    senderId,
    senderName: normalized.senderName ?? original.senderName,
    ...normalized,
    isOwn: currentUserId
      ? String(senderId) === String(currentUserId)
      : false,
  };
};

const groupByDate = (messages) => {
  const groups = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const dateKey = msg.sentAt ?? msg.createdAt;
    const day = new Date(dateKey).toDateString();
    if (day !== lastDate) {
      groups.push({ type: "divider", label: formatDateDivider(dateKey), key: `d-${dateKey}` });
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
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [presence, setPresence] = useState(null); // { isOnline, lastSeenAt }
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // ── Download messages ─────────────────────────────────────────────
  useEffect(() => {
    if (!trip) return;

    let active = true;
    setLoading(true);
    setMessages([]);
    setError(null);

    const load = async () => {
      try {
        const res = await getMessages(trip.bookingId, {
          PageNumber: 1,
          PageSize: 50,
        });
        if (!active) return;

        if (res.succeeded) {
          const currentUserId = user?.id ?? user?.userId ?? user?.sub;
          const sorted = [...(res.data ?? [])].sort(
            (a, b) => new Date(a.sentAt) - new Date(b.sentAt)
          );
          setMessages(sorted.map((msg) => normalizeChatMessage(msg, {}, currentUserId)));
        }

        await markConversationAsRead(trip.bookingId);
        if (active) onUnreadCleared?.(trip.bookingId);
      } catch (err) {
        if (active) {
          setError(
            err?.response?.status === 401
              ? "You are not authorized to view this conversation."
              : "Unable to load chat. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.bookingId]);

  // ── Bring the user's status (Online/Offline/Last seen) ─────────────
  useEffect(() => {
    if (!trip?.bookingId) return;

    const fetchPresence = async () => {
      try {
        const res = await getConversationPresence(trip.bookingId);
        if (res.succeeded) setPresence(res.data);
      } catch {
        // silently fail
      }
    };

    fetchPresence();
    // Update every 30 seconds
    const interval = setInterval(fetchPresence, 30000);
    return () => clearInterval(interval);
  }, [trip?.bookingId]);

  // ── SignalR - real-time ────────────────────
  useEffect(() => {
    if (!trip?.bookingId) return;

    const handleNewMessage = (message) => {
      // Ignore the messages that are not part of this conversation
      if (message.bookingId !== trip.bookingId) return;

      const currentUserId = user?.id ?? user?.userId ?? user?.sub;
      const normalized = normalizeChatMessage(message, {}, currentUserId);
      if (!normalized) return;

      setMessages((prev) => {
        // Completely prevent duplication if the message already exists
        if (prev.find((m) => m.id === normalized.id)) return prev;
        return [...prev, normalized];
      });
      scrollToBottom();

      // teach it to be read automatically if the user is currently viewing the conversation
      markConversationAsRead(trip.bookingId).catch(() => {});
    };

    onNewMessage(handleNewMessage);
    return () => offNewMessage(handleNewMessage);
  }, [trip?.bookingId, user, scrollToBottom]);

  // ── SignalR — Typing indicator ──────────────────────────────────
  useEffect(() => {
    if (!trip?.bookingId) return;

    const handleTyping = ({ bookingId, userId }) => {
      if (bookingId !== trip.bookingId) return;

      const currentUserId = user?.id ?? user?.userId ?? user?.sub;
      
      if (String(userId) === String(currentUserId)) return;

      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
    };

    onTypingIndicator(handleTyping);
    return () => {
      offTypingIndicator(handleTyping);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [trip?.bookingId, user]);

  // ── Scroll when loading messages───────────────────────────────────
  useEffect(() => {
    if (!loading) {
      scrollToBottom("auto");
      inputRef.current?.focus();
    }
  }, [loading, scrollToBottom]);
// ── Scroll when loading messages───────────────────────────────────
useEffect(() => {
  if (!loading) {
    scrollToBottom("auto");
    inputRef.current?.focus();
  }
}, [loading, scrollToBottom]);

// ── Polling Every 10 seconds──────────────────────────────────────────
useEffect(() => {
  if (!trip?.bookingId) return;

  let intervalId = null;

  const poll = async () => {
    try {
      const res = await getMessages(trip.bookingId, {
        PageNumber: 1,
        PageSize: 50,
      });
      if (res.succeeded) {
        const currentUserId = user?.id ?? user?.userId ?? user?.sub;
        const sorted = [...(res.data ?? [])].sort(
          (a, b) => new Date(a.sentAt) - new Date(b.sentAt)
        );
        const normalized = sorted.map((msg) =>
          normalizeChatMessage(msg, {}, currentUserId)
        );
        setMessages((prev) => {
  const prevIds = new Set(prev.filter((m) => !m._temp).map((m) => m.id));
  const hasNew = normalized.some((m) => !prevIds.has(m.id));
  if (hasNew) {
    return [
      ...normalized,
      ...prev.filter((m) => m._temp),
    ];
  }
  return prev;
});
      }
    } catch {
      // silently fail
    }
  };

  const timeoutId = setTimeout(() => {
    intervalId = setInterval(poll, 3000);
  }, 3000);

  return () => {
    clearTimeout(timeoutId);
    if (intervalId) clearInterval(intervalId);
  };
}, [trip?.bookingId, user]);

  // ── Send message ────────────────────────────────────────────────
  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText("");
    setSending(true);

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
      const rawMessage = res?.data ?? res;
      const currentUserId = user?.id ?? user?.userId ?? user?.sub;
      const normalizedMessage = normalizeChatMessage(rawMessage, tempMsg, currentUserId);

      if (normalizedMessage) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? normalizedMessage : m))
        );
      } else {
      // API succeeded but didn't return data → consider the message sent 
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? { ...m, _temp: false } : m))
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setText(content);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  // ── Delete message ──────────────────────────────────────────────────
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

  const handleTextChange = (e) => {
    setText(e.target.value);
    // Send typing indicator to the other party
    sendTypingIndicator(trip.bookingId);
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
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[360px] flex flex-col bg-[#111] border-l border-white/10 shadow-2xl animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8 bg-[#0d0d0d]">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[3px] uppercase text-[var(--gold)] mb-1">
              Chat
            </p>
            <h3
              className="text-white text-lg font-semibold truncate"
              style={{ fontFamily: "Cormorant Garamond, serif" }}
            >
              {trip.propertyTitle}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {presence ? (
                presence.isOnline ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                    <span className="text-green-400 text-[11px]">Online</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white/20 shrink-0" />
                    <span className="text-white/35 text-[11px]">
                      Last seen {formatLastSeen(presence.lastSeenAt)}
                    </span>
                  </>
                )
              ) : (
                <span className="text-white/20 text-[11px]">{trip.city}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-xs tracking-widest uppercase">Loading messages</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/25 px-4 text-center">
              <p className="text-sm font-semibold">{error}</p>
              <p className="text-xs text-white/40">Close the chat and try again.</p>
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
                  <div key={item.key} className="flex items-center gap-3 py-3">
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
                  className={`flex group ${isOwn ? "justify-end" : "justify-start"} mb-2`}
                >
                  <div className={`flex flex-col max-w-[85%] ${isOwn ? "items-end" : "items-start"}`}>
                    {!isOwn && (
                      <span className="text-[10px] text-white/30 mb-1 ml-1">
                        {item.senderName}
                      </span>
                    )}
                    <div className="flex items-end gap-2">
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
                        className={`px-4 py-3 rounded-[28px] text-sm leading-relaxed ${
                          isOwn
                            ? "bg-[var(--gold)] text-[#0d0d0d] rounded-br-[6px] font-medium shadow-md shadow-[rgba(255,208,85,0.15)]"
                            : "bg-[#1e293b] text-white/90 rounded-bl-[6px] border border-white/10"
                        } ${item._temp ? "opacity-70" : ""}`}
                      >
                        {item.content ?? item.message}
                      </div>
                    </div>
                    <span className={`text-[10px] text-white/30 mt-2 ${isOwn ? "mr-1" : "ml-1"} flex items-center gap-1`}>
                      {formatTime(item.sentAt ?? item.createdAt)}
                      {isOwn && !item._temp && (
                        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                          <path d="M1 5L4.5 8.5L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5 5L8.5 8.5L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {isOwn && item._temp && (
                        <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
                          <path d="M1 5L3.5 7.5L7 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Typing Indicator */}
        {isTyping && (
          <div className="px-5 pb-2 flex items-center gap-2 text-white/30 text-xs">
            <div className="flex gap-1 items-center">
              <span
                className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="tracking-wide">typing...</span>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-4 border-t border-white/8 bg-[#0d0d0d]">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 focus-within:border-[var(--gold)]/40 transition-colors">
            <textarea
              ref={inputRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              style={{ resize: "none" }}
              className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none leading-relaxed max-h-32 overflow-y-auto"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--gold)] text-[#0d0d0d] disabled:opacity-30 hover:bg-[var(--gold-light)] transition-all duration-200 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          <p className="text-[10px] text-white/20 mt-3 text-center tracking-wide">
            Enter to send · Shift+Enter for new line
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
