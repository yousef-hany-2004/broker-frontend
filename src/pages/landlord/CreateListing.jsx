import { useState, useEffect } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { createListingSchema } from "../../validation/createListingSchema";
import {
  createPropertyListing,
  uploadPropertyMedia,
  publishPropertyListing,
  getManagePropertyDetails,
} from "../../services/propertyService";
// import useAuth from "../../hooks/useAuth";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getPayoutMethods } from "../../services/payoutService";
import { rentalRulesSchema } from "../../validation/rentalRulesSchema";
import { configureRentalRules } from "../../services/propertyService";

// ---- Leaflet icon fix ----
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const stages = ["Details", "Photos", "Rules", "Publish"];

const variants = {
  enter: (direction) => ({ x: direction === 1 ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction === 1 ? -100 : 100, opacity: 0 }),
};

// ---- Main Component ----
function CreateListing() {
  // const { user } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState(0);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [listingId, setListingId] = useState(null);
  const [images, setImages] = useState([]);
  const [hasPayoutMethod, setHasPayoutMethod] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const checkPayout = async () => {
      try {
        const result = await getPayoutMethods();
        if (result.succeeded) {
          setHasPayoutMethod(result.data.length > 0);
        } else {
          setHasPayoutMethod(false);
        }
      } catch {
        setHasPayoutMethod(false);
      }
    };
    checkPayout();
  }, []);

  const methods = useForm({
    resolver: zodResolver(createListingSchema, rentalRulesSchema),
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
      checkInTime: "",
      checkOutTime: "",
      minNights: "",
      weeklyDiscount: "",
      monthlyDiscount: "",
    },
  });

  const onCreateDraft = async (data) => {
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
      const result = await createPropertyListing(payload);
      if (result.succeeded) {
        setListingId(result.data.propertyId);
        setStage(1);
      } else {
        toast.error(result.message || "Failed to create listing.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onUploadImages = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }
    const hasPrimary = images.some((img) => img.isPrimary);
    if (!hasPrimary) {
      toast.error("Please select a primary image.");
      return;
    }
    setLoading(true);
    try {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const formData = new FormData();
        formData.append("PropertyListingId", listingId);
        formData.append("File", img.file);
        formData.append("Type", 1);
        formData.append("IsPrimary", img.isPrimary);
        formData.append("SortOrder", i + 1);
        try {
          await uploadPropertyMedia(listingId, formData);
        } catch {
          // continue uploading remaining images
        }
        if (i < images.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      // Poll /manage until all images have a final status
      setLoading(false);
      setProcessing(true);
      let mediaList = [];
      while (true) {
        const manageResult = await getManagePropertyDetails(listingId);
        if (!manageResult.succeeded) {
          toast.error("Could not verify image status.");
          return;
        }
        mediaList = manageResult.data.media || [];
        const FINAL_STATUSES = ["Completed", "Rejected", "Accepted"];
        const stillPending = mediaList.some(
          (m) => !FINAL_STATUSES.includes(m.processingStatus),
        );
        if (!stillPending) break;
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }
      setProcessing(false);

      // Map results back to images by sortOrder
      setImages((prev) =>
        prev.map((img, i) => {
          const media = mediaList.find((m) => m.sortOrder === i + 1);
          if (!media)
            return {
              ...img,
              status: "rejected",
              rejectionReason: "Not found.",
            };
          const accepted =
            media.processingStatus === "Completed" ||
            media.processingStatus === "Accepted";
          return {
            ...img,
            status: accepted ? "accepted" : "rejected",
            rejectionReason: accepted
              ? null
              : media.rejectionReason || "Image was rejected.",
          };
        }),
      );

      const acceptedCount = mediaList.filter(
        (m) =>
          m.processingStatus === "Completed" ||
          m.processingStatus === "Accepted",
      ).length;
      if (acceptedCount === 0) {
        toast.error(
          "All images were rejected. Please upload different images.",
        );
        return;
      }
      toast.success(`${acceptedCount} image(s) accepted.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const onContinueToRentalRules = () => {
    setStage(2);
  };

  const onSaveRentalRules = async (data) => {
    setLoading(true);
    try {
      const payload = {
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        minNights: data.minNights,
        weeklyDiscount: data.weeklyDiscount || null,
        monthlyDiscount: data.monthlyDiscount || null,
      };
      const result = await configureRentalRules(listingId, payload);
      if (result.succeeded) {
        toast.success("Rental rules saved.");
        setStage(3);
      } else {
        toast.error(result.message || "Failed to save rental rules.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onPublish = async () => {
    setLoading(true);
    try {
      const result = await publishPropertyListing(listingId);
      if (result.succeeded) {
        setStage(4);
      } else {
        toast.error(result.message || "Failed to publish.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setStage(0);
    setStep(1);
    setDirection(1);
    setListingId(null);
    setImages([]);
    setProcessing(false);
    methods.reset();
  };

  return (
    <div className="min-h-screen font-jost relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80')",
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d]/80 via-[#0d0d0d]/70 to-[#0d0d0d]/90" />

      {/* Content */}
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
                        i < stage
                          ? "bg-[var(--gold)] border-[var(--gold)] text-[var(--dark)]"
                          : i === stage
                            ? "border-[var(--gold)] text-[var(--gold)]"
                            : "border-[#c1aa77]/20 text-[#f5f0e8]/20"
                      }`}
                    >
                      {i < stage ? "✓" : i + 1}
                    </div>
                    <span
                      className={`text-[9px] tracking-[2px] uppercase mt-2 ${
                        i <= stage ? "text-[var(--gold)]" : "text-[#f5f0e8]/20"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < stages.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-3 mb-5 transition-all duration-300 ${
                        i < stage ? "bg-[var(--gold)]" : "bg-[#c1aa77]/20"
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
              {hasPayoutMethod === null ? (
                <p className="text-[#f5f0e8]/30 tracking-widest uppercase text-xs text-center py-8">
                  Loading...
                </p>
              ) : !hasPayoutMethod ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 border border-[#c1aa77]/30 flex items-center justify-center mx-auto mb-6">
                    <span className="text-[var(--gold)] text-xl">!</span>
                  </div>
                  <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
                    Action Required
                  </p>
                  <h2 className="font-cormorant text-3xl font-light text-[var(--cream)] mb-4">
                    No Payout Method Found
                  </h2>
                  <p className="text-sm text-[#f5f0e8]/40 tracking-wide mb-8">
                    You need to add a payout method before you can list a
                    property.
                  </p>
                  <a
                    href="/payout-methods"
                    className="inline-block px-10 py-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300"
                  >
                    Add Payout Method →
                  </a>
                </div>
              ) : (
                <>
                  {stage === 0 && (
                    <FormProvider {...methods}>
                      <form
                        onSubmit={methods.handleSubmit(onCreateDraft)}
                        noValidate
                      >
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
                  )}
                  {stage === 1 && (
                    <StageUploadImages
                      images={images}
                      setImages={setImages}
                      onNext={onUploadImages}
                      onContinue={onContinueToRentalRules}
                      loading={loading}
                      processing={processing}
                    />
                  )}
                  {stage === 2 && (
                    <StageRentalRules
                      onNext={onSaveRentalRules}
                      onBack={() => setStage(1)}
                      loading={loading}
                      listingId={listingId}
                    />
                  )}
                  {stage === 3 && (
                    <StagePublish onPublish={onPublish} loading={loading} />
                  )}
                  {stage === 4 && (
                    <StageSuccess navigate={navigate} onReset={onReset} />
                  )}
                </>
              )}
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
          <p className="text-red-400 text-xs mt-2 tracking-wide">
            {errors.title.message}
          </p>
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
          <p className="text-red-400 text-xs mt-2 tracking-wide">
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
            <option value={1} className="bg-[#1a1a1a]">
              Apartment
            </option>
            <option value={2} className="bg-[#1a1a1a]">
              Villa
            </option>
          </select>
          {errors.type && (
            <p className="text-red-400 text-xs mt-2 tracking-wide">
              {errors.type.message}
            </p>
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
            <option value={1} className="bg-[#1a1a1a]">
              For Sale
            </option>
            <option value={2} className="bg-[#1a1a1a]">
              For Rent
            </option>
          </select>
          {errors.intent && (
            <p className="text-red-400 text-xs mt-2 tracking-wide">
              {errors.intent.message}
            </p>
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
              <p className="text-red-400 text-xs mt-2 tracking-wide">
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
        Click on the map to pin your property location
      </p>

      <div className="w-full h-64 mb-2 border border-[#c1aa77]/20">
        <MapContainer
          center={[26.8, 30.8]}
          zoom={6}
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
        <p className="text-red-400 text-xs mb-6 tracking-wide">
          {errors.latitude.message}
        </p>
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
              disabled={true}
              {...register(name)}
              className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 cursor-not-allowed ${
                errors[name]
                  ? "border-red-400"
                  : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
              }`}
            />
            {errors[name] && (
              <p className="text-red-400 text-xs mt-2 tracking-wide">
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
          disabled={true}
          {...register("formattedAddress")}
          className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 cursor-not-allowed ${
            errors.formattedAddress
              ? "border-red-400"
              : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
          }`}
        />
        {errors.formattedAddress && (
          <p className="text-red-400 text-xs mt-2 tracking-wide">
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
            <p className="text-red-400 text-xs mt-2 tracking-wide">
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
            <p className="text-red-400 text-xs mt-2 tracking-wide">
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
          <option value={1} className="bg-[#1a1a1a]">
            Total
          </option>
          <option value={2} className="bg-[#1a1a1a]">
            Per Night
          </option>
          <option value={3} className="bg-[#1a1a1a]">
            Per Week
          </option>
          <option value={4} className="bg-[#1a1a1a]">
            Per Month
          </option>
          <option value={5} className="bg-[#1a1a1a]">
            Per Square Meter
          </option>
        </select>
        {errors.priceUnit && (
          <p className="text-red-400 text-xs mt-2 tracking-wide">
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
          {loading ? "Creating..." : "Create Listing"}
        </button>
      </div>
    </>
  );
}

function StageUploadImages({
  images,
  setImages,
  onNext,
  onContinue,
  loading,
  processing,
}) {
  const MAX_SIZE = 5 * 1024 * 1024;
  const MAX_COUNT = 10;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.size > MAX_SIZE) {
        toast.error(`"${file.name}" exceeds 5MB limit.`);
        return;
      }
      const alreadyExists = images.some(
        (img) => img.file.name === file.name && img.file.size === file.size,
      );
      if (alreadyExists) {
        toast.error(`"${file.name}" is already added.`);
        return;
      }
      if (images.length >= MAX_COUNT) {
        toast.error("Maximum 10 images allowed.");
        return;
      }
      const preview = URL.createObjectURL(file);
      setImages((prev) => [
        ...prev,
        {
          file,
          preview,
          isPrimary: false,
          status: null,
          rejectionReason: null,
        },
      ]);
    });
    e.target.value = "";
  };

  const handleRemove = (index) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (prev[index].isPrimary && updated.length === 1) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const handleSetPrimary = (index) => {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isPrimary: i === index })),
    );
  };

  const uploaded = images.some((img) => img.status !== null);
  const hasAccepted = images.some((img) => img.status === "accepted");

  return (
    <>
      <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
        Stage 2
      </p>
      <h2 className="font-cormorant text-4xl font-normal text-[var(--cream)] mb-4">
        Upload Photos
      </h2>
      <p className="text-sm text-[#f5f0e8]/40 mb-8 tracking-wide">
        Upload up to 10 photos. At least one must be accepted. Max 5MB per
        image.
      </p>

      {!uploaded && !processing && (
        <>
          <label className="flex flex-col items-center justify-center w-full h-36 border border-dashed border-[#c1aa77]/30 hover:border-[var(--gold)] cursor-pointer transition-colors duration-300 mb-6">
            <span className="text-[#f5f0e8]/30 text-xs tracking-[3px] uppercase mb-2">
              Click to select images
            </span>
            <span className="text-[#f5f0e8]/20 text-[10px] tracking-wide">
              PNG, JPG, WEBP — max 5MB each
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img.preview}
                    alt=""
                    className={`w-full h-24 object-cover border-2 transition-all duration-300 ${
                      img.isPrimary
                        ? "border-[var(--gold)]"
                        : "border-transparent"
                    }`}
                  />
                  {img.isPrimary && (
                    <span className="absolute top-1 left-1 text-[8px] tracking-[2px] uppercase bg-[var(--gold)] text-[var(--dark)] px-2 py-0.5">
                      Primary
                    </span>
                  )}
                  <div className="absolute inset-0 bg-[#0d0d0d]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(i)}
                        className="text-[8px] tracking-[2px] uppercase text-[var(--gold)] border border-[var(--gold)] px-2 py-1 hover:bg-[var(--gold)] hover:text-[var(--dark)] transition-all duration-300"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(i)}
                      className="text-[8px] tracking-[2px] uppercase text-red-400 border border-red-400 px-2 py-1 hover:bg-red-400 hover:text-[var(--dark)] transition-all duration-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {uploaded && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img
                src={img.preview}
                alt=""
                className={`w-full h-24 object-cover border-2 transition-all duration-300 ${
                  img.status === "accepted"
                    ? img.isPrimary
                      ? "border-[var(--gold)]"
                      : "border-green-500"
                    : "border-red-400"
                }`}
              />
              <span
                className={`absolute top-1 left-1 text-[8px] tracking-[2px] uppercase px-2 py-0.5 ${
                  img.status === "accepted"
                    ? "bg-green-500 text-white"
                    : "bg-red-400 text-white"
                }`}
              >
                {img.status === "accepted"
                  ? img.isPrimary
                    ? "Primary"
                    : "Accepted"
                  : "Rejected"}
              </span>
              {img.status === "rejected" && img.rejectionReason && (
                <p className="text-red-400 text-[9px] mt-1 tracking-wide leading-tight">
                  {img.rejectionReason}
                </p>
              )}
              {img.status === "accepted" && !img.isPrimary && hasAccepted && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(i)}
                  className="mt-1 w-full text-[8px] tracking-[2px] uppercase text-[var(--gold)] border border-[var(--gold)]/30 py-0.5 hover:border-[var(--gold)] transition-all duration-300"
                >
                  Set Primary
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        {!uploaded ? (
          <button
            type="button"
            onClick={onNext}
            disabled={loading || processing || images.length === 0}
            className={`w-full py-4 text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300 ${
              loading || processing || images.length === 0
                ? "bg-[#c1aa77]/50 cursor-not-allowed"
                : "bg-[var(--gold)] hover:bg-[var(--gold-light)]"
            }`}
          >
            {loading
              ? "Uploading..."
              : processing
                ? "Processing..."
                : "Upload Images"}
          </button>
        ) : hasAccepted ? (
          <button
            type="button"
            onClick={onContinue}
            className="w-full py-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300"
          >
            Continue to Rental Rules
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setImages([])}
            className="w-full py-4 border border-[#c1aa77]/30 hover:border-[var(--gold)] text-[var(--gold)] text-xs tracking-[4px] uppercase transition-all duration-300"
          >
            Try Again — Upload Different Images
          </button>
        )}
      </div>
    </>
  );
}

function StageRentalRules({ onNext, onBack, loading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    // setValue,
  } = useForm({
    resolver: zodResolver(rentalRulesSchema),
    mode: "onSubmit",
    defaultValues: {
      checkInTime: "14:00",
      checkOutTime: "11:00",
      minNights: 1,
      weeklyDiscount: null,
      monthlyDiscount: null,
    },
  });

  const onSubmit = async (data) => {
    onNext(data);
  };

  return (
    <>
      <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
        Stage 3
      </p>
      <h2 className="font-cormorant text-4xl font-normal text-[var(--cream)] mb-4">
        Rental Rules
      </h2>
      <p className="text-sm text-[#f5f0e8]/40 mb-10 tracking-wide">
        Set check-in/out times, minimum stay, and optional discounts.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Check-in / Check-out */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
              Check-in Time
            </label>
            <input
              type="time"
              {...register("checkInTime")}
              className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm outline-none transition-colors duration-300 ${
                errors.checkInTime
                  ? "border-red-400"
                  : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
              }`}
            />
            {errors.checkInTime && (
              <p className="text-red-400 text-xs mt-2 tracking-wide">
                {errors.checkInTime.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
              Check-out Time
            </label>
            <input
              type="time"
              {...register("checkOutTime")}
              className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm outline-none transition-colors duration-300 ${
                errors.checkOutTime
                  ? "border-red-400"
                  : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
              }`}
            />
            {errors.checkOutTime && (
              <p className="text-red-400 text-xs mt-2 tracking-wide">
                {errors.checkOutTime.message}
              </p>
            )}
          </div>
        </div>

        {/* Min Nights */}
        <div className="mb-8">
          <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
            Minimum Nights
          </label>
          <input
            type="number"
            min={1}
            {...register("minNights", { valueAsNumber: true })}
            placeholder="e.g. 2"
            className={`w-full bg-transparent border-0 border-b pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none transition-colors duration-300 ${
              errors.minNights
                ? "border-red-400"
                : "border-[#c1aa77]/20 focus:border-[var(--gold)]"
            }`}
          />
          {errors.minNights && (
            <p className="text-red-400 text-xs mt-2 tracking-wide">
              {errors.minNights.message}
            </p>
          )}
        </div>

        {/* Discounts */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
              Weekly Discount{" "}
              <span className="text-[#f5f0e8]/20">(optional %)</span>
            </label>
            <input
              type="number"
              min={0}
              max={100}
              {...register("weeklyDiscount", { valueAsNumber: true })}
              placeholder="e.g. 10"
              className="w-full bg-transparent border-0 border-b border-[#c1aa77]/20 pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none focus:border-[var(--gold)] transition-colors duration-300"
            />
            {errors.weeklyDiscount && (
              <p className="text-red-400 text-xs mt-2 tracking-wide">
                {errors.weeklyDiscount.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/70 mb-2">
              Monthly Discount{" "}
              <span className="text-[#f5f0e8]/20">(optional %)</span>
            </label>
            <input
              type="number"
              min={0}
              max={100}
              {...register("monthlyDiscount", { valueAsNumber: true })}
              placeholder="e.g. 15"
              className="w-full bg-transparent border-0 border-b border-[#c1aa77]/20 pb-3 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none focus:border-[var(--gold)] transition-colors duration-300"
            />
            {errors.monthlyDiscount && (
              <p className="text-red-400 text-xs mt-2 tracking-wide">
                {errors.monthlyDiscount.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
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
            {loading ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </form>
    </>
  );
}

function StagePublish({ onPublish, loading }) {
  return (
    <>
      <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
        Stage 4
      </p>
      <h2 className="font-cormorant text-4xl font-normal text-[var(--cream)] mb-4">
        Publish Listing
      </h2>
      <p className="text-sm text-[#f5f0e8]/40 mb-10 tracking-wide">
        Your listing is ready. Once published it will appear in search results.
      </p>
      <div className="border border-[#c1aa77]/10 p-6 mb-10">
        <p className="text-[10px] tracking-[3px] uppercase text-[#c1aa77]/50 mb-3">
          Before you publish
        </p>
        <ul className="text-sm text-[#f5f0e8]/40 tracking-wide leading-8">
          <li>✓ Listing details saved</li>
          <li>✓ Photos uploaded and reviewed</li>
          <li>✓ Rental rules configured</li>
          <li>→ Publishing will make your listing visible to all users</li>
        </ul>
      </div>
      <button
        type="button"
        onClick={onPublish}
        disabled={loading}
        className={`w-full py-4 text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300 ${
          loading
            ? "bg-[#c1aa77]/50 cursor-not-allowed"
            : "bg-[var(--gold)] hover:bg-[var(--gold-light)]"
        }`}
      >
        {loading ? "Publishing..." : "Publish Listing"}
      </button>
    </>
  );
}

function StageSuccess({ navigate, onReset }) {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 rounded-full border border-[var(--gold)]/30 flex items-center justify-center mx-auto mb-8">
        <span className="text-[var(--gold)] text-2xl">✓</span>
      </div>
      <p className="text-[10px] tracking-[5px] uppercase text-[var(--gold)] mb-3">
        Success
      </p>
      <h2 className="font-cormorant text-4xl font-normal text-[var(--cream)] mb-4">
        Listing Published!
      </h2>
      <p className="text-[#f5f0e8]/40 text-sm mb-12 tracking-wide">
        Your property is now live and visible to all users.
      </p>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex-1 py-4 border border-[#c1aa77]/30 hover:border-[var(--gold)] text-[var(--gold)] text-xs tracking-[4px] uppercase transition-all duration-300"
        >
          Go to Home
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex-1 py-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-xs tracking-[4px] uppercase font-medium transition-all duration-300"
        >
          Create Another
        </button>
      </div>
    </div>
  );
}

export default CreateListing;
