import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar";
import { ArrowLeft } from "lucide-react";
import {
  getPayoutMethods,
  requestPayoutOtp,
  resendPayoutOtp,
  addPayoutMethod,
} from "../../services/payoutService";
import vodafoneLogo from "../../assets/providers/Vodafone-Cash.png";
import orangeLogo from "../../assets/providers/Orange-Money.png";
import etisalatLogo from "../../assets/providers/Etisalat-Cash.png";
import weLogo from "../../assets/providers/We-Cash.png";
import { payoutMethodSchema } from "../../validation/payoutMethodSchema";

const PAYOUT_PROVIDERS = {
  1: { label: "Vodafone Cash", logo: vodafoneLogo },
  2: { label: "Orange Cash", logo: orangeLogo },
  3: { label: "Etisalat Cash", logo: etisalatLogo },
  4: { label: "WE Pay", logo: weLogo },
  VodafoneCash: { label: "Vodafone Cash", logo: vodafoneLogo },
  OrangeCash: { label: "Orange Cash", logo: orangeLogo },
  EtisalatCash: { label: "Etisalat Cash", logo: etisalatLogo },
  WEPay: { label: "WE Pay", logo: weLogo },
};

function PayoutMethods() {
  const navigate = useNavigate();

  const [methods, setMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [otpRequested, setOtpRequested] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [otpRequestId, setOtpRequestId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(payoutMethodSchema),
    mode: "onSubmit",
    defaultValues: {
      provider: "",
      accountIdentifier: "",
      accountHolderName: "",
      otpCode: "",
      isPrimary: false,
    },
  });

  const otpCode = watch("otpCode");

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const result = await getPayoutMethods();
        if (result.succeeded) setMethods(result.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMethods(false);
      }
    };
    fetchMethods();
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const result = await addPayoutMethod({
        provider: Number(data.provider),
        accountIdentifier: data.accountIdentifier,
        accountHolderName: data.accountHolderName,
        otpCode: data.otpCode,
        isPrimary: data.isPrimary,
      });
      if (result.succeeded) {
        toast.success("Payout method added successfully!");
        setOtpRequested(false);
        setOtpRequestId(null);
        reset();
        const updated = await getPayoutMethods();
        if (updated.succeeded) setMethods(updated.data || []);
      } else {
        toast.error(result.message || "Failed to add payout method.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMethods) {
    return (
      <div className="min-h-screen bg-[var(--dark)] flex items-center justify-center">
        <p className="text-[#f5f0e8]/30 tracking-widest uppercase text-xs">
          Loading...
        </p>
      </div>
    );
  }

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
        <div className="max-w-3xl mx-auto px-8 pt-28 pb-20">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors duration-300 text-xs tracking-[3px] uppercase"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          </div>

          <h1 className="font-cormorant text-5xl text-[var(--cream)] font-light mb-2">
            Payout Methods
          </h1>
          <p className="text-[#f5f0e8]/40 text-sm tracking-wide mb-12">
            Manage your payout accounts to receive payments.
          </p>

          {/* Add New Payout Method */}
          <div className="bg-[#1a1a1a]/60 border border-[#c1aa77]/20 p-8 mb-12">
            <h2 className="font-cormorant text-2xl text-[var(--cream)] mb-6">
              Add New Payout Method
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="flex flex-col gap-6">
                {/* Provider */}
                <div>
                  <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                    Provider
                  </label>
                  <select
                    {...register("provider")}
                    className={`w-full bg-transparent border-b pb-2 text-[var(--cream)] text-sm outline-none transition-colors duration-300 ${
                      errors.provider
                        ? "border-red-500/60"
                        : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                    }`}
                  >
                    <option value="" className="bg-[#1a1a1a]">
                      Select provider
                    </option>
                    {Object.entries(PAYOUT_PROVIDERS)
                      .filter(([key]) => !isNaN(Number(key)))
                      .map(([value, { label }]) => (
                        <option
                          key={value}
                          value={value}
                          className="bg-[#1a1a1a]"
                        >
                          {label}
                        </option>
                      ))}
                  </select>
                  {errors.provider && (
                    <p className="text-red-400 text-[10px] mt-1">
                      {errors.provider.message}
                    </p>
                  )}
                </div>

                {/* Account Identifier */}
                <div>
                  <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                    Account Identifier (Phone Number)
                  </label>
                  <input
                    type="text"
                    {...register("accountIdentifier")}
                    placeholder="e.g. 01012345678"
                    className={`w-full bg-transparent border-b pb-2 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 ${
                      errors.accountIdentifier
                        ? "border-red-500/60"
                        : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                    }`}
                  />
                  {errors.accountIdentifier && (
                    <p className="text-red-400 text-[10px] mt-1">
                      {errors.accountIdentifier.message}
                    </p>
                  )}
                </div>

                {/* Account Holder Name */}
                <div>
                  <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    {...register("accountHolderName")}
                    placeholder="e.g. Ahmed Mohamed"
                    className={`w-full bg-transparent border-b pb-2 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 ${
                      errors.accountHolderName
                        ? "border-red-500/60"
                        : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                    }`}
                  />
                  {errors.accountHolderName && (
                    <p className="text-red-400 text-[10px] mt-1">
                      {errors.accountHolderName.message}
                    </p>
                  )}
                </div>

                {/* OTP Code + Request OTP button */}
                <div>
                  <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                    OTP Code
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      {...register("otpCode")}
                      placeholder="Enter the code sent to your WhatsApp"
                      className={`flex-1 bg-transparent border-b pb-2 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 ${
                        errors.otpCode
                          ? "border-red-500/60"
                          : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        setRequestingOtp(true);
                        try {
                          const result = await requestPayoutOtp();
                          if (result.succeeded) {
                            toast.success("OTP sent to your WhatsApp!");
                            setOtpRequested(true);
                            setOtpRequestId(result.data?.requestId ?? null);
                          } else {
                            toast.error(
                              result.message || "Failed to send OTP.",
                            );
                          }
                        } catch (err) {
                          toast.error(
                            err.response?.data?.message ||
                              "Something went wrong.",
                          );
                        } finally {
                          setRequestingOtp(false);
                        }
                      }}
                      disabled={requestingOtp}
                      className="border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--dark)] px-4 py-2 text-[10px] tracking-[2px] uppercase transition-all duration-300 disabled:opacity-50 whitespace-nowrap"
                    >
                      {requestingOtp
                        ? "Sending..."
                        : otpRequested
                          ? "Resend OTP"
                          : "Request OTP"}
                    </button>
                  </div>
                  {errors.otpCode && (
                    <p className="text-red-400 text-[10px] mt-1">
                      {errors.otpCode.message}
                    </p>
                  )}
                  {otpRequested && (
                    <p className="text-[#f5f0e8]/30 text-xs mt-2">
                      Code sent to your WhatsApp. Didn't receive it?{" "}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const result = await resendPayoutOtp(otpRequestId);
                            if (result.succeeded) {
                              toast.success("OTP resent to your WhatsApp!");
                            } else {
                              toast.error(
                                result.message || "Failed to resend OTP.",
                              );
                            }
                          } catch (err) {
                            toast.error(
                              err.response?.data?.message ||
                                "Something went wrong.",
                            );
                          }
                        }}
                        className="text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors duration-300 underline"
                      >
                        Resend
                      </button>
                    </p>
                  )}
                </div>

                {/* Is Primary */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    {...register("isPrimary")}
                    className="accent-[var(--gold)] w-4 h-4"
                  />
                  <label
                    htmlFor="isPrimary"
                    className="text-[#f5f0e8]/60 text-sm cursor-pointer"
                  >
                    Set as primary payout method
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !otpCode}
                  className="border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--dark)] px-8 py-3 text-xs tracking-[3px] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
                >
                  {submitting ? "Saving..." : "Add Payout Method"}
                </button>
              </div>
            </form>
          </div>

          {/* Saved Payout Methods */}
          <div>
            <h2 className="font-cormorant text-2xl text-[var(--cream)] mb-6">
              Saved Payout Methods
            </h2>

            {methods.length === 0 ? (
              <p className="text-[#f5f0e8]/30 text-sm tracking-wide">
                No payout methods added yet.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {methods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between bg-[#1a1a1a]/60 border border-[#c1aa77]/20 p-6 hover:border-[#c1aa77]/40 transition-all duration-300"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <img
                          src={PAYOUT_PROVIDERS[method.provider]?.logo}
                          alt={PAYOUT_PROVIDERS[method.provider]?.label}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="text-[var(--cream)] text-sm font-medium">
                          {PAYOUT_PROVIDERS[method.provider]?.label ??
                            method.provider}
                        </span>
                        {method.isPrimary && (
                          <span className="text-[9px] tracking-[3px] uppercase bg-[var(--gold)] text-[var(--dark)] px-2 py-0.5">
                            Primary
                          </span>
                        )}
                        {method.isVerified && (
                          <span className="text-[9px] tracking-[3px] uppercase border border-green-500/40 text-green-400 px-2 py-0.5">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[#f5f0e8]/40 text-xs tracking-wide">
                        {method.accountIdentifier}
                      </p>
                      {method.accountHolderName && (
                        <p className="text-[#f5f0e8]/30 text-xs">
                          {method.accountHolderName}
                        </p>
                      )}
                    </div>
                    <p className="text-[#f5f0e8]/20 text-xs tracking-wide">
                      {new Date(method.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayoutMethods;
