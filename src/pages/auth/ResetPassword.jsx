import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { resetPasswordSchema } from "../../validation/resetPasswordSchema";
import { resetPassword } from "../../services/authService";

function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await resetPassword({
        email,
        token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      if (result.succeeded) {
        toast.success("Password reset successfully!");
        navigate("/login");
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
            Create New
            <br />
            <em className="italic text-[var(--gold-light)]">Password</em>
          </h1>
          <p className="text-sm text-[#f5f0e8]/50 font-light leading-relaxed max-w-sm">
            Choose a strong password to secure your account.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[480px] shrink-0 bg-[var(--dark-2)] flex flex-col justify-center px-14 py-16 border-l border-[#c1aa77]/10">
        <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
          New Password
        </p>
        <h2 className="font-cormorant text-4xl font-normal text-[var(--cream)] mb-2">
          Reset Password
        </h2>
        <p className="text-sm text-[#f5f0e8]/40 mb-12 tracking-wide">
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-8 relative">
            <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
              New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              {...register("newPassword")}
              placeholder="••••••••"
              className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 pr-8 ${
                !touchedFields.newPassword
                  ? "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                  : errors.newPassword
                    ? "border-red-400"
                    : "border-[var(--gold)]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-0 bottom-3 text-[#f5f0e8]/30 hover:text-[var(--gold)] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {errors.newPassword && (
              <p className="text-red-400 text-xs mt-2 tracking-wide">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="mb-10 relative">
            <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
              placeholder="••••••••"
              className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 pr-8 ${
                !touchedFields.confirmPassword
                  ? "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                  : errors.confirmPassword
                    ? "border-red-400"
                    : "border-[var(--gold)]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((p) => !p)}
              className="absolute right-0 bottom-3 text-[#f5f0e8]/30 hover:text-[var(--gold)] transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-2 tracking-wide">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300 ${
              loading
                ? "bg-[#c1aa77]/50 cursor-not-allowed"
                : "bg-[var(--gold)] hover:bg-[var(--gold-light)]"
            }`}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
