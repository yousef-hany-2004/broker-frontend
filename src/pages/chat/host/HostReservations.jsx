import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Loader2, CheckCircle, Clock, XCircle, DollarSign, Calendar, User, MessageCircle, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../../../components/layout/Navbar";
import ChatPanel from "../ChatPanel";
import { getHostReservations, confirmCashCollection } from "../../../services/hostReservationService";

const BOOKING_STATUS = {
  1: { label: "Pending",   color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", icon: Clock },
  2: { label: "Confirmed", color: "text-green-400 bg-green-400/10 border-green-400/30",    icon: CheckCircle },
  3: { label: "Cancelled", color: "text-red-400 bg-red-400/10 border-red-400/30",          icon: XCircle },
  4: { label: "Active", color: "text-blue-400 bg-blue-400/10 border-blue-400/30",       icon: CheckCircle },
  5: { label: "Completed", color: "text-purple-400 bg-purple-400/10 border-purple-400/30", icon: CheckCircle },
  6: { label: "Disputed", color: "text-orange-400 bg-orange-400/10 border-orange-400/30", icon: XCircle },
  Disputed: { label: "Disputed", color: "text-orange-400 bg-orange-400/10 border-orange-400/30", icon: XCircle },
  Completed: { label: "Completed", color: "text-purple-400 bg-purple-400/10 border-purple-400/30", icon: CheckCircle },
  Pending:   { label: "Pending",   color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", icon: Clock },
  Confirmed: { label: "Confirmed", color: "text-green-400 bg-green-400/10 border-green-400/30",    icon: CheckCircle },
  Cancelled: { label: "Cancelled", color: "text-red-400 bg-red-400/10 border-red-400/30",          icon: XCircle },
  Active: { label: "Active", color: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: CheckCircle },
 
};

const PAYMENT_METHOD = { 1: "Cash", 2: "Online", Cash: "Cash", Online: "Online" };

const FILTER_TABS = [
  { key: "All",       label: "All",       color: "text-white/70",  dot: "bg-white/30" },
  { key: "Pending",   label: "Pending",   color: "text-yellow-400", dot: "bg-yellow-400" },
  { key: "Confirmed", label: "Confirmed", color: "text-green-400",  dot: "bg-green-400" },
  { key: "Active",    label: "Active",    color: "text-blue-400", dot: "bg-blue-400" },
  { key: "Cancelled", label: "Cancelled", color: "text-red-400",    dot: "bg-red-400" },
  { key: "Completed", label: "Completed", color: "text-purple-400", dot: "bg-purple-400" },
  { key: "Disputed", label: "Disputed", color: "text-orange-400", dot: "bg-orange-400" },
];

const SkeletonCard = () => (
  <div className="bg-[var(--dark-2)] border border-white/5 rounded-2xl overflow-hidden animate-pulse flex items-center gap-4 p-5">
    <div className="w-20 h-20 rounded-xl bg-white/5 shrink-0" />
    <div className="flex-1 space-y-3">
      <div className="h-4 bg-white/5 rounded w-2/3" />
      <div className="h-3 bg-white/5 rounded w-1/2" />
      <div className="h-3 bg-white/5 rounded w-1/3" />
    </div>
    <div className="w-28 h-9 bg-white/5 rounded-full shrink-0" />
  </div>
);

const ReservationCard = ({ reservation, onConfirm, confirming, onMessage }) => {
  const statusKey = reservation.status ?? reservation.bookingStatus;
  const statusInfo = BOOKING_STATUS[statusKey] ?? { label: String(statusKey), color: "text-white/40 bg-white/5 border-white/10", icon: Clock };
  const StatusIcon = statusInfo.icon;

  const paymentMethod = PAYMENT_METHOD[reservation.paymentMethod] ?? reservation.paymentMethod;
  const isCash = paymentMethod === "Cash" || reservation.paymentMethod === 1 || reservation.paymentMethod === "Cash";
  const isConfirmed = reservation.isCashCollected || reservation.cashCollected;
  const canConfirm = isCash && !isConfirmed;
  const canMessage = reservation.status !== "Cancelled";

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const bookingId = reservation.bookingId ?? reservation.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-[var(--dark-2)] border border-white/5 rounded-2xl overflow-hidden hover:border-[var(--gold)]/20 transition-all duration-300 group"
    >
      <div className="flex flex-col sm:flex-row gap-0">
        <div className={`w-full sm:w-1 shrink-0 ${isCash ? "bg-[var(--gold)]/40" : "bg-blue-500/30"} sm:rounded-l-2xl h-1 sm:h-auto`} />
        <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4">

         <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/8">
          <img
            src={reservation.primaryImageUrl}
             alt={reservation.propertyTitle ?? "Property"}
             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
             onError={(e) => {
           e.currentTarget.style.display = "none";
           e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-white/5"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,255,255,0.2)\' stroke-width=\'2\'><path d=\'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\'/><polyline points=\'9 22 9 12 15 12 15 22\'/></svg></div>';
           }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-base truncate" style={{ fontFamily: "Cormorant Garamond, serif" }}>
                {reservation.propertyTitle ?? reservation.unitName ?? reservation.property ?? "Property"}
              </h3>
              <span className={`shrink-0 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold flex items-center gap-1 ${statusInfo.color}`}>
                <StatusIcon size={10} />
                {statusInfo.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/35 text-xs">
              {(reservation.clientName ?? reservation.guestName ?? reservation.tenantName) && (
                <span className="flex items-center gap-1">
                  <User size={11} />
                  {reservation.clientName ?? reservation.guestName ?? reservation.tenantName}
                </span>
              )}
              {(reservation.startDate ?? reservation.checkIn ?? reservation.checkInDate) && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {formatDate(reservation.startDate ?? reservation.checkIn ?? reservation.checkInDate)}
                  {" → "}
                  {formatDate(reservation.endDate ?? reservation.checkOut ?? reservation.checkOutDate)}
                </span>
              )}
              
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[var(--gold)] text-xl font-semibold" style={{ fontFamily: "Cormorant Garamond, serif" }}>
              {(reservation.totalPrice ?? reservation.landlordPayoutAmount ?? reservation.amount ?? 0).toLocaleString()}
              <span className="text-xs text-white/30 font-normal ml-1">{reservation.currency ?? "EGP"}</span>
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 flex-wrap">
            {canMessage && (
              <button
                onClick={() => onMessage(reservation)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-[var(--gold)]/40 hover:text-[var(--gold)] text-white/50 text-xs font-semibold transition-all duration-200"
              >
                <MessageCircle size={13} />
                Message
              </button>
            )}

            {canConfirm ? (
              <button
                onClick={() => onConfirm(bookingId)}
                disabled={confirming === bookingId}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--gold)] text-[#0d0d0d] text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {confirming === bookingId ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                Confirm Cash
              </button>
            ) : isConfirmed ? (
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-400/10 border border-green-400/30 text-green-400 text-xs font-semibold">
                <CheckCircle size={13} /> Collected
              </span>
            ) : !isCash ? (
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-400/10 border border-blue-400/30 text-blue-400 text-xs font-semibold">
                <CheckCircle size={13} /> Paid Online
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function HostReservations() {
  const [reservations, setReservations]               = useState([]);
  const [loading, setLoading]                         = useState(true);
  const [confirming, setConfirming]                   = useState(null);
  const [currentPage, setCurrentPage]                 = useState(1);
  const [totalPages, setTotalPages]                   = useState(1);
  const [totalCount, setTotalCount]                   = useState(0);
  const [chattingReservation, setChattingReservation] = useState(null);
  const [activeFilter, setActiveFilter]               = useState("All");
  const [searchTerm, setSearchTerm]                   = useState("");
  const [debouncedSearch, setDebouncedSearch]         = useState("");
  const debounceTimer                                 = useRef(null);
  const PAGE_SIZE = 10;

  // ── Debounce search input ──────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm]);

  // ── Reset page when filter changes ────────────────────────────────────
  const handleFilterChange = (key) => {
    setActiveFilter(key);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // ── Fetch — now sends status + search to the API ──────────────────────
  const STATUS_MAP = { Pending: 1, Confirmed: 2,Active: 3, Completed: 4, Disputed: 7, Cancelled: 6};

const fetchReservations = async (page, status, search) => {
    setLoading(true);
    try {
      const params = {
        PageNumber: page,
        PageSize: PAGE_SIZE,
        ...(status && status !== "All" && { StatusFilter: STATUS_MAP[status] }),
        ...(search && search.trim() && { SearchTerm: search.trim() }),
      };

      const result = await getHostReservations(params);

      if (result.succeeded) {
        const sorted = (result.data ?? []).sort((a, b) => {
          const order = { Completed: 0, Active: 1, Confirmed: 2, Pending: 3, Cancelled: 4 };
          const aKey = a.status ?? a.bookingStatus;
          const bKey = b.status ?? b.bookingStatus;
          return (order[aKey] ?? 5) - (order[bKey] ?? 5);
        });
        setReservations(sorted);
        setTotalPages(result.totalPages ?? 1);
        setTotalCount(result.totalCount ?? 0);
      } else {
        toast.error(result.message ?? "Failed to load reservations.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ── A single useEffect monitors the 3 variables──────────────────────────────
  useEffect(() => {
    fetchReservations(currentPage, activeFilter, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, activeFilter, debouncedSearch]);

  // ── Confirm cash ──────────────────────────────────────────────────────
  const handleConfirm = async (bookingId) => {
    setConfirming(bookingId);
    try {
      const result = await confirmCashCollection(bookingId);
      if (result.succeeded) {
        toast.success("Cash collection confirmed!");
        setReservations((prev) =>
          prev.map((r) =>
            (r.bookingId ?? r.id) === bookingId
              ? { ...r, isCashCollected: true, cashCollected: true }
              : r
          )
        );
      } else {
        toast.error(result.message ?? "Failed to confirm.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setConfirming(null);
    }
  };

  const handleMessage = (reservation) => {
    setChattingReservation({
      bookingId: reservation.bookingId ?? reservation.id,
      propertyTitle: reservation.propertyTitle ?? reservation.unitName ?? "Property",
      city: reservation.city ?? "",
      clientName: reservation.clientName ?? reservation.guestName ?? reservation.tenantName ?? "",
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* ── Hero banner ───────────────────────────────────────────── */}
          <div className="relative w-full h-52 rounded-3xl overflow-hidden mb-8">
            <img src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1800&q=80" alt="Reservations" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-10">
              <h1 className="text-5xl font-semibold text-white" style={{ fontFamily: "Cormorant Garamond, serif" }}>
                Reservations
              </h1>
              {!loading && (
                <p className="text-white/50 mt-2 text-sm">
                  {totalCount} {totalCount === 1 ? "reservation" : "reservations"} found
                </p>
              )}
            </div>
          </div>

          {/* ── Unified filter + search bar ───────────────────────────── */}
          <div className="flex items-center gap-2 mb-6 bg-[var(--dark-2)] border border-white/8 rounded-2xl p-1.5">

            {/* Filter tabs */}
            <div className="flex items-center gap-1 shrink-0">
              {FILTER_TABS.map((tab) => {
                const isActive = activeFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleFilterChange(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap
                      ${isActive
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/60"
                      }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${tab.dot} ${isActive ? "opacity-100" : "opacity-50"}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-white/10 shrink-0" />

            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by guest, property, or booking ID…"
                className="w-full bg-transparent pl-8 pr-8 py-1.5 text-sm text-white placeholder-white/25 outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(""); setDebouncedSearch(""); setCurrentPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

          </div>

          {/* ── List ──────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Home size={48} className="text-white/10 mb-4" />
              <p className="text-white/40 text-lg">
                {searchTerm
                  ? `No results for "${searchTerm}"`
                  : activeFilter === "All" ? "No reservations yet" : `No ${activeFilter} reservations`}
              </p>
              <p className="text-white/25 text-sm mt-1">
                {searchTerm
                  ? "Try a different name, property, or booking ID"
                  : activeFilter === "All"
                  ? "Reservations will appear here once guests book your properties"
                  : "Try selecting a different status filter"}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="flex flex-col gap-4">
                {reservations.map((r) => (
                  <ReservationCard
                    key={r.bookingId ?? r.id}
                    reservation={r}
                    onConfirm={handleConfirm}
                    confirming={confirming}
                    onMessage={handleMessage}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* ── Pagination ────────────────────────────────────────────── */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/50 hover:border-[var(--gold)]/40 hover:text-[var(--gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
              ))}
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
      </div>

      {chattingReservation && (
        <ChatPanel
          trip={chattingReservation}
          onClose={() => setChattingReservation(null)}
          onUnreadCleared={() => {}}
        />
      )}
    </div>
  );
}