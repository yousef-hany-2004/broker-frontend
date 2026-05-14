import { useLocation, useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Navbar from "../../components/layout/Navbar";

function BookingSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking;

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

        <div className="min-h-screen flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#1a1a1a]/60 border border-[#c1aa77]/20 p-12 max-w-lg w-full text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle
                size={56}
                className="text-[var(--gold)] mx-auto mb-6"
              />
            </motion.div>

            {/* Label */}
            <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
              Booking Confirmed
            </p>

            {/* Title */}
            <h1 className="font-cormorant text-4xl text-[var(--cream)] font-light mb-3">
              Payment Successful
            </h1>

            {/* Property info if available */}
            {booking && (
              <div className="mt-6 mb-8 border-t border-b border-[#c1aa77]/10 py-6 space-y-4">
                {booking.propertyThumbnailUrl && (
                  <img
                    src={booking.propertyThumbnailUrl}
                    alt={booking.propertyTitle}
                    className="w-full h-40 object-cover mx-auto"
                  />
                )}
                <p className="font-cormorant text-xl text-[var(--cream)] font-light">
                  {booking.propertyTitle}
                </p>
                <div className="flex justify-center gap-8">
                  {booking.payableOnlineAmount > 0 && (
                    <div>
                      <p className="text-[10px] tracking-[3px] uppercase text-[#f5f0e8]/30 mb-1">
                        Paid Online
                      </p>
                      <p className="text-[var(--gold)] text-sm">
                        {booking.payableOnlineAmount.toLocaleString()}{" "}
                        {booking.currency}
                      </p>
                    </div>
                  )}
                  {booking.payableInCashAmount > 0 && (
                    <div>
                      <p className="text-[10px] tracking-[3px] uppercase text-[#f5f0e8]/30 mb-1">
                        Due in Cash
                      </p>
                      <p className="text-[var(--cream)] text-sm">
                        {booking.payableInCashAmount.toLocaleString()}{" "}
                        {booking.currency}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!booking && (
              <p className="text-[#f5f0e8]/40 text-sm tracking-wide mb-8">
                Your booking has been confirmed and payment was processed
                successfully.
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 bg-[var(--gold)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium hover:bg-[var(--gold-light)] transition-all duration-300"
              >
                Back to Home
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-3 border border-[#c1aa77]/30 text-[#f5f0e8]/60 text-xs tracking-[4px] uppercase hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all duration-300"
              >
                View My Bookings
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default BookingSuccessPage;
