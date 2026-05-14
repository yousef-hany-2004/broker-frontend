import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar";
import { getUserProfile } from "../../services/profileService";

function UserProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await getUserProfile(userId);
        if (result.succeeded) {
          setProfile(result.data);
        } else {
          toast.error(result.message || "Failed to load profile.");
        }
      } catch (err) {
        toast.error(
          err.response?.data?.message ||
            "Something went wrong, please try again.",
        );
      } finally {
        setPageLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const bgImage =
    "url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1800&q=80')";

  if (pageLoading) {
    return (
      <div className="min-h-screen font-jost">
        <div
          className="fixed inset-0 bg-cover bg-center -z-10"
          style={{
            backgroundImage: bgImage,
            filter: "blur(2px)",
            transform: "scale(1.05)",
          }}
        />
        <div className="fixed inset-0 bg-[#0d0d0d]/50 -z-10" />
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <p className="text-[#f5f0e8]/30 tracking-widest uppercase text-xs">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen font-jost">
        <div
          className="fixed inset-0 bg-cover bg-center -z-10"
          style={{
            backgroundImage: bgImage,
            filter: "blur(2px)",
            transform: "scale(1.05)",
          }}
        />
        <div className="fixed inset-0 bg-[#0d0d0d]/50 -z-10" />
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <p className="text-[#f5f0e8]/30 tracking-widest uppercase text-xs">
            User not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-jost relative">
      <div
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{
          backgroundImage: bgImage,
          filter: "blur(2px)",
          transform: "scale(1.05)",
        }}
      />
      <div className="fixed inset-0 bg-[#0d0d0d]/50 -z-10" />

      <Navbar />

      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-32">
        <div
          className="w-full max-w-lg bg-[#1a1a1a] border border-[#c1aa77]/10 relative"
          style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}
        >
          <div className="absolute top-0 left-0 w-14 h-14 border-t border-l border-[#c1aa77] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-14 h-14 border-b border-r border-[#c1aa77] pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center px-14 pt-12 pb-8 border-b border-[#c1aa77]/8">
            <div className="w-20 h-20 rounded-full border border-[#c1aa77]/30 flex items-center justify-center bg-[#c1aa77]/5 mb-5">
              <span className="font-cormorant text-3xl text-[var(--gold)]">
                {profile.firstName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-2">
              Profile
            </p>
            <h1 className="font-cormorant text-4xl font-light text-[var(--cream)] mb-4">
              {profile.firstName} {profile.lastName}
            </h1>
            <div className="flex gap-2">
              {profile.roles?.map((role) => (
                <span
                  key={role}
                  className="text-[10px] tracking-[2px] uppercase border border-[#c1aa77]/30 text-[var(--gold)] px-3 py-1"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="px-14 py-10">
            <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-6">
              Location
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/50 mb-2">
                  Country
                </span>
                <p className="text-[var(--cream)] text-sm pb-3 border-b border-[#c1aa77]/10">
                  {profile.country || "—"}
                </p>
              </div>
              <div>
                <span className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/50 mb-2">
                  City
                </span>
                <p className="text-[var(--cream)] text-sm pb-3 border-b border-[#c1aa77]/10">
                  {profile.city || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
