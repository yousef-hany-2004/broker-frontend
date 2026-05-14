// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, Bell, Loader2, MessageCircle } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "../../hooks/useAuth";
import {
  getUnreadCount,
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "../../services/notificationService";
import {
  upgradeToLandlord,
  getKycStatus,
} from "../../services/identityService";
import {
  onNotificationReceived,
  offNotificationReceived,
} from "../../services/signalRNotificationService";
import toast from "react-hot-toast";

const KYC_STATUS = {
  NotStarted: "NotStarted",
  InProgress: "InProgress",
  RequiresInput: "RequiresInput",
  Verified: "Verified",
  Rejected: "Rejected",
  Redacted: "Redacted",
  Canceled: "Canceled",
};

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // KYC state
  const [kycStatus, setKycStatus] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [upgradingToLandlord, setUpgradingToLandlord] = useState(false);

  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isLandlord = user?.roles?.includes("Landlord");

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch notification unread count on mount
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const result = await getUnreadCount();
        if (result.succeeded) setUnreadCount(result.data);
      } catch {
        // silently fail
      }
    };
    fetchCount();
  }, [user]);

  // Fetch KYC status on mount — only for non-landlord logged-in users
  useEffect(() => {
    if (!user || isLandlord) return;
    const fetchKycStatus = async () => {
      setKycLoading(true);
      try {
        const result = await getKycStatus();
        if (result.succeeded) setKycStatus(result.data.status);
      } catch {
        setKycStatus(KYC_STATUS.NotStarted);
      } finally {
        setKycLoading(false);
      }
    };
    fetchKycStatus();
  }, [user, isLandlord]);

  // SignalR real-time notifications
  useEffect(() => {
    if (!user) return;
    const handleNotification = (notification) => {
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [notification, ...prev]);
      toast(
        notification.message
          ? `${notification.title}: ${notification.message}`
          : notification.title,
        {
          icon: "🔔",
          style: {
            background: "var(--dark-2)",
            color: "var(--cream)",
            border: "1px solid rgba(193,170,119,0.2)",
            fontFamily: "Jost, sans-serif",
            fontSize: "13px",
          },
        },
      );
    };
    onNotificationReceived(handleNotification);
    return () => offNotificationReceived(handleNotification);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

  const handleBellClick = async () => {
    if (showDropdown) {
      setShowDropdown(false);
      return;
    }
    setShowDropdown(true);
    setLoadingNotifications(true);
    try {
      const result = await getNotifications({ PageNumber: 1, PageSize: 5 });
      if (result.succeeded) setNotifications(result.data || []);
    } catch {
      // silently fail
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silently fail
    }
  };

  const handleMarkOneAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const handleUpgradeToLandlord = async () => {
    setUpgradingToLandlord(true);
    try {
      const result = await upgradeToLandlord();
      if (result.succeeded && result.data?.verificationUrl) {
        window.location.href = result.data.verificationUrl;
      }
    } catch {
      // silently fail
    } finally {
      setUpgradingToLandlord(false);
    }
  };

  const renderKycButton = () => {
    if (!user || isLandlord || kycLoading) return null;

    if (
      kycStatus === KYC_STATUS.NotStarted ||
      kycStatus === null ||
      kycStatus === KYC_STATUS.RequiresInput
    ) {
      return (
        <button
          onClick={handleUpgradeToLandlord}
          disabled={upgradingToLandlord}
          className="text-[11px] tracking-[3px] uppercase border border-[#c1aa77]/40 text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--dark)] px-4 py-2 transition-all duration-300 disabled:opacity-40 flex items-center gap-2"
        >
          {upgradingToLandlord ? (
            <Loader2 size={12} className="animate-spin" />
          ) : null}
          Become a Landlord
        </button>
      );
    }

    if (kycStatus === KYC_STATUS.InProgress) {
      return (
        <button
          disabled
          title="Your verification is in progress, please wait"
          className="text-[11px] tracking-[3px] uppercase border border-[#c1aa77]/20 text-[#f5f0e8]/20 px-4 py-2 cursor-not-allowed"
        >
          Verification Pending
        </button>
      );
    }

    if (
      kycStatus === KYC_STATUS.Rejected ||
      kycStatus === KYC_STATUS.Redacted ||
      kycStatus === KYC_STATUS.Canceled
    ) {
      return (
        <button
          disabled
          title="Your verification was unsuccessful. Please contact support."
          className="text-[11px] tracking-[3px] uppercase border border-red-500/30 text-red-400/40 px-4 py-2 cursor-not-allowed"
        >
          Contact Support
        </button>
      );
    }

    return null;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-16 transition-all duration-400 font-jost ${
        scrolled
          ? "py-4 bg-[var(--dark)]/95 backdrop-blur-md border-b border-[#c1aa77]/10"
          : "py-6 bg-transparent"
      }`}
    >
      {/* Logo */}
      <Link
        to="/"
        className="font-cormorant text-2xl tracking-[4px] uppercase text-[var(--gold)]"
      >
        Aqua<span className="text-[var(--cream)]">Keys</span>
      </Link>

      {/* Links */}
      <div className="flex items-center gap-10">
        {[
          { to: "/", label: "Home" },
          ...(user ? [{ to: "/dashboard", label: "Dashboard" }] : []),
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`text-[11px] tracking-[3px] uppercase transition-colors duration-300 relative group ${
              location.pathname === to
                ? "text-[var(--gold)]"
                : "text-[#f5f0e8]/60 hover:text-[var(--cream)]"
            }`}
          >
            {label}
            <span
              className={`absolute -bottom-1 left-0 h-px bg-[var(--gold)] transition-all duration-300 ${
                location.pathname === to ? "w-full" : "w-0 group-hover:w-full"
              }`}
            />
          </Link>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        {/* KYC Button */}
        {renderKycButton()}

        <Link
          to="/favorites"
          className="text-[#f5f0e8]/50 hover:text-[var(--gold)] transition-colors duration-300"
        >
          <Heart size={24} />
        </Link>

        {/* Bell — only show when logged in */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleBellClick}
              className="relative flex items-center text-[#f5f0e8]/50 hover:text-[var(--gold)] transition-colors duration-300"
            >
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-[var(--gold)] text-[var(--dark)] text-[9px] font-bold flex items-center justify-center rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-80 bg-[#1a1a1a] border border-[#c1aa77]/20 shadow-2xl z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#c1aa77]/10">
                    <p className="text-[10px] tracking-[4px] uppercase text-[var(--gold)]">
                      Notifications
                    </p>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] tracking-[2px] uppercase text-[#f5f0e8]/40 hover:text-[var(--gold)] transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="px-4 py-6 text-center text-[#f5f0e8]/30 text-xs tracking-widest uppercase">
                        Loading...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-[#f5f0e8]/30 text-xs tracking-widest uppercase">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.isRead) handleMarkOneAsRead(n.id);
                          }}
                          className={`px-4 py-3 border-b border-[#c1aa77]/10 cursor-pointer hover:bg-[#c1aa77]/5 transition-colors duration-200 ${
                            !n.isRead ? "bg-[#c1aa77]/5" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p
                                className={`text-xs mb-0.5 ${!n.isRead ? "text-[var(--cream)]" : "text-[#f5f0e8]/50"}`}
                              >
                                {n.title}
                              </p>
                              <p className="text-[11px] text-[#f5f0e8]/40 leading-relaxed line-clamp-2">
                                {n.message}
                              </p>
                            </div>
                            {!n.isRead && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] mt-1 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-3 border-t border-[#c1aa77]/10">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/notifications");
                      }}
                      className="w-full text-[10px] tracking-[3px] uppercase text-[#f5f0e8]/40 hover:text-[var(--gold)] transition-colors text-center"
                    >
                      View All Notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {user ? (
          <Link
            to="/profile"
            className="w-9 h-9 rounded-full bg-[var(--gold)] text-[var(--dark)] flex items-center justify-center text-sm font-medium tracking-wider hover:bg-[var(--gold-light)] transition-colors duration-300"
          >
            {user?.firstName?.charAt(0).toUpperCase() ?? "?"}
          </Link>
        ) : (
          <Link
            to="/login"
            className="text-[11px] tracking-[3px] uppercase border border-[#c1aa77]/40 text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--dark)] px-4 py-2 transition-all duration-300"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
