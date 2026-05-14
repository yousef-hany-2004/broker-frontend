import { useNavigate } from "react-router-dom";
import {
  Plus,
  Wallet,
  CreditCard,
  User,
  Home,
  CalendarDays,
  Banknote,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import useAuth from "../../hooks/useAuth";

const QuickLinkCard = ({ icon, title, description, onClick }) => {
  const Icon = icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-6 rounded-2xl border border-white/5 bg-[var(--dark-2)] hover:border-[var(--gold)]/30 transition-all duration-300 group flex items-start gap-4"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--gold)]/10">
        <Icon size={18} className="text-[var(--gold)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-sm mb-1 text-white"
          style={{ fontFamily: "Cormorant Garamond, serif" }}
        >
          {title}
        </p>
        <p className="text-xs leading-relaxed text-white/40">{description}</p>
      </div>
      <ArrowRight
        size={16}
        className="shrink-0 mt-1 text-[var(--gold)]/40 group-hover:text-[var(--gold)] transition-transform duration-300 group-hover:translate-x-1"
      />
    </button>
  );
};

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.firstName || "there";

  return (
    <div
      className="min-h-screen text-white relative bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(13,13,13,0.7) 0%, rgba(13,13,13,0.8) 50%, rgba(13,13,13,0.9) 100%), url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1800&q=80')`,
      }}
    >
      <div className="relative z-10 pt-12">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero */}
          <div className="relative w-full h-52 rounded-3xl overflow-hidden mb-10">
            <img
              src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1800&q=80"
              alt="Dashboard"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-10">
              <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-2">
                Landlord Dashboard
              </p>
              <h1
                className="text-5xl font-semibold text-white"
                style={{ fontFamily: "Cormorant Garamond, serif" }}
              >
                Welcome back, {firstName}
              </h1>
            </div>
          </div>

          {/* Two groups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Group 1 — Your Account */}
            <div>
              <p className="tracking-[4px] uppercase text-[var(--gold)] mb-4 font-medium">
                Your Account
              </p>
              <div className="flex flex-col gap-3">
                <QuickLinkCard
                  icon={Briefcase}
                  title="My Trips"
                  description="View your bookings as a guest"
                  onClick={() => navigate("/trips")}
                />
                <QuickLinkCard
                  icon={CreditCard}
                  title="Payment Methods"
                  description="Manage your saved cards"
                  onClick={() => navigate("/payment-methods")}
                />
                <QuickLinkCard
                  icon={User}
                  title="Profile"
                  description="Update your personal information"
                  onClick={() => navigate("/profile")}
                />
              </div>
            </div>

            {/* Group 2 — Your Properties */}
            <div>
              <p className="tracking-[4px] uppercase text-[var(--gold)] mb-4 font-medium">
                Your Properties
              </p>
              <div className="flex flex-col gap-3">
                <QuickLinkCard
                  icon={Plus}
                  title="Create Listing"
                  description="List a new property for sale or rent"
                  onClick={() => navigate("/create-listing")}
                  gold={true}
                />
                <QuickLinkCard
                  icon={Home}
                  title="My Listings"
                  description="Manage your uploaded properties"
                  onClick={() => navigate("/host/listings")}
                />
                <QuickLinkCard
                  icon={CalendarDays}
                  title="Reservations"
                  description="View and manage guest bookings"
                  onClick={() => navigate("/host/reservations")}
                />
                <QuickLinkCard
                  icon={Banknote}
                  title="Payout Methods"
                  description="Manage your withdrawal accounts"
                  onClick={() => navigate("/payout-methods")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
