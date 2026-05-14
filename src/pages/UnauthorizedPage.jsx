import { useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen text-white flex items-center justify-center relative bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(13,13,13,0.9), rgba(13,13,13,1)), url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1800&q=80')`,
      }}
    >
      <div className="text-center px-6">
        <p className="text-[10px] tracking-[5px] uppercase text-red-400 mb-4">
          Access Denied
        </p>
        <h1
          className="text-6xl font-light text-white mb-4"
          style={{ fontFamily: "Cormorant Garamond, serif" }}
        >
          Unauthorized
        </h1>
        <p className="text-white/40 text-sm mb-10 tracking-wide">
          You don't have permission to access this page.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 border border-white/10 text-white/50 text-xs tracking-[3px] uppercase hover:border-[var(--gold)]/40 hover:text-[var(--gold)] transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-[var(--gold)] text-[var(--dark)] text-xs tracking-[3px] uppercase font-medium hover:bg-[var(--gold-light)] transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
