import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import {
  getKycStatus,
  upgradeToLandlord,
} from "../../services/identityService";
import useAuth from "../../hooks/useAuth";

const KYC_STATUS = {
  NotStarted: "NotStarted",
  InProgress: "InProgress",
  RequiresInput: "RequiresInput",
  Verified: "Verified",
  Rejected: "Rejected",
  Redacted: "Redacted",
  Canceled: "Canceled",
};

function KycResultPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [status, setStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      try {
        const result = await getKycStatus();
        if (result.succeeded) {
          setStatus(result.data.status);
          setRejectionReason(result.data.rejectionReason || null);
        }
      } catch {
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleTryAgain = async () => {
    setUpgrading(true);
    try {
      const result = await upgradeToLandlord();
      if (result.succeeded && result.data?.verificationUrl) {
        window.location.href = result.data.verificationUrl;
      }
    } catch {
      // silently fail
    } finally {
      setUpgrading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
            Please Wait
          </p>
          <h1 className="font-cormorant text-4xl text-[var(--cream)] font-light mb-3">
            Checking Status...
          </h1>
          <p className="text-[#f5f0e8]/40 text-sm tracking-wide">
            Fetching your verification status.
          </p>
        </>
      );
    }

    switch (status) {
      case KYC_STATUS.Verified:
        return (
          <>
            <CheckCircle
              size={52}
              className="text-[var(--gold)] mx-auto mb-6"
            />
            <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
              Verified
            </p>
            <h1 className="font-cormorant text-4xl text-[var(--cream)] font-light mb-3">
              You're Now a Landlord
            </h1>
            <p className="text-[#f5f0e8]/40 text-sm tracking-wide mb-8">
              Your identity has been verified successfully. Sign in again to
              activate your Landlord account.
            </p>
            <button
              onClick={logout}
              className="w-full py-3 bg-[var(--gold)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium hover:bg-[var(--gold-light)] transition-all duration-300"
            >
              Sign In Again to Activate
            </button>
          </>
        );

      case KYC_STATUS.InProgress:
        return (
          <>
            <Clock size={52} className="text-[var(--gold)] mx-auto mb-6" />
            <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
              In Progress
            </p>
            <h1 className="font-cormorant text-4xl text-[var(--cream)] font-light mb-3">
              Verification Underway
            </h1>
            <p className="text-[#f5f0e8]/40 text-sm tracking-wide mb-8">
              Your documents are being reviewed. This may take a few minutes.
              You'll receive a notification once the process is complete.
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 border border-[#c1aa77]/30 text-[#f5f0e8]/60 text-xs tracking-[4px] uppercase hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all duration-300"
            >
              Back to Home
            </button>
          </>
        );

      case KYC_STATUS.RequiresInput:
        return (
          <>
            <AlertTriangle size={52} className="text-yellow-400 mx-auto mb-6" />
            <p className="text-[10px] tracking-[5px] uppercase text-yellow-400 mb-3">
              Action Required
            </p>
            <h1 className="font-cormorant text-4xl text-[var(--cream)] font-light mb-3">
              More Information Needed
            </h1>
            <p className="text-[#f5f0e8]/40 text-sm tracking-wide mb-8">
              Stripe requires additional information to complete your
              verification. Please try again and provide the requested
              documents.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleTryAgain}
                disabled={upgrading}
                className="w-full py-3 bg-[var(--gold)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium hover:bg-[var(--gold-light)] transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {upgrading && <Loader2 size={14} className="animate-spin" />}
                {upgrading ? "Redirecting..." : "Try Again"}
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 border border-[#c1aa77]/30 text-[#f5f0e8]/60 text-xs tracking-[4px] uppercase hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all duration-300"
              >
                Back to Home
              </button>
            </div>
          </>
        );

      case KYC_STATUS.Rejected:
      case KYC_STATUS.Redacted:
      case KYC_STATUS.Canceled:
        return (
          <>
            <XCircle size={52} className="text-red-400 mx-auto mb-6" />
            <p className="text-[10px] tracking-[5px] uppercase text-red-400 mb-3">
              {status === KYC_STATUS.Canceled ? "Canceled" : "Rejected"}
            </p>
            <h1 className="font-cormorant text-4xl text-[var(--cream)] font-light mb-3">
              Verification Unsuccessful
            </h1>
            {rejectionReason && (
              <p className="text-[#f5f0e8]/40 text-sm tracking-wide mb-4">
                Reason: {rejectionReason}
              </p>
            )}
            <p className="text-[#f5f0e8]/40 text-sm tracking-wide mb-8">
              Please contact our support team for assistance.
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 border border-[#c1aa77]/30 text-[#f5f0e8]/60 text-xs tracking-[4px] uppercase hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all duration-300"
            >
              Back to Home
            </button>
          </>
        );

      default:
        return (
          <>
            <p className="text-[10px] tracking-[5px] uppercase text-[#f5f0e8]/40 mb-3">
              Unknown
            </p>
            <h1 className="font-cormorant text-4xl text-[var(--cream)] font-light mb-3">
              Something Went Wrong
            </h1>
            <p className="text-[#f5f0e8]/40 text-sm tracking-wide mb-8">
              We could not retrieve your verification status. Please try again
              later.
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 border border-[#c1aa77]/30 text-[#f5f0e8]/60 text-xs tracking-[4px] uppercase hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all duration-300"
            >
              Back to Home
            </button>
          </>
        );
    }
  };

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
        <div className="min-h-screen flex items-center justify-center px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-[#1a1a1a]/60 border border-[#c1aa77]/20 p-12 max-w-md w-full text-center"
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default KycResultPage;
