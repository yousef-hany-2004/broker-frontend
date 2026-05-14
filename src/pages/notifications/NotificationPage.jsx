import { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../../services/notificationService";

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const result = await getNotifications({
          PageNumber: 1,
          PageSize: 50,
        });
        if (result.succeeded) {
          setNotifications(result.data || []);
        }
      } catch {
        toast.error("Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // silently fail
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen font-jost relative">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d]/85 via-[#0d0d0d]/75 to-[#0d0d0d]/95" />

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-3xl mx-auto px-6 py-28">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-2">
                Inbox
              </p>
              <h1 className="font-cormorant text-4xl text-[var(--cream)] font-light">
                Notifications
              </h1>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-2 border border-[#c1aa77]/30 text-[#f5f0e8]/50 hover:border-[var(--gold)] hover:text-[var(--gold)] px-4 py-2 text-[10px] tracking-[3px] uppercase transition-all duration-300 disabled:opacity-40"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="text-center text-[#f5f0e8]/30 text-xs tracking-widest uppercase py-20">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Bell size={40} className="text-[#f5f0e8]/10 mx-auto mb-4" />
              <p className="text-[#f5f0e8]/30 text-xs tracking-widest uppercase">
                No notifications yet
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1a1a1a]/60 border border-[#c1aa77]/20"
            >
              {notifications.map((n, index) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) handleMarkAsRead(n.id);
                  }}
                  className={`px-6 py-4 cursor-pointer hover:bg-[#c1aa77]/5 transition-colors duration-200 ${
                    index !== notifications.length - 1
                      ? "border-b border-[#c1aa77]/10"
                      : ""
                  } ${!n.isRead ? "bg-[#c1aa77]/5" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!n.isRead && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] flex-shrink-0" />
                        )}
                        <p
                          className={`text-sm ${
                            !n.isRead
                              ? "text-[var(--cream)]"
                              : "text-[#f5f0e8]/50"
                          }`}
                        >
                          {n.title}
                        </p>
                      </div>
                      <p className="text-xs text-[#f5f0e8]/40 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-[10px] text-[#f5f0e8]/25 whitespace-nowrap">
                        {timeAgo(n.createdAt)}
                      </p>
                      {n.category && (
                        <span className="text-[9px] tracking-[2px] uppercase text-[var(--gold)]/50 border border-[var(--gold)]/20 px-2 py-0.5">
                          {n.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
