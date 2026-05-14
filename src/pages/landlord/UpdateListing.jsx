import { useState, useEffect } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { createListingSchema } from "../../validation/createListingSchema";
import {
  getManagePropertyDetails,
  updatePropertyListing,
} from "../../services/propertyService";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const stages = ["Basic Info", "Location", "Pricing"];

const variants = {
  enter: (direction) => ({ x: direction === 1 ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction === 1 ? -100 : 100, opacity: 0 }),
};

function UpdateListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const methods = useForm({
    resolver: zodResolver(createListingSchema),
    mode: "onBlur",
    shouldUnregister: false,
    defaultValues: {
      title: "",
      description: "",
      type: "",
      intent: "",
      areaSize: "",
      bedrooms: "",
      bathrooms: "",
      latitude: null,
      longitude: null,
      country: "",
      state: "",
      city: "",
      formattedAddress: "",
      unitOrBuildingNumber: "",
      priceAmount: "",
      priceCurrency: "EGP",
      priceUnit: "",
    },
  });

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const result = await getManagePropertyDetails(id);
        if (result.succeeded) {
          const d = result.data;
          methods.reset({
            title: d.title || "",
            description: d.description || "",
            type: String(d.type) || "",
            intent: String(d.intent) || "",
            areaSize: String(d.areaSize) || "",
            bedrooms: d.bedrooms ? String(d.bedrooms) : "",
            bathrooms: d.bathrooms ? String(d.bathrooms) : "",
            latitude: d.location?.latitude || null,
            longitude: d.location?.longitude || null,
            country: d.location?.country || "",
            state: d.location?.state || "",
            city: d.location?.city || "",
            formattedAddress: d.location?.formattedAddress || "",
            unitOrBuildingNumber: d.location?.unitOrBuildingNumber || "",
            priceAmount: String(d.price?.amount) || "",
            priceCurrency: d.price?.currency || "EGP",
            priceUnit: String(d.price?.unit) || "",
          });
        } else {
          toast.error(result.message || "Failed to load listing.");
          navigate("/dashboard");
        }
      } catch {
        toast.error("Something went wrong.");
        navigate("/dashboard");
      } finally {
        setPageLoading(false);
      }
    };
    fetchListing();
  }, [id, methods, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        type: Number(data.type),
        intent: Number(data.intent),
        areaSize: Number(data.areaSize),
        bedrooms: data.bedrooms ? Number(data.bedrooms) : null,
        bathrooms: data.bathrooms ? Number(data.bathrooms) : null,
        priceAmount: Number(data.priceAmount),
        priceCurrency: data.priceCurrency,
        priceUnit: Number(data.priceUnit),
        latitude: data.latitude,
        longitude: data.longitude,
        country: data.country,
        state: data.state,
        city: data.city,
        formattedAddress: data.formattedAddress,
        unitOrBuildingNumber: data.unitOrBuildingNumber || "",
      };
      const result = await updatePropertyListing(id, payload);
      if (result.succeeded) {
        toast.success("Listing updated successfully!");
        navigate(`/manage-listing/${id}`);
      } else {
        toast.error(result.message || "Failed to update listing.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
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
            "url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d]/80 via-[#0d0d0d]/70 to-[#0d0d0d]/90" />

      <div className="relative z-10">
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-32">
          {/* Stage Indicator */}
          <div className="w-full max-w-2xl mb-10">
            <div className="flex items-center gap-0">
              {stages.map((label, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 flex items-center justify-center border text-xs tracking-widest transition-all duration-300 ${
                        i < step - 1
                          ? "bg-[var(--gold)] border-[var(--gold)] text-[var(--dark)]"
                          : i === step - 1
                            ? "border-[var(--gold)] text-[var(--gold)]"
                            : "border-[#c1aa77]/20 text-[#f5f0e8]/20"
                      }`}
                    >
                      {i < step - 1 ? "✓" : i + 1}
                    </div>
                    <span
                      className={`text-[9px] tracking-[2px] uppercase mt-2 ${
                        i <= step - 1
                          ? "text-[var(--gold)]"
                          : "text-[#f5f0e8]/20"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < stages.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-3 mb-5 transition-all duration-300 ${
                        i < step - 1 ? "bg-[var(--gold)]" : "bg-[#c1aa77]/20"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card */}
          <div
            className="w-full max-w-2xl bg-[#1a1a1a] border border-[#c1aa77]/10 relative"
            style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}
          >
            <div className="absolute top-0 left-0 w-14 h-14 border-t border-l border-[#c1aa77] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-14 h-14 border-b border-r border-[#c1aa77] pointer-events-none" />

            <div className="px-14 py-12">
              <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={step}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                    >
                      {step === 1 && (
                        <StepBasicInfo
                          next={() => {
                            setDirection(1);
                            setStep(2);
                          }}
                        />
                      )}
                      {step === 2 && (
                        <StepLocation
                          next={() => {
                            setDirection(1);
                            setStep(3);
                          }}
                          back={() => {
                            setDirection(-1);
                            setStep(1);
                          }}
                        />
                      )}
                      {step === 3 && (
                        <StepPricing
                          back={() => {
                            setDirection(-1);
                            setStep(2);
                          }}
                          loading={loading}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </form>
              </FormProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Step Components ----

function StepBasicInfo({ next }) {
  const {
    register,
    formState: { errors },
    trigger,
  } = useFormContext();

  const handleNext = async () => {
    const valid = await trigger([
      "title",
      "description",
      "type",
      "intent",
      "areaSize",
      "bedrooms",
      "bathrooms",
    ]);
    if (valid) next();
  };

  return (
    <>
      <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
        Step 1 of 3
      </p>
      <h2 className="font-cormorant text-4xl font-normal text-[var(--cream)] mb-10">
        Basic Information
      </h2>

      <div className="mb-8">
        <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
          Title
        </label>
        <input
          type="text"
          {...register("title")}
          placeholder="e.g. Luxury Apartment in Zamalek"
          className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 ${
            errors.title
              ? "border-red-400"
              : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
          }`}
        />
        {errors.title && (
          <p className="text-red-400 text-xs mt-2">{errors.title.message}</p>
        )}
      </div>

      <div className="mb-8">
        <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
          Description
        </label>
        <textarea
          {...register("description")}
          placeholder="Describe the property..."
          rows={3}
          className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 resize-none ${
            errors.description
              ? "border-red-400"
              : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
          }`}
        />
        {errors.description && (
          <p className="text-red-400 text-xs mt-2">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
            Property Type
          </label>
          <select
            {...register("type")}
            className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm outline-none transition-colors duration-300 cursor-pointer ${
              errors.type
                ? "border-red-400"
                : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
            }`}
          >
            <option value="" className="bg-[#1a1a1a]">
              Select type
            </option>
            <option value="1" className="bg-[#1a1a1a]">
              Apartment
            </option>
            <option value="2" className="bg-[#1a1a1a]">
              Villa
            </option>
          </select>
          {errors.type && (
            <p className="text-red-400 text-xs mt-2">{errors.type.message}</p>
          )}
        </div>
        <div>
          <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
            Listing Intent
          </label>
          <select
            {...register("intent")}
            className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm outline-none transition-colors duration-300 cursor-pointer ${
              errors.intent
                ? "border-red-400"
                : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
            }`}
          >
            <option value="" className="bg-[#1a1a1a]">
              Select intent
            </option>
            <option value="1" className="bg-[#1a1a1a]">
              For Sale
            </option>
            <option value="2" className="bg-[#1a1a1a]">
              For Rent
            </option>
          </select>
          {errors.intent && (
            <p className="text-red-400 text-xs mt-2">{errors.intent.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 mb-10">
        {[
          {
            name: "areaSize",
            label: "Area Size (m²)",
            placeholder: "e.g. 120",
          },
          { name: "bedrooms", label: "Bedrooms", placeholder: "e.g. 3" },
          { name: "bathrooms", label: "Bathrooms", placeholder: "e.g. 2" },
        ].map(({ name, label, placeholder }) => (
          <div key={name}>
            <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
              {label}
            </label>
            <input
              type="number"
              {...register(name)}
              placeholder={placeholder}
              className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 ${
                errors[name]
                  ? "border-red-400"
                  : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
              }`}
            />
            {errors[name] && (
              <p className="text-red-400 text-xs mt-2">
                {errors[name].message}
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="w-full py-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300"
      >
        Next Step
      </button>
    </>
  );
}

function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function StepLocation({ next, back }) {
  const {
    register,
    formState: { errors },
    trigger,
    setValue,
    watch,
  } = useFormContext();
  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const [geocoding, setGeocoding] = useState(false);

  const handleMapClick = async (lat, lng) => {
    setValue("latitude", lat, { shouldValidate: true });
    setValue("longitude", lng, { shouldValidate: true });
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      );
      const data = await res.json();
      const addr = data.address;
      setValue("country", addr.country || "", { shouldValidate: true });
      setValue("state", addr.state || addr.county || "", {
        shouldValidate: true,
      });
      setValue("city", addr.city || addr.town || addr.village || "", {
        shouldValidate: true,
      });
      setValue("formattedAddress", data.display_name || "", {
        shouldValidate: true,
      });
    } catch {
      toast.error("Could not fetch address. Please fill in manually.");
    } finally {
      setGeocoding(false);
    }
  };

  const handleNext = async () => {
    const valid = await trigger([
      "latitude",
      "longitude",
      "country",
      "state",
      "city",
      "formattedAddress",
    ]);
    if (valid) next();
  };

  return (
    <>
      <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
        Step 2 of 3
      </p>
      <h2 className="font-cormorant text-4xl font-normal text-[var(--cream)] mb-4">
        Location
      </h2>
      <p className="text-sm text-[#f5f0e8]/40 mb-8 tracking-wide">
        Click on the map to update the property location
      </p>

      <div className="w-full h-64 mb-2 border border-[#c1aa77]/20">
        <MapContainer
          center={latitude && longitude ? [latitude, longitude] : [26.8, 30.8]}
          zoom={latitude && longitude ? 12 : 6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <LocationPicker onPick={handleMapClick} />
          {latitude && longitude && <Marker position={[latitude, longitude]} />}
        </MapContainer>
      </div>

      {errors.latitude && (
        <p className="text-red-400 text-xs mb-6">{errors.latitude.message}</p>
      )}
      {geocoding && (
        <p className="text-[#f5f0e8]/30 text-xs tracking-widest uppercase mb-6">
          Fetching address...
        </p>
      )}

      <div className="grid grid-cols-2 gap-8 mb-8 mt-6">
        {[
          { name: "country", label: "Country" },
          { name: "state", label: "State / Governorate" },
          { name: "city", label: "City" },
        ].map(({ name, label }) => (
          <div key={name}>
            <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
              {label}
            </label>
            <input
              type="text"
              disabled
              {...register(name)}
              className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm outline-none cursor-not-allowed ${
                errors[name] ? "border-red-400" : "border-[#c1aa77]/20"
              }`}
            />
            {errors[name] && (
              <p className="text-red-400 text-xs mt-2">
                {errors[name].message}
              </p>
            )}
          </div>
        ))}
        <div>
          <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
            Unit / Building No.{" "}
            <span className="text-[#f5f0e8]/20">(optional)</span>
          </label>
          <input
            type="text"
            {...register("unitOrBuildingNumber")}
            placeholder="e.g. Apt 4B"
            className="w-full bg-transparent border-0 border-b border-[#c1aa77]/20 pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none focus:border-[var(--gold)] transition-colors duration-300"
          />
        </div>
      </div>

      <div className="mb-10">
        <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
          Full Address
        </label>
        <input
          type="text"
          disabled
          {...register("formattedAddress")}
          className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm outline-none cursor-not-allowed ${
            errors.formattedAddress ? "border-red-400" : "border-[#c1aa77]/20"
          }`}
        />
        {errors.formattedAddress && (
          <p className="text-red-400 text-xs mt-2">
            {errors.formattedAddress.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={back}
          className="flex-1 py-4 border border-[#c1aa77]/30 hover:border-[var(--gold)] text-[var(--gold)] text-xs tracking-[4px] uppercase transition-all duration-300"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300"
        >
          Next Step
        </button>
      </div>
    </>
  );
}

function StepPricing({ back, loading }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
        Step 3 of 3
      </p>
      <h2 className="font-cormorant text-4xl font-normal text-[var(--cream)] mb-10">
        Pricing
      </h2>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
            Price
          </label>
          <input
            type="number"
            {...register("priceAmount")}
            placeholder="e.g. 2500000"
            className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 ${
              errors.priceAmount
                ? "border-red-400"
                : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
            }`}
          />
          {errors.priceAmount && (
            <p className="text-red-400 text-xs mt-2">
              {errors.priceAmount.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
            Currency
          </label>
          <select
            {...register("priceCurrency")}
            className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm outline-none transition-colors duration-300 cursor-pointer ${
              errors.priceCurrency
                ? "border-red-400"
                : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
            }`}
          >
            <option value="EGP" className="bg-[#1a1a1a]">
              EGP — Egyptian Pound
            </option>
            <option value="USD" className="bg-[#1a1a1a]">
              USD — US Dollar
            </option>
            <option value="EUR" className="bg-[#1a1a1a]">
              EUR — Euro
            </option>
          </select>
          {errors.priceCurrency && (
            <p className="text-red-400 text-xs mt-2">
              {errors.priceCurrency.message}
            </p>
          )}
        </div>
      </div>

      <div className="mb-10">
        <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
          Price Unit
        </label>
        <select
          {...register("priceUnit")}
          className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm outline-none transition-colors duration-300 cursor-pointer ${
            errors.priceUnit
              ? "border-red-400"
              : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
          }`}
        >
          <option value="" className="bg-[#1a1a1a]">
            Select unit
          </option>
          <option value="1" className="bg-[#1a1a1a]">
            Total
          </option>
          <option value="2" className="bg-[#1a1a1a]">
            Per Night
          </option>
          <option value="3" className="bg-[#1a1a1a]">
            Per Week
          </option>
          <option value="4" className="bg-[#1a1a1a]">
            Per Month
          </option>
          <option value="5" className="bg-[#1a1a1a]">
            Per Square Meter
          </option>
        </select>
        {errors.priceUnit && (
          <p className="text-red-400 text-xs mt-2">
            {errors.priceUnit.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={back}
          className="flex-1 py-4 border border-[#c1aa77]/30 hover:border-[var(--gold)] text-[var(--gold)] text-xs tracking-[4px] uppercase transition-all duration-300"
        >
          Back
        </button>
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
      </div>
    </>
  );
}

export default UpdateListing;
