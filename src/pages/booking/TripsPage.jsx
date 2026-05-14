import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar,
  CreditCard,
  MessageCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { getMyTrips, cancelBooking } from "../../services/bookingService";
import Navbar from "../../components/layout/Navbar";

// ─── Status config ───────────────────────────────────────────────
const STATUS_CONFIG = {
  Pending: {
    label: "Pending",
    color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  },
  Confirmed: {
    label: "Confirmed",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  },
  Active: {
    label: "Active",
    color: "text-green-400 bg-green-400/10 border-green-400/30",
  },
  Completed: {
    label: "Completed",
    color: "text-gray-400 bg-gray-400/10 border-gray-400/30",
  },
  Cancelled: {
    label: "Cancelled",
    color: "text-red-400 bg-red-400/10 border-red-400/30",
  },
};

// ─── Helper ──────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Cancel
const CancelModal = ({ trip, onClose, onCancelled }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await cancelBooking(trip.bookingId, reason || null);
      if (result.succeeded) {
        toast.success("Booking cancelled successfully.");
        onCancelled(trip.bookingId);
        onClose();
      } else {
        toast.error(result.message || "Failed to cancel booking.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0d0d]/80 flex items-center justify-center px-6">
      <div className="bg-[var(--dark-2)] border border-white/10 rounded-2xl p-8 max-w-md w-full">
        <p className="text-xs tracking-[4px] uppercase text-red-400 mb-3">
          Cancel Booking
        </p>
        <h2
          className="text-3xl font-light text-white mb-2"
          style={{ fontFamily: "Cormorant Garamond, serif" }}
        >
          {trip.propertyTitle}
        </h2>
        <p className="text-white/40 text-sm mb-6">
          Are you sure you want to cancel this booking? This action cannot be
          undone.
        </p>

        <div className="mb-6">
          <label className="block text-[10px] tracking-[3px] uppercase text-white/30 mb-2">
            Reason <span className="text-white/20">(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you cancelling?"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-red-400/40 transition-colors resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 text-xs tracking-[3px] uppercase hover:border-white/20 transition-colors"
          >
            Keep Booking
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs tracking-[3px] uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              "Yes, Cancel"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Trip Card ───────────────────────────────────────────────────
const TripCard = ({ trip, onPayOnline, onCancel, onMessage, unreadCount }) => {
  const status = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.Pending;

  return (
    <div className="bg-[var(--dark-2)] border border-white/5 rounded-2xl overflow-hidden hover:border-[var(--gold)]/30 transition-colors duration-300">
      {/* Property Image */}
      <div className="relative h-48 overflow-hidden">
        {trip.primaryImageUrl ? (
          <img
            src={trip.primaryImageUrl}
            alt={trip.propertyTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[var(--dark-3)] flex items-center justify-center">
            <span className="text-white/20 text-sm">No Image</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 space-y-4">
        {/* Title + City */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-white font-semibold text-base leading-snug line-clamp-1"
              style={{ fontFamily: "Cormorant Garamond, serif" }}
            >
              {trip.propertyTitle}
            </h3>
            <div
              className={`shrink-0 px-3 py-1 rounded-full border text-xs font-medium ${status.color}`}
            >
              {status.label}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1 text-white/50 text-sm">
            <MapPin size={13} />
            <span>{trip.city}</span>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <Calendar size={14} className="text-[var(--gold)] shrink-0" />
          <span>{formatDate(trip.checkInDate)}</span>
          <span className="text-white/30">→</span>
          <span>{formatDate(trip.checkOutDate)}</span>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-2 text-sm">
          <CreditCard size={14} className="text-[var(--gold)] shrink-0" />
          <span className="text-white/60">Total Paid:</span>
          <span className="text-[var(--gold)] font-semibold">
            {trip.totalAmountPaid.toLocaleString()} {trip.currency}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
          <button
            onClick={() => trip.actions.canPayOnline && onPayOnline(trip)}
            disabled={!trip.actions.canPayOnline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              trip.actions.canPayOnline
                ? "bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 text-[var(--gold)]"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            <CreditCard size={13} />
            Pay Online
          </button>

          <button
            onClick={() => trip.actions.canMessageLandlord && onMessage(trip)}
            disabled={!trip.actions.canMessageLandlord}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              trip.actions.canMessageLandlord
                ? "bg-white/5 hover:bg-white/10 text-white/70"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            <MessageCircle size={13} />
            Message
            {trip.actions.canMessageLandlord && unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full text-white font-bold"
                style={{
                  minWidth: 16,
                  height: 16,
                  fontSize: 9,
                  background: "#ef4444",
                  padding: "0 4px",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => trip.actions.canCancel && onCancel(trip)}
            disabled={!trip.actions.canCancel}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              trip.actions.canCancel
                ? "bg-red-500/10 hover:bg-red-500/20 text-red-400"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            <XCircle size={13} />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton Card ───────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-[var(--dark-2)] border border-white/5 rounded-2xl overflow-hidden animate-pulse">
    <div className="h-48 bg-white/5" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-white/5 rounded w-3/4" />
      <div className="h-3 bg-white/5 rounded w-1/2" />
      <div className="h-3 bg-white/5 rounded w-2/3" />
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────
export default function TripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [cancellingTrip, setCancellingTrip] = useState(null);
  const PAGE_SIZE = 9;

  const fetchTrips = async (page) => {
    setLoading(true);
    try {
      const res = await getMyTrips({ PageNumber: page, PageSize: PAGE_SIZE });
      const result = res.data;
      if (result.succeeded) {
        const fetchedTrips = result.data ?? [];
        setTrips(fetchedTrips);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
      } else {
        toast.error(result.message || "Failed to load trips");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips(currentPage);
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePayOnline = (trip) => {
    navigate(`/booking/confirm/${trip.bookingId}`);
  };

  const handleCancel = (trip) => {
    setCancellingTrip(trip);
  };

  const handleCancelled = (bookingId) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.bookingId === bookingId
          ? {
              ...t,
              status: "Cancelled",
              actions: {
                ...t.actions,
                canCancel: false,
                canPayOnline: false,
                canMessageLandlord: false,
              },
            }
          : t,
      ),
    );
  };

  return (
    <div
      className="min-h-screen text-white relative bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(13,13,13,0.7) 0%, rgba(13,13,13,0.9) 50%, rgba(13,13,13,1) 100%), url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1800&q=80')`,
      }}
    >
      <div className="relative z-10 pt-12">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero */}
          <div className="relative w-full h-52 rounded-3xl overflow-hidden mb-6">
            <img
              src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1800&q=80"
              alt="My Trips"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-10">
              <h1
                className="text-5xl font-semibold text-white"
                style={{ fontFamily: "Cormorant Garamond, serif" }}
              >
                My Trips
              </h1>
              {!loading && (
                <p className="text-white/50 mt-2 text-sm">
                  {totalCount} {totalCount === 1 ? "booking" : "bookings"} found
                </p>
              )}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Calendar size={48} className="text-white/10 mb-4" />
              <p className="text-white/40 text-lg">No trips yet</p>
              <p className="text-white/25 text-sm mt-1">
                Start exploring properties
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 px-6 py-2.5 rounded-full border border-[var(--gold)]/40 text-[var(--gold)] text-sm hover:bg-[var(--gold)]/10 transition-colors"
              >
                Explore Properties
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <TripCard
                  key={trip.bookingId}
                  trip={trip}
                  onPayOnline={handlePayOnline}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/50 hover:border-[var(--gold)]/40 hover:text-[var(--gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? "bg-[var(--gold)] text-[var(--dark)] font-semibold"
                        : "border border-white/10 text-white/50 hover:border-[var(--gold)]/40 hover:text-[var(--gold)]"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/50 hover:border-[var(--gold)]/40 hover:text-[var(--gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Cancel Button */}
        {cancellingTrip && (
          <CancelModal
            trip={cancellingTrip}
            onClose={() => setCancellingTrip(null)}
            onCancelled={handleCancelled}
          />
        )}
      </div>
    </div>
  );
}
