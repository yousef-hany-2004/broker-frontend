import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { forgotPassword } from "../../services/authService";
import { forgetPasswordSchema } from "../../validation/forgetPasswordSchema";

function ForgetPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgetPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await forgotPassword(data.email);
      if (result.succeeded) {
        setSent(true);
        toast.success("Reset link sent! Check your email.");
      } else {
        toast.error(result.message || "Something went wrong.");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Something went wrong, please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-jost bg-[var(--dark)]">
      <div className="relative flex-1 hidden md:flex flex-col justify-end p-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--dark)] via-[#0d0d0d]/50 to-[#0d0d0d]/20" />
        <div className="absolute top-12 left-16 z-10 font-cormorant text-2xl tracking-[4px] uppercase text-[var(--gold)]">
          Aqua<span className="text-[var(--cream)]">Keys</span>
        </div>
        <div className="relative z-10">
          <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-4">
            Account Recovery
          </p>
          <h1 className="font-cormorant text-5xl font-light leading-tight text-[var(--cream)] mb-4">
            Reset Your
            <br />
            <em className="italic text-[var(--gold-light)]">Password</em>
          </h1>
          <p className="text-sm text-[#f5f0e8]/50 font-light leading-relaxed max-w-sm">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[480px] shrink-0 bg-[var(--dark-2)] flex flex-col justify-center px-14 py-16 border-l border-[#c1aa77]/10">
        <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
          Forgot Password
        </p>
        <h2 className="font-cormorant text-4xl font-normal text-[var(--cream)] mb-2">
          Reset Password
        </h2>
        <p className="text-sm text-[#f5f0e8]/40 mb-12 tracking-wide">
          We'll send a reset link to your email
        </p>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border border-[var(--gold)]/30 flex items-center justify-center mx-auto mb-6">
              <span className="text-[var(--gold)] text-2xl">✓</span>
            </div>
            <p className="text-[var(--cream)] mb-2 font-cormorant text-2xl">
              Check Your Email
            </p>
            <p className="text-[#f5f0e8]/40 text-sm mb-8">
              Reset link sent to your inbox.
            </p>
            <Link
              to="/login"
              className="text-[var(--gold)] text-xs tracking-[3px] uppercase hover:text-[var(--gold-light)] transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-10">
              <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
                Email Address
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder="your@gmail.com"
                className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 ${
                  errors.email
                    ? "border-red-400"
                    : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                }`}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-2 tracking-wide">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300 mb-6 ${
                loading
                  ? "bg-[#c1aa77]/50 cursor-not-allowed"
                  : "bg-[var(--gold)] hover:bg-[var(--gold-light)]"
              }`}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-xs tracking-[2px] uppercase text-[#c1aa77]/50 hover:text-[var(--gold)] transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgetPassword;
