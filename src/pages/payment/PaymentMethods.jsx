import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar";
import { ArrowLeft, CreditCard } from "lucide-react";
import {
  getPaymentMethods,
  addPaymentMethod,
} from "../../services/paymentService";
import { getMyProfile } from "../../services/profileService";
import { paymentMethodBillingSchema } from "../../validation/paymentMethodBillingSchema";
import egyptLocations from "../../data/egyptLocations";

function PaymentMethods() {
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [governorates, setGovernorates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [loadingStates, setLoadingStates] = useState(true);
  const [savedCity, setSavedCity] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentMethodBillingSchema),
    mode: "onSubmit",
    defaultValues: {
      currency: "EGP",
      paymentMethod: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      city: "",
      country: "EG",
      street: "",
      zipCode: "",
    },
  });

  // Fetch governorates
  useEffect(() => {
    const fetchGovernorates = async () => {
      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/states",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: "Egypt" }),
          },
        );
        const data = await res.json();
        if (!data.error && data.data?.states) {
          setGovernorates(data.data.states.map((s) => s.name));
        } else {
          setGovernorates(egyptLocations.map((g) => g.state));
        }
      } catch {
        setGovernorates(egyptLocations.map((g) => g.state));
      } finally {
        setLoadingStates(false);
      }
    };
    fetchGovernorates();
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      return;
    }
    const fetchCities = async () => {
      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/state/cities",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: "Egypt", state: selectedState }),
          },
        );
        const data = await res.json();
        let loadedCities = [];
        if (!data.error && data.data?.length) {
          loadedCities = data.data;
        } else {
          const found = egyptLocations.find((g) => g.state === selectedState);
          loadedCities = found ? found.cities : [];
        }
        setCities(loadedCities);
        // if we have a saved city and it exists in the loaded cities — pre-select it
        if (savedCity && loadedCities.includes(savedCity)) {
          setValue("city", savedCity);
        }
      } catch {
        const found = egyptLocations.find((g) => g.state === selectedState);
        const loadedCities = found ? found.cities : [];
        setCities(loadedCities);
        if (savedCity && loadedCities.includes(savedCity)) {
          setValue("city", savedCity);
        }
      }
    };
    fetchCities();
  }, [selectedState, savedCity, setValue]);

  // Fetch cards and profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cardsResult, profileResult] = await Promise.all([
          getPaymentMethods(),
          getMyProfile(),
        ]);

        if (cardsResult.succeeded) setCards(cardsResult.data || []);

        if (profileResult.succeeded) {
          const p = profileResult.data;
          reset({
            currency: "EGP",
            paymentMethod: "",
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            email: p.email || "",
            phoneNumber: p.phoneNumber?.replace(/^\+20/, "0") || "",
            city: p.city || "",
            country: "EG",
            street: p.street || "",
            zipCode: p.zipCode || "",
          });
          if (p.city) setSavedCity(p.city);
          if (p.state) setSelectedState(p.state);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCards(false);
      }
    };
    fetchData();
  }, [reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const result = await addPaymentMethod({
        currency: data.currency,
        idempotencyKey: crypto.randomUUID(),
        paymentMethod: Number(data.paymentMethod),
        billingData: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          city: data.city,
          country: data.country,
          street: data.street,
          zipCode: data.zipCode,
        },
      });
      if (result.succeeded) {
        const checkoutUrl = result.data?.checkoutUrl;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          toast.success("Payment method added successfully!");
          const updated = await getPaymentMethods();
          if (updated.succeeded) setCards(updated.data || []);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCards) {
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
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d]/85 via-[#0d0d0d]/90 to-[#0d0d0d]/95" />

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
            Payment Methods
          </h1>
          <p className="text-[#f5f0e8]/40 text-sm tracking-wide mb-12">
            Manage your saved payment cards.
          </p>

          {/* Add New Card */}
          <div className="bg-[#1a1a1a]/60 border border-[#c1aa77]/20 p-8 mb-12">
            <h2 className="font-cormorant text-2xl text-[var(--cream)] mb-6">
              Add New Card
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="flex flex-col gap-6">
                {/* Card Type */}
                <div>
                  <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                    Card Type
                  </label>
                  <select
                    {...register("paymentMethod")}
                    className={`w-full bg-transparent border-b pb-2 text-[var(--cream)] text-sm outline-none transition-colors duration-300 ${
                      errors.paymentMethod
                        ? "border-red-500/60"
                        : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                    }`}
                  >
                    <option value="" className="bg-[#1a1a1a]">
                      Select card type
                    </option>
                    <option value="1" className="bg-[#1a1a1a]">
                      Credit Card
                    </option>
                    <option value="2" className="bg-[#1a1a1a]" disabled>
                      Mobile Wallet (Coming Soon)
                    </option>
                  </select>
                  {errors.paymentMethod && (
                    <p className="text-red-400 text-[10px] mt-1">
                      {errors.paymentMethod.message}
                    </p>
                  )}
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                    Currency
                  </label>
                  <select
                    {...register("currency")}
                    className="w-full bg-transparent border-b border-[#c1aa77]/20 pb-2 text-[var(--cream)] text-sm outline-none focus:border-[var(--gold)] transition-colors duration-300"
                  >
                    <option value="EGP" className="bg-[#1a1a1a]">
                      EGP — Egyptian Pound
                    </option>
                  </select>
                </div>

                {/* Billing Information label */}
                <p className="text-[10px] tracking-[3px] uppercase text-[#c1aa77]/40 -mb-2">
                  Billing Information
                </p>

                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      {...register("firstName")}
                      className={`w-full bg-transparent border-b pb-2 text-[var(--cream)] text-sm outline-none transition-colors duration-300 ${
                        errors.firstName
                          ? "border-red-500/60"
                          : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-red-400 text-[10px] mt-1">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      {...register("lastName")}
                      className={`w-full bg-transparent border-b pb-2 text-[var(--cream)] text-sm outline-none transition-colors duration-300 ${
                        errors.lastName
                          ? "border-red-500/60"
                          : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-red-400 text-[10px] mt-1">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      {...register("email")}
                      className={`w-full bg-transparent border-b pb-2 text-[var(--cream)] text-sm outline-none transition-colors duration-300 ${
                        errors.email
                          ? "border-red-500/60"
                          : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-400 text-[10px] mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      {...register("phoneNumber")}
                      className={`w-full bg-transparent border-b pb-2 text-[var(--cream)] text-sm outline-none transition-colors duration-300 ${
                        errors.phoneNumber
                          ? "border-red-500/60"
                          : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                      }`}
                    />
                    {errors.phoneNumber && (
                      <p className="text-red-400 text-[10px] mt-1">
                        {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                      Country
                    </label>
                    <select
                      {...register("country")}
                      className="w-full bg-transparent border-b border-[#c1aa77]/20 pb-2 text-[var(--cream)] text-sm outline-none"
                    >
                      <option value="EG" className="bg-[#1a1a1a]">
                        Egypt
                      </option>
                    </select>
                  </div>

                  {/* Governorate */}
                  <div>
                    <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                      Governorate
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value);
                        setCities([]);
                        setValue("city", "");
                      }}
                      disabled={loadingStates}
                      className="w-full bg-transparent border-b border-[#c1aa77]/20 pb-2 text-[var(--cream)] text-sm outline-none focus:border-[var(--gold)] transition-colors duration-300"
                    >
                      <option value="" className="bg-[#1a1a1a]">
                        {loadingStates ? "Loading..." : "Select Governorate"}
                      </option>
                      {governorates.map((gov) => (
                        <option key={gov} value={gov} className="bg-[#1a1a1a]">
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                      City
                    </label>
                    <select
                      {...register("city")}
                      className={`w-full bg-transparent border-b pb-2 text-[var(--cream)] text-sm outline-none transition-colors duration-300 ${
                        errors.city
                          ? "border-red-500/60"
                          : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                      }`}
                    >
                      <option value="" className="bg-[#1a1a1a]">
                        {!selectedState
                          ? "Select Governorate first"
                          : cities.length === 0
                            ? "Loading..."
                            : "Select City"}
                      </option>
                      {cities.map((city) => (
                        <option
                          key={city}
                          value={city}
                          className="bg-[#1a1a1a]"
                        >
                          {city}
                        </option>
                      ))}
                    </select>
                    {errors.city && (
                      <p className="text-red-400 text-[10px] mt-1">
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  {/* Street */}
                  <div>
                    <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                      Street
                    </label>
                    <input
                      type="text"
                      {...register("street")}
                      className={`w-full bg-transparent border-b pb-2 text-[var(--cream)] text-sm outline-none transition-colors duration-300 ${
                        errors.street
                          ? "border-red-500/60"
                          : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                      }`}
                    />
                    {errors.street && (
                      <p className="text-red-400 text-[10px] mt-1">
                        {errors.street.message}
                      </p>
                    )}
                  </div>

                  {/* Zip Code */}
                  <div>
                    <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      {...register("zipCode")}
                      className={`w-full bg-transparent border-b pb-2 text-[var(--cream)] text-sm outline-none transition-colors duration-300 ${
                        errors.zipCode
                          ? "border-red-500/60"
                          : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
                      }`}
                    />
                    {errors.zipCode && (
                      <p className="text-red-400 text-[10px] mt-1">
                        {errors.zipCode.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Warning Note */}
                <div className="border border-[#c1aa77]/20 p-4 bg-[#c1aa77]/5">
                  <p className="text-[#f5f0e8]/50 text-xs tracking-wide leading-relaxed">
                    You will be redirected to Paymob to enter your card details.
                    A temporary charge of{" "}
                    <span className="text-[var(--gold)]">1 EGP</span> will be
                    made to verify your card — it will be refunded
                    automatically.
                  </p>
                  <p className="text-[#f5f0e8]/50 text-xs tracking-wide leading-relaxed mt-2">
                    ⚠️ Make sure to check the{" "}
                    <span className="text-[var(--gold)]">"Save Card"</span>{" "}
                    checkbox on the Paymob page, otherwise your card will not be
                    saved.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--dark)] px-8 py-3 text-xs tracking-[3px] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
                >
                  {submitting ? "Redirecting..." : "Proceed to Add Card"}
                </button>
              </div>
            </form>
          </div>

          {/* Saved Cards */}
          <div>
            <h2 className="font-cormorant text-2xl text-[var(--cream)] mb-6">
              Saved Cards
            </h2>

            {cards.length === 0 ? (
              <p className="text-[#f5f0e8]/30 text-sm tracking-wide">
                No payment cards saved yet.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between bg-[#1a1a1a]/60 border border-[#c1aa77]/20 p-6 hover:border-[#c1aa77]/40 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 border border-[#c1aa77]/20 flex items-center justify-center">
                        <CreditCard
                          size={18}
                          className="text-[var(--gold)]/60"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--cream)] text-sm font-medium capitalize">
                            {card.cardBrand || "Card"}
                          </span>
                          <span className="text-[#f5f0e8]/40 text-sm">
                            •••• {card.last4Digits}
                          </span>
                          {card.isDefault && (
                            <span className="text-[9px] tracking-[3px] uppercase bg-[var(--gold)] text-[var(--dark)] px-2 py-0.5">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[#f5f0e8]/30 text-xs tracking-wide">
                          Expires {card.expiryDate}
                        </p>
                      </div>
                    </div>
                    <p className="text-[#f5f0e8]/20 text-xs tracking-wide">
                      {new Date(card.createdAt).toLocaleDateString()}
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

export default PaymentMethods;
