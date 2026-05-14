import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema } from "../../validation/loginSchema";
import { loginUser } from "../../services/authService";
import useAuth from "../../hooks/useAuth";

function Login() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await loginUser(data);
      if (result.succeeded) {
        login(result.data);
      } else {
        toast.error(result.message || "Something went wrong.");
      }
    } catch (err) {
      const message = err.response?.data?.message;
      toast.error(message || "Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-jost bg-[var(--dark)]">
      {/* LEFT SIDE */}
      <div className="relative flex-1 hidden md:flex flex-col justify-end p-16 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80')",
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--dark)] via-[#0d0d0d]/50 to-[#0d0d0d]/20" />

        {/* Brand */}
        <div className="absolute top-12 left-16 z-10 font-cormorant text-2xl tracking-[4px] uppercase text-[var(--gold)]">
          Aqua<span className="text-[var(--cream)]">Keys</span>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10">
          <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-4">
            Welcome Back
          </p>
          <h1 className="font-cormorant text-5xl font-light leading-tight text-[var(--cream)] mb-4">
            Your Next
            <br />
            <em className="italic text-[var(--gold-light)]">Home Awaits</em>
          </h1>
          <p className="text-sm text-[#f5f0e8]/50 font-light leading-relaxed max-w-sm">
            Sign in to access exclusive property listings and continue your
            journey to finding the perfect home.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full md:w-[480px] shrink-0 bg-[var(--dark-2)] flex flex-col justify-center px-14 py-16 border-l border-[#c1aa77]/10">
        <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
          Sign In
        </p>
        <h2 className="font-cormorant text-4xl font-normal text-[var(--cream)] mb-2">
          Welcome Back
        </h2>
        <p className="text-sm text-[#f5f0e8]/40 mb-12 tracking-wide">
          Enter your credentials to continue
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div className="mb-8">
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

          {/* Password */}
          <div className="mb-4 relative">
            <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="••••••••"
              className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 pr-8 ${
                errors.password
                  ? "border-red-400"
                  : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-0 bottom-3 text-[#f5f0e8]/30 hover:text-[var(--gold)] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {errors.password && (
              <p className="text-red-400 text-xs mt-2 tracking-wide">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Forgot */}
          <div className="flex justify-end mb-10">
            <Link
              to="/forget-password"
              className="text-[11px] tracking-wide text-[#c1aa77]/50 hover:text-[var(--gold)] transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300 mb-6 ${
              loading
                ? "bg-[#c1aa77]/50 cursor-not-allowed"
                : "bg-[var(--gold)] hover:bg-[var(--gold-light)]"
            }`}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-[#c1aa77]/10" />
          <span className="text-[10px] tracking-[2px] uppercase text-[#f5f0e8]/20">
            or
          </span>
          <div className="flex-1 h-px bg-[#c1aa77]/10" />
        </div>

        {/* Links */}
        <div className="text-center text-xs text-[#f5f0e8]/30 tracking-wide leading-8">
          <p>
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors"
            >
              Register
            </Link>
          </p>
          <p>
            Didn't receive confirmation?{" "}
            <Link
              to="/resend-confirmation"
              className="text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors"
            >
              Resend Email
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
