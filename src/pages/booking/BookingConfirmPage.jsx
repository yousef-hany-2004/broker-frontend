import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Loader2, CreditCard, Plus, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar";
import { getPaymentMethods } from "../../services/paymentService";
import { createCheckoutSession } from "../../services/paymentService";
import useAuth from "../../hooks/useAuth";

function BookingConfirmPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const booking = location.state?.booking;

  const [timeLeft, setTimeLeft] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);

  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [loadingCards, setLoadingCards] = useState(true);

  const [billing, setBilling] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    city: "",
    country: "",
    street: "",
    zipCode: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!booking) {
      toast.error("Booking session not found.");
      navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking]);

  useEffect(() => {
    if (!user) return;
    setBilling({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
      email: user.email || "",
      city: user.city || "",
      country: user.country || "",
      street: user.street || "",
      zipCode: user.zipCode || "",
    });
  }, [user]);

  useEffect(() => {
    if (!booking?.paymentTimeoutAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeout = new Date(booking.paymentTimeoutAt);
      const diff = timeout - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        setTimerExpired(true);
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  useEffect(() => {
    const fetchCards = async () => {
      setLoadingCards(true);
      try {
        const result = await getPaymentMethods();
        if (result.succeeded) {
          setSavedCards(result.data || []);
          const defaultCard = result.data?.find((c) => c.isDefault);
          if (defaultCard) setSelectedCardId(defaultCard.id);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingCards(false);
      }
    };

    fetchCards();
  }, []);

  const handleBillingChange = (e) => {
    setBilling((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (timerExpired) {
      toast.error("Your booking session has expired.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createCheckoutSession({
        bookingId,
        idempotencyKey: crypto.randomUUID(),
        currency: booking.currency,
        methodType: 1,
        savedPaymentMethodId: selectedCardId || null,
        billingDetails: billing,
      });

      if (result.succeeded) {
        window.location.href = result.data.checkoutUrl;
      } else {
        toast.error(result.message || "Checkout failed. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return null;

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

        <div className="max-w-3xl mx-auto px-6 py-16">
          {/* Timer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-5 border flex items-center justify-between ${
              timerExpired
                ? "border-red-500/40 bg-red-500/5"
                : "border-[#c1aa77]/20 bg-[#1a1a1a]/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock
                size={18}
                className={timerExpired ? "text-red-400" : "text-[var(--gold)]"}
              />
              <div>
                <p className="text-[10px] tracking-[4px] uppercase text-[#f5f0e8]/40 mb-0.5">
                  {timerExpired ? "Session Expired" : "Complete Payment Within"}
                </p>
                <p
                  className={`font-cormorant text-2xl ${
                    timerExpired ? "text-red-400" : "text-[var(--cream)]"
                  }`}
                >
                  {timerExpired ? "Expired" : timeLeft || "—"}
                </p>
              </div>
            </div>
            {timerExpired && (
              <button
                onClick={() => navigate(-1)}
                className="border border-red-500/40 text-red-400 px-5 py-2 text-xs tracking-[3px] uppercase hover:bg-red-500/10 transition-all"
              >
                Try Again
              </button>
            )}
          </motion.div>

          {timerExpired ? null : (
            <>
              {/* Booking Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#1a1a1a]/60 border border-[#c1aa77]/20 p-6 mb-6 flex gap-5"
              >
                {booking.propertyThumbnailUrl ? (
                  <img
                    src={booking.propertyThumbnailUrl}
                    alt={booking.propertyTitle}
                    className="w-24 h-24 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 bg-[#222] flex-shrink-0" />
                )}

                <div className="flex-1">
                  <p className="text-[10px] tracking-[4px] uppercase text-[var(--gold)] mb-1">
                    Booking Summary
                  </p>
                  <h2 className="font-cormorant text-2xl text-[var(--cream)] font-light mb-3">
                    {booking.propertyTitle}
                  </h2>

                  <div className="flex gap-6">
                    {booking.payableOnlineAmount > 0 && (
                      <div>
                        <p className="text-[10px] tracking-[3px] uppercase text-[#f5f0e8]/30 mb-0.5">
                          Due Online
                        </p>
                        <p className="text-[var(--gold)] text-sm">
                          {booking.payableOnlineAmount.toLocaleString()}{" "}
                          {booking.currency}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Saved Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#1a1a1a]/60 border border-[#c1aa77]/20 p-6 mb-6"
              >
                <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-5">
                  Payment Card
                </p>

                {loadingCards ? (
                  <div className="flex items-center gap-2 text-[#f5f0e8]/40 text-sm">
                    <Loader2 size={14} className="animate-spin" />
                    Loading cards...
                  </div>
                ) : savedCards.length === 0 ? (
                  <div className="flex items-center justify-between">
                    <p className="text-[#f5f0e8]/40 text-sm">
                      No saved cards. You'll complete payment on Paymob.
                    </p>
                    <button
                      onClick={() =>
                        navigate("/payment-methods", {
                          state: {
                            returnTo: `/booking/confirm/${bookingId}`,
                          },
                        })
                      }
                      className="flex items-center gap-2 text-[var(--gold)] text-xs tracking-[3px] uppercase hover:text-[var(--gold-light)] transition-colors"
                    >
                      <Plus size={14} />
                      Add Card
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() =>
                          setSelectedCardId(
                            selectedCardId === card.id ? null : card.id,
                          )
                        }
                        className={`flex items-center gap-4 p-4 border cursor-pointer transition-all duration-200 ${
                          selectedCardId === card.id
                            ? "border-[var(--gold)] bg-[#c1aa77]/5"
                            : "border-[#c1aa77]/20 hover:border-[#c1aa77]/40"
                        }`}
                      >
                        <CreditCard
                          size={18}
                          className={
                            selectedCardId === card.id
                              ? "text-[var(--gold)]"
                              : "text-[#f5f0e8]/40"
                          }
                        />
                        <div className="flex-1">
                          <p className="text-[var(--cream)] text-sm">
                            {card.cardBrand} •••• {card.last4Digits}
                          </p>
                          <p className="text-[#f5f0e8]/40 text-xs">
                            Expires {card.expiryDate}
                          </p>
                        </div>
                        {card.isDefault && (
                          <span className="text-[10px] tracking-[3px] uppercase text-[var(--gold)]/60">
                            Default
                          </span>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() =>
                        navigate("/payment-methods", {
                          state: {
                            returnTo: `/booking/confirm/${bookingId}`,
                          },
                        })
                      }
                      className="flex items-center gap-2 text-[#f5f0e8]/40 text-xs tracking-[3px] uppercase hover:text-[var(--gold)] transition-colors mt-2"
                    >
                      <Plus size={14} />
                      Add New Card
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Billing Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#1a1a1a]/60 border border-[#c1aa77]/20 p-6 mb-6"
              >
                <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-5">
                  Billing Details
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "firstName", label: "First Name" },
                    { name: "lastName", label: "Last Name" },
                    { name: "phoneNumber", label: "Phone Number" },
                    { name: "email", label: "Email" },
                    { name: "city", label: "City" },
                    { name: "country", label: "Country" },
                    { name: "street", label: "Street" },
                    { name: "zipCode", label: "Zip Code" },
                  ].map(({ name, label }) => (
                    <div key={name}>
                      <label className="block text-[10px] tracking-[3px] uppercase text-[#f5f0e8]/30 mb-2">
                        {label}
                      </label>
                      <input
                        name={name}
                        value={billing[name]}
                        onChange={handleBillingChange}
                        className="w-full bg-[#222] border border-[#c1aa77]/20 text-[var(--cream)] text-sm px-4 py-3 outline-none focus:border-[var(--gold)] transition-colors placeholder:text-[#f5f0e8]/20"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-4 bg-[var(--gold)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium hover:bg-[var(--gold-light)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : selectedCardId ? (
                    "Confirm Payment"
                  ) : (
                    "Proceed to Payment"
                  )}
                </button>

                {!selectedCardId && (
                  <p className="text-center text-[#f5f0e8]/30 text-xs mt-3 tracking-wide">
                    You will be redirected to Paymob to complete your payment.
                  </p>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmPage;
