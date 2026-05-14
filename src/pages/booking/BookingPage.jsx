import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar";
import { getBlockedDates, createBooking } from "../../services/bookingService";
import { getPropertyById } from "../../services/propertyService";

const PRICING_UNIT = {
  1: "",
  2: "/ night",
  3: "/ week",
  4: "/ month",
  5: "/ m²",
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function BookingPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Calendar state — which month is showing (0 = current, 1 = next)
  const [calendarOffset, setCalendarOffset] = useState(0);

  // Selected dates
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);

  // Payment method: 1 = online, 2 = cash
  const [paymentMethod, setPaymentMethod] = useState(1);

  // Data
  const [property, setProperty] = useState(null);
  const [blockedRanges, setBlockedRanges] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // The month being displayed
  const displayYear = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + calendarOffset);
    return d.getFullYear();
  }, [calendarOffset, today]);

  const displayMonth = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + calendarOffset);
    return d.getMonth();
  }, [calendarOffset, today]);

  // Fetch property + blocked dates
  useEffect(() => {
    const fetchAll = async () => {
      setLoadingPage(true);
      try {
        // FIX: calculate endDate properly using Date object
        // instead of passing month+2 directly to formatDate which double-adds +1
        const startDate = formatDate(today.getFullYear(), today.getMonth(), 1);
        const nextMonthEnd = new Date(
          today.getFullYear(),
          today.getMonth() + 2,
          0,
        );
        const endDate = formatDate(
          nextMonthEnd.getFullYear(),
          nextMonthEnd.getMonth(),
          nextMonthEnd.getDate(),
        );

        const [propResult, blockedResult] = await Promise.all([
          getPropertyById(propertyId),
          getBlockedDates(propertyId, startDate, endDate),
        ]);

        if (propResult.succeeded) {
          setProperty(propResult.data);
        } else {
          toast.error(propResult.message || "Failed to load property.");
          navigate(-1);
        }

        // blockedResult is a plain array
        if (blockedResult?.succeeded && Array.isArray(blockedResult.data)) {
          setBlockedRanges(blockedResult.data);
        } else if (Array.isArray(blockedResult)) {
          setBlockedRanges(blockedResult);
        }
      } catch {
        toast.error("Failed to load booking page.");
        navigate(-1);
      } finally {
        setLoadingPage(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  // Build a Set of blocked date strings for fast lookup
  const blockedDatesSet = useMemo(() => {
    const set = new Set();
    blockedRanges.forEach(({ startDate, endDate }) => {
      const start = parseDate(startDate);
      const end = parseDate(endDate);
      const cur = new Date(start);
      while (cur <= end) {
        set.add(formatDate(cur.getFullYear(), cur.getMonth(), cur.getDate()));
        cur.setDate(cur.getDate() + 1);
      }
    });
    return set;
  }, [blockedRanges]);

  function isBlocked(year, month, day) {
    const date = new Date(year, month, day);
    const dateStr = formatDate(year, month, day);

    // Past dates
    if (date < today) return true;

    // Today and tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (date <= tomorrow) return true;

    // Backend blocked
    if (blockedDatesSet.has(dateStr)) return true;

    return false;
  }

  function isInRange(year, month, day) {
    if (!checkIn) return false;
    const date = new Date(year, month, day);
    const checkInDate = parseDate(checkIn);
    const endDate = checkOut
      ? parseDate(checkOut)
      : hoverDate
        ? hoverDate
        : null;
    if (!endDate) return false;
    return date > checkInDate && date < endDate;
  }

  function isCheckIn(year, month, day) {
    return checkIn === formatDate(year, month, day);
  }

  function isCheckOut(year, month, day) {
    return checkOut === formatDate(year, month, day);
  }

  function handleDayClick(year, month, day) {
    const dateStr = formatDate(year, month, day);
    if (isBlocked(year, month, day)) return;

    if (!checkIn || (checkIn && checkOut)) {
      // Start fresh selection
      setCheckIn(dateStr);
      setCheckOut(null);
      return;
    }

    // checkIn is set, checkOut is not
    const clickedDate = parseDate(dateStr);
    const checkInDate = parseDate(checkIn);

    if (clickedDate <= checkInDate) {
      // Clicked before or on checkIn — reset
      setCheckIn(dateStr);
      setCheckOut(null);
      return;
    }

    // Check if any blocked date is in the range
    const cur = new Date(checkInDate);
    cur.setDate(cur.getDate() + 1);
    let hasBlocked = false;
    while (cur < clickedDate) {
      if (
        blockedDatesSet.has(
          formatDate(cur.getFullYear(), cur.getMonth(), cur.getDate()),
        )
      ) {
        hasBlocked = true;
        break;
      }
      cur.setDate(cur.getDate() + 1);
    }

    if (hasBlocked) {
      toast.error("Your selected range includes unavailable dates.");
      setCheckIn(dateStr);
      setCheckOut(null);
      return;
    }

    setCheckOut(dateStr);
  }

  function handleDayHover(year, month, day) {
    if (checkIn && !checkOut) {
      setHoverDate(new Date(year, month, day));
    }
  }

  const renderMonth = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const blocked = isBlocked(year, month, d);
      const inRange = isInRange(year, month, d);
      const isStart = isCheckIn(year, month, d);
      const isEnd = isCheckOut(year, month, d);

      days.push(
        <div
          key={d}
          onClick={() => handleDayClick(year, month, d)}
          onMouseEnter={() => handleDayHover(year, month, d)}
          className={`
            relative h-9 w-full flex items-center justify-center text-sm cursor-pointer select-none transition-all duration-150
            ${blocked ? "text-[#f5f0e8]/20 cursor-not-allowed" : "hover:bg-[#c1aa77]/10"}
            ${inRange ? "bg-[#c1aa77]/10 text-[var(--cream)]" : ""}
            ${isStart || isEnd ? "bg-[var(--gold)] text-[var(--dark)] font-medium" : ""}
            ${!blocked && !isStart && !isEnd ? "text-[#f5f0e8]/70" : ""}
          `}
        >
          {d}
        </div>,
      );
    }

    return (
      <div>
        <p className="text-center text-[var(--cream)] font-cormorant text-lg mb-3">
          {MONTH_NAMES[month]} {year}
        </p>
        <div className="grid grid-cols-7 gap-y-1 mb-2">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] tracking-widest uppercase text-[#f5f0e8]/30 pb-1"
            >
              {d}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const calendarGrid = useMemo(
    () => renderMonth(displayYear, displayMonth),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayYear, displayMonth, checkIn, checkOut, hoverDate, blockedDatesSet],
  );

  const handleSubmit = async () => {
    if (!checkIn || !checkOut) {
      toast.error("Please select check-in and check-out dates.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createBooking({
        propertyListingId: propertyId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        paymentMethod,
      });

      console.log("=== createBooking result ===", result);

      if (result.succeeded) {
        console.log("=== navigating with booking ===", result.data);
        navigate(`/booking/confirm/${result.data.bookingId}`, {
          state: { booking: result.data },
        });
      } else {
        toast.error(result.message || "Failed to create booking.");
      }
    } catch (err) {
      console.log("=== createBooking error ===", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="min-h-screen font-jost relative">
        <div className="absolute inset-0 bg-[#0d0d0d]" />
        <div className="relative z-10">
          <Navbar />
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="animate-spin text-[var(--gold)]" size={32} />
          </div>
        </div>
      </div>
    );
  }

  const price = property?.price;
  const location = property?.location;

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

        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-2">
              Book Your Stay
            </p>
            <h1 className="font-cormorant text-4xl text-[var(--cream)] font-light">
              {property?.title}
            </h1>
            {location && (
              <p className="text-[#f5f0e8]/40 text-sm mt-1 tracking-wide">
                {location.city}
                {location.state ? `, ${location.state}` : ""}
              </p>
            )}
            {price && (
              <p className="text-[var(--gold)] text-sm mt-1">
                {price.amount.toLocaleString()} {price.currency}
                {PRICING_UNIT[price.unit]}
              </p>
            )}
          </motion.div>

          {/* Calendar Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1a1a1a]/60 border border-[#c1aa77]/20 p-8 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)]">
                Select Dates
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCalendarOffset((o) => Math.max(0, o - 1))}
                  disabled={calendarOffset === 0}
                  className="text-[#f5f0e8]/40 hover:text-[var(--gold)] disabled:opacity-20 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCalendarOffset((o) => Math.min(1, o + 1))}
                  disabled={calendarOffset === 1}
                  className="text-[#f5f0e8]/40 hover:text-[var(--gold)] disabled:opacity-20 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Calendar grid */}
            <div onMouseLeave={() => setHoverDate(null)}>{calendarGrid}</div>

            {/* Selected range summary */}
            <div className="mt-6 flex gap-6 border-t border-[#c1aa77]/10 pt-5">
              <div>
                <p className="text-[10px] tracking-[4px] uppercase text-[#f5f0e8]/30 mb-1">
                  Check-in
                </p>
                <p className="text-[var(--cream)] text-sm">{checkIn || "—"}</p>
              </div>
              <div className="w-px bg-[#c1aa77]/10" />
              <div>
                <p className="text-[10px] tracking-[4px] uppercase text-[#f5f0e8]/30 mb-1">
                  Check-out
                </p>
                <p className="text-[var(--cream)] text-sm">{checkOut || "—"}</p>
              </div>
              {checkIn && checkOut && (
                <>
                  <div className="w-px bg-[#c1aa77]/10" />
                  <div>
                    <p className="text-[10px] tracking-[4px] uppercase text-[#f5f0e8]/30 mb-1">
                      Nights
                    </p>
                    <p className="text-[var(--cream)] text-sm">
                      {Math.round(
                        (parseDate(checkOut) - parseDate(checkIn)) /
                          (1000 * 60 * 60 * 24),
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Payment Method Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1a1a1a]/60 border border-[#c1aa77]/20 p-8 mb-6"
          >
            <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-6">
              Payment Method
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Online */}
              <button
                onClick={() => setPaymentMethod(1)}
                className={`p-5 border text-left transition-all duration-200 ${
                  paymentMethod === 1
                    ? "border-[var(--gold)] bg-[#c1aa77]/5"
                    : "border-[#c1aa77]/20 hover:border-[#c1aa77]/40"
                }`}
              >
                <p
                  className={`text-sm font-medium mb-1 ${paymentMethod === 1 ? "text-[var(--gold)]" : "text-[var(--cream)]"}`}
                >
                  Online Payment
                </p>
                <p className="text-[#f5f0e8]/40 text-xs leading-relaxed">
                  Full amount charged online via card.
                </p>
              </button>

              {/* Cash — disabled */}
              <button
                disabled
                className="p-5 border border-[#c1aa77]/10 text-left cursor-not-allowed opacity-40 relative"
              >
                <p className="text-sm font-medium mb-1 text-[var(--cream)]">
                  Cash Payment
                </p>
                <p className="text-[#f5f0e8]/40 text-xs leading-relaxed">
                  Currently unavailable.
                </p>
                <span className="absolute top-2 right-2 text-[9px] tracking-[2px] uppercase text-[#f5f0e8]/20 border border-[#f5f0e8]/10 px-2 py-0.5">
                  Soon
                </span>
              </button>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handleSubmit}
              disabled={submitting || !checkIn || !checkOut}
              className="w-full py-4 bg-[var(--gold)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium hover:bg-[var(--gold-light)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Dates & Continue"
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default BookingPage;
