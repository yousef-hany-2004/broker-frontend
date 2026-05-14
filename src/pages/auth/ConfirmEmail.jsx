import { useSearchParams, useNavigate } from "react-router-dom";

function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = searchParams.get("status"); // "success" or anything else
  const message = searchParams.get("message") || "Something went wrong.";

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
            Email Verification
          </p>
          <h1 className="font-cormorant text-5xl font-light leading-tight text-[var(--cream)] mb-4">
            Almost
            <br />
            <em className="italic text-[var(--gold-light)]">There</em>
          </h1>
          <p className="text-sm text-[#f5f0e8]/50 font-light leading-relaxed max-w-sm">
            Confirming your email address to complete your registration.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[480px] shrink-0 bg-[var(--dark-2)] flex flex-col justify-center px-14 py-16 border-l border-[#c1aa77]/10 text-center">
        {status === "success" ? (
          <>
            <div className="w-16 h-16 rounded-full border border-[var(--gold)]/30 flex items-center justify-center mx-auto mb-8">
              <span className="text-[var(--gold)] text-2xl">✓</span>
            </div>
            <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
              Success
            </p>
            <h2 className="font-cormorant text-4xl font-normal text-[var(--cream)] mb-4">
              Email Confirmed!
            </h2>
            <p className="text-[#f5f0e8]/40 text-sm mb-12 tracking-wide">
              Your email has been confirmed successfully!
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300"
            >
              Sign In
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full border border-red-400/30 flex items-center justify-center mx-auto mb-8">
              <span className="text-red-400 text-2xl">✕</span>
            </div>
            <p className="text-[10px] tracking-[5px] uppercase text-red-400 mb-3">
              Failed
            </p>
            <h2 className="font-cormorant text-4xl font-normal text-[var(--cream)] mb-4">
              Confirmation Failed
            </h2>
            <p className="text-[#f5f0e8]/40 text-sm mb-12 tracking-wide">
              {message}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ConfirmEmail;
