import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import { getMyProfile, updateMyProfile } from "../../services/profileService";
import { changePassword } from "../../services/authService";
import { updateProfileSchema } from "../../validation/updateProfileSchema";
import { changePasswordSchema } from "../../validation/changePasswordSchema";
import useAuth from "../../hooks/useAuth";

function MyProfile() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const { logout, user } = useAuth();

  const profileForm = useForm({
    resolver: zodResolver(updateProfileSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await getMyProfile();
        if (result.succeeded) {
          profileForm.reset({
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            country: result.data.country,
            city: result.data.city,
            street: result.data.street || "",
            state: result.data.state,
            zipCode: result.data.zipCode,
          });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onProfileSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await updateMyProfile(data);
      if (result.succeeded) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
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

  const onPasswordSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await changePassword(data);
      if (result.succeeded) {
        toast.success("Password changed successfully!");
        passwordForm.reset();
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

  if (pageLoading) {
    return (
      <div className="min-h-screen font-jost">
        <div
          className="fixed inset-0 bg-cover bg-center -z-10"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1800&q=80')",
            filter: "blur(2px)",
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

  return (
    <div className="min-h-screen font-jost relative">
      <div
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1800&q=80')",
          filter: "blur(2px)",
        }}
      />
      <div className="fixed inset-0 bg-[#0d0d0d]/50 -z-10" />

      <Navbar />

      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-32">
        <div
          className="w-full max-w-2xl bg-[#1a1a1a] border border-[#c1aa77]/10 relative"
          style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}
        >
          {/* Gold corners */}
          <div className="absolute top-0 left-0 w-14 h-14 border-t border-l border-[#c1aa77] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-14 h-14 border-b border-r border-[#c1aa77] pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between px-14 pt-12 pb-8  border-[#c1aa77]/8">
            <div>
              <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
                Account
              </p>
              <h1 className="font-cormorant text-4xl font-light text-[var(--cream)]">
                {user?.firstName} {user?.lastName}
              </h1>
            </div>
            <div className="w-16 h-16 rounded-full border border-[#c1aa77]/30 flex items-center justify-center bg-[#c1aa77]/5">
              <span className="font-cormorant text-2xl text-[var(--gold)]">
                {user?.firstName?.charAt(0)}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-14 border-[#c1aa77]/8">
            {["profile", "password"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-5 mr-9 text-[10px] tracking-[3px] uppercase transition-colors duration-300 relative ${
                  activeTab === tab
                    ? "text-[var(--gold)]"
                    : "text-[#f5f0e8]/30 hover:text-[#f5f0e8]/60"
                }`}
              >
                {tab === "profile" ? "My Profile" : "Change Password"}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-[var(--gold)]" />
                )}
              </button>
            ))}
          </div>

          {/* Card Body */}
          <div className="px-14 py-10">
            {activeTab === "profile" ? (
              <ProfileTab
                profileForm={profileForm}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                loading={loading}
                onProfileSubmit={onProfileSubmit}
                logout={logout}
              />
            ) : (
              <PasswordTab
                passwordForm={passwordForm}
                loading={loading}
                onPasswordSubmit={onPasswordSubmit}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({
  profileForm,
  isEditing,
  setIsEditing,
  loading,
  onProfileSubmit,
  logout,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = profileForm;

  const fields = [
    { name: "firstName", label: "First Name" },
    { name: "lastName", label: "Last Name" },
    { name: "country", label: "Country" },
    { name: "city", label: "City" },
    { name: "street", label: "Street" },
    { name: "state", label: "State" },
    { name: "zipCode", label: "Zip Code" },
  ];

  return (
    <div>
      <form onSubmit={handleSubmit(onProfileSubmit)} noValidate>
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 mb-10">
          {fields.map(({ name, label }) => (
            <div key={name}>
              <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                {label}
              </label>
              <input
                type="text"
                {...register(name)}
                disabled={!isEditing}
                className={`w-full bg-transparent border-b pb-3 text-[var(--cream)] text-sm outline-none transition-colors duration-300 ${
                  !isEditing
                    ? "border-[#c1aa77]/50 text-[#f5f0e8]/50 cursor-default"
                    : errors[name]
                      ? "border-red-400"
                      : "border-[#c1aa77]/50 focus:border-[var(--gold)]"
                }`}
              />
              {errors[name] && (
                <p className="text-red-400 text-xs mt-2 tracking-wide">
                  {errors[name].message}
                </p>
              )}
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-4 text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300 ${
                loading
                  ? "bg-[#c1aa77]/50 cursor-not-allowed"
                  : "bg-[var(--gold)] hover:bg-[var(--gold-light)]"
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setIsEditing(false);
              }}
              className="flex-1 py-4 border border-[#c1aa77]/30 hover:border-[var(--gold)] text-[var(--gold)] text-xs tracking-[4px] uppercase transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        )}
      </form>

      {!isEditing && (
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex-1 py-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300"
          >
            Edit Profile
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex-1 py-4 border border-red-400/30 hover:border-red-400 text-red-400 text-xs tracking-[4px] uppercase transition-all duration-300"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function PasswordTab({ passwordForm, loading, onPasswordSubmit }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = passwordForm;

  const fields = [
    {
      name: "currentPassword",
      label: "Current Password",
      show: showCurrent,
      setShow: setShowCurrent,
    },
    {
      name: "newPassword",
      label: "New Password",
      show: showNew,
      setShow: setShowNew,
    },
    {
      name: "confirmNewPassword",
      label: "Confirm New Password",
      show: showConfirm,
      setShow: setShowConfirm,
    },
  ];

  return (
    <form onSubmit={handleSubmit(onPasswordSubmit)} noValidate>
      <div className="flex flex-col gap-8 mb-10">
        {fields.map(({ name, label, show, setShow }) => (
          <div key={name} className="relative">
            <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
              {label}
            </label>
            <input
              type={show ? "text" : "password"}
              {...register(name)}
              placeholder="••••••••"
              className={`w-full bg-transparent border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 pr-8 ${
                errors[name]
                  ? "border-red-400"
                  : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShow((prev) => !prev)}
              className="absolute right-0 bottom-3 text-[#f5f0e8]/30 hover:text-[var(--gold)] transition-colors"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {errors[name] && (
              <p className="text-red-400 text-xs mt-2 tracking-wide">
                {errors[name].message}
              </p>
            )}
          </div>
        ))}
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
        {loading ? "Changing..." : "Change Password"}
      </button>
    </form>
  );
}

export default MyProfile;
