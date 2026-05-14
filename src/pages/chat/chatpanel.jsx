// src/components/chat/ChatPanel.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Loader2, Trash2, MessageCircle } from "lucide-react";
import {
  getMessages,
  sendMessage,
  markConversationAsRead,
  deleteMessage,
} from "../../services/chatService";
import {
  startNotificationConnection,
  onTypingIndicator,
  offTypingIndicator,
  sendTypingIndicator,
  onNewMessage,
  offNewMessage,
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

const normalizeChatMessage = (messageData, original = {}, currentUserId) => {
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
    isOwn: currentUserId ? String(senderId) === String(currentUserId) : false,
  };
};

// Group messages by date
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
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [newMessageHighlight, setNewMessageHighlight] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Notification sound
  const playNotificationSound = useCallback(() => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Fallback: try to play system notification sound
      console.log("Audio notification played");
    }
  }, []);

  // Fetch messages & mark as read
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
          // API may return oldest-first or newest-first — normalise to oldest-first
          const sorted = [...(res.data ?? [])].sort(
            (a, b) => new Date(a.sentAt) - new Date(b.sentAt)
          );
          const currentUserId = user?.id ?? user?.userId ?? user?.sub;
          setMessages(sorted.map((msg) => normalizeChatMessage(msg, {}, currentUserId)));
        }

        // Mark as read silently
        await markConversationAsRead(trip.bookingId);
        if (active) {
          onUnreadCleared?.(trip.bookingId);
        }
      } catch (err) {
        if (active) {
          setError(
            err?.response?.status === 401
              ? "You are not authorized to view this conversation."
              : "Unable to load chat. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();

    return () => {
      active = false;
    };
  }, [trip?.bookingId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing indicator when component unmounts
      if (isTyping && trip) {
        sendTypingIndicator(trip.bookingId, false);
      }
    };
  }, [isTyping, trip]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (!loading) {
      scrollToBottom("auto");
      inputRef.current?.focus();
    }
  }, [loading, scrollToBottom]);

  // Typing indicator setup
  useEffect(() => {
    if (!trip) return;

    startNotificationConnection();

    const handleTypingIndicator = (bookingId, senderId, isTyping) => {
      if (String(bookingId) === String(trip.bookingId)) {
        const currentUserId = user?.id ?? user?.userId ?? user?.sub;
        if (String(senderId) !== String(currentUserId)) {
          setOtherUserTyping(isTyping);
        }
      }
    };

    const handleNewMessage = (bookingId, messageData) => {
      if (String(bookingId) === String(trip.bookingId)) {
        const currentUserId = user?.id ?? user?.userId ?? user?.sub;
        const newMessage = normalizeChatMessage(messageData, {}, currentUserId);

        if (newMessage && !newMessage.isOwn) {
          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some((m) => String(m.id) === String(newMessage.id));
            if (exists) return prev;

            const updated = [...prev, newMessage];
            // Sort by date
            updated.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
            return updated;
          });

          // Highlight new message
          setNewMessageHighlight(true);
          setTimeout(() => setNewMessageHighlight(false), 2000);

          scrollToBottom();

          // Play notification sound
          playNotificationSound();

          // Mark as read
          markConversationAsRead(trip.bookingId);
          onUnreadCleared?.(trip.bookingId);
        }
      }
    };

    onTypingIndicator(handleTypingIndicator);
    onNewMessage(handleNewMessage);

    return () => {
      offTypingIndicator(handleTypingIndicator);
      offNewMessage(handleNewMessage);
    };
  }, [trip?.bookingId, user]);

  // Handle typing events
  const handleInputChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (!isTyping && value.trim()) {
      setIsTyping(true);
      sendTypingIndicator(trip.bookingId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(trip.bookingId, false);
      }
    }, 2000);
  };

  // Stop typing when sending message
  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(trip.bookingId, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

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
      const rawMessage = res?.data ?? res;
      const currentUserId = user?.id ?? user?.userId ?? user?.sub;
      const normalizedMessage = normalizeChatMessage(rawMessage, tempMsg, currentUserId);

      if (normalizedMessage) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? normalizedMessage : m))
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
        setText(content);
      }
    } catch {
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
              <p className="text-white/40 text-xs">{trip.city}</p>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${otherUserTyping ? 'bg-green-400 animate-pulse' : 'bg-green-500'}`} />
                <span className={`text-[10px] ${otherUserTyping ? 'text-green-400' : 'text-green-500'}`}>
                  {otherUserTyping ? 'typing...' : 'online'}
                </span>
              </div>
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
              <p className="text-xs text-white/40">Close the chat and try again, or open a different conversation.</p>
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
              const isNewMessage = newMessageHighlight && messages.indexOf(item) === messages.length - 1 && !isOwn;
              return (
                <div
                  key={item.id}
                  className={`flex group ${isOwn ? "justify-end" : "justify-start"} mb-2 ${isNewMessage ? "animate-pulse" : ""}`}
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
                            : `bg-[#1e293b] text-white/90 rounded-bl-[6px] border border-white/10 ${isNewMessage ? "bg-green-900/30 border-green-500/30" : ""}`
                        } ${item._temp ? "opacity-70" : ""}`}
                      >
                        {item.content ?? item.message}
                      </div>
                    </div>
                    <span className={`text-[10px] text-white/30 mt-2 ${isOwn ? "mr-1" : "ml-1"}`}>
                      {formatTime(item.sentAt ?? item.createdAt)}
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
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 focus-within:border-[var(--gold)]/40 transition-colors">
            <textarea
              ref={inputRef}
              value={text}
              onChange={handleInputChange}
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
