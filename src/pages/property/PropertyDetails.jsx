import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getPropertyById } from "../../services/propertyService";
import Navbar from "../../components/layout/Navbar";
import { ArrowLeft, Camera, X, ChevronLeft, ChevronRight } from "lucide-react";

const PROPERTY_TYPE = {
  1: "Apartment",
  2: "Villa",
  Apartment: "Apartment",
  Villa: "Villa",
};
const LISTING_INTENT = {
  1: "For Sale",
  2: "For Rent",
  ForSale: "For Sale",
  ForRent: "For Rent",
};
const PRICING_UNIT = {
  1: "",
  2: "/ night",
  3: "/ week",
  4: "/ month",
  5: "/ m²",
  PerNight: "/ night",
  PerWeek: "/ week",
  PerMonth: "/ month",
  PerSquareMeter: "/ m²",
  None: "",
};

function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const result = await getPropertyById(id);
        if (result.succeeded) {
          if (result.data.isOwner) {
            navigate(`/manage-listing/${id}`, { replace: true });
            return;
          }
          setProperty(result.data);
        } else {
          setNotFound(true);
          toast.error(result.message || "Property not found.");
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error("Something went wrong.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      const total = property?.media?.length || 0;
      if (e.key === "ArrowRight")
        setLightboxIndex((prev) => (prev + 1) % total);
      if (e.key === "ArrowLeft")
        setLightboxIndex((prev) => (prev - 1 + total) % total);
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, property]);

  // Derived data (safe after property is loaded)
  const intentLabel =
    LISTING_INTENT[property?.intent] ??
    LISTING_INTENT[Number(property?.intent)] ??
    "";
  const typeLabel =
    PROPERTY_TYPE[property?.type] ??
    PROPERTY_TYPE[Number(property?.type)] ??
    "";
  const priceUnit =
    PRICING_UNIT[property?.price?.unit] ??
    PRICING_UNIT[Number(property?.price?.unit)] ??
    "";

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--dark)] flex items-center justify-center">
        <p className="text-[#f5f0e8]/30 tracking-widest uppercase text-xs">
          Loading...
        </p>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="min-h-screen bg-[var(--dark)] flex items-center justify-center">
        <p className="text-[#f5f0e8]/30 tracking-widest uppercase text-xs">
          Property not found.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--dark)] font-jost">
      <Navbar />

      <div className="max-w-7xl mx-auto px-8 pt-28 pb-20">
        {/* Back button + Intent badge */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors duration-300 text-lg tracking-[3px] uppercase"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <span className="bg-[var(--gold)] text-[var(--dark)] text-[9px] tracking-[4px] uppercase px-4 py-1.5 font-medium">
            {intentLabel}
          </span>
        </div>

        {/* Title + type + location */}
        <div className="mb-8">
          <h1 className="font-cormorant text-6xl md:text-6xl text-[var(--cream)] font-light leading-tight mb-3">
            {property.title}
          </h1>
          <p className="text-[13px] tracking-[4px] uppercase text-[var(--gold)]">
            {typeLabel} · {property.location?.city}
            {property.location?.state ? `, ${property.location.state}` : ""}
          </p>
        </div>
        {/* Image Grid */}
        {(() => {
          const sortedMedia = [...(property.media || [])].sort(
            (a, b) => a.sortOrder - b.sortOrder,
          );
          const mainImage = sortedMedia[0];
          const secondImage = sortedMedia[1];
          const thirdImage = sortedMedia[2];
          const totalImages = sortedMedia.length;

          return (
            <div className="flex gap-1 h-[480px] mb-10 cursor-pointer">
              {/* Main big image */}
              <div
                className="relative w-2/3 overflow-hidden"
                onClick={() => setLightboxIndex(0)}
              >
                {mainImage ? (
                  <img
                    src={mainImage.fileUrl}
                    alt={property.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-[#f5f0e8]/20 text-xs tracking-widest uppercase">
                    No Image
                  </div>
                )}

                {/* Camera icon + count — bottom right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(0);
                  }}
                  className="absolute bottom-4 right-4 flex items-center gap-2 bg-[#0d0d0d]/70 backdrop-blur-sm border border-[#c1aa77]/30 px-3 py-2 text-[var(--cream)] hover:border-[var(--gold)] transition-all duration-300"
                >
                  <Camera size={14} className="text-[var(--gold)]" />
                  <span className="text-xs tracking-widest">{totalImages}</span>
                </button>
              </div>

              {/* 2 stacked small images */}
              <div className="flex flex-col gap-1 w-1/3">
                <div
                  className="relative flex-1 overflow-hidden"
                  onClick={() => setLightboxIndex(1)}
                >
                  {secondImage ? (
                    <img
                      src={secondImage.fileUrl}
                      alt={property.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a]" />
                  )}
                </div>

                <div
                  className="relative flex-1 overflow-hidden"
                  onClick={() => setLightboxIndex(2)}
                >
                  {thirdImage ? (
                    <img
                      src={thirdImage.fileUrl}
                      alt={property.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a]" />
                  )}
                </div>
              </div>
            </div>
          );
        })()}
        {/* Lightbox */}
        {lightboxIndex !== null &&
          (() => {
            const sortedMedia = [...(property.media || [])].sort(
              (a, b) => a.sortOrder - b.sortOrder,
            );
            const total = sortedMedia.length;

            return (
              <div
                className="fixed inset-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-sm flex flex-col items-center justify-center"
                onClick={() => setLightboxIndex(null)}
              >
                {/* Close button */}
                <button
                  className="absolute top-6 right-6 text-[#f5f0e8]/50 hover:text-[var(--gold)] transition-colors duration-300"
                  onClick={() => setLightboxIndex(null)}
                >
                  <X size={24} />
                </button>

                {/* Counter */}
                <p className="absolute top-6 left-1/2 -translate-x-1/2 text-[#f5f0e8]/50 text-sm tracking-widest">
                  {lightboxIndex + 1}/{total}
                </p>

                {/* Main image */}
                <div
                  className="relative max-w-4xl w-full px-16"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={sortedMedia[lightboxIndex]?.fileUrl}
                    alt=""
                    className="w-full max-h-[65vh] object-contain"
                  />

                  {/* Left arrow */}
                  <button
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-[#f5f0e8]/40 hover:text-[var(--gold)] transition-colors duration-300 p-2"
                    onClick={() =>
                      setLightboxIndex((prev) => (prev - 1 + total) % total)
                    }
                  >
                    <ChevronLeft size={36} />
                  </button>

                  {/* Right arrow */}
                  <button
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[#f5f0e8]/40 hover:text-[var(--gold)] transition-colors duration-300 p-2"
                    onClick={() =>
                      setLightboxIndex((prev) => (prev + 1) % total)
                    }
                  >
                    <ChevronRight size={36} />
                  </button>
                </div>

                {/* Thumbnail strip */}
                <div
                  className="flex gap-2 mt-6 px-8 overflow-x-auto max-w-4xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {sortedMedia.map((img, i) => (
                    <img
                      key={i}
                      src={img.fileUrl}
                      alt=""
                      onClick={() => setLightboxIndex(i)}
                      className={`w-20 h-14 object-cover shrink-0 cursor-pointer transition-all duration-300 ${
                        i === lightboxIndex
                          ? "border-2 border-[var(--gold)] opacity-100"
                          : "opacity-40 hover:opacity-70"
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        {/* Price + Stats */}
        <div className="flex items-center gap-10 py-8 border-b border-[#c1aa77]/10 mb-10">
          {/* Price */}
          <p className="font-cormorant text-5xl text-[var(--cream)] font-semibold whitespace-nowrap">
            {property.price?.currency}{" "}
            {property.price?.amount?.toLocaleString()}
            <span className="text-2xl text-[#c1aa77]/60 ml-2 font-light">
              {priceUnit}
            </span>
          </p>

          {/* Divider */}
          <div className="w-px h-12 bg-[#c1aa77]/20" />

          {/* Stats */}
          <div className="flex items-center gap-8">
            {property.bedrooms != null && (
              <>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[var(--gold)]/60 text-xl">🛏</span>
                  <span className="text-[var(--cream)] text-sm">
                    {property.bedrooms} Bedrooms
                  </span>
                </div>
                <div className="w-px h-8 bg-[#c1aa77]/20" />
              </>
            )}
            {property.bathrooms != null && (
              <>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[var(--gold)]/60 text-xl">🚿</span>
                  <span className="text-[var(--cream)] text-sm">
                    {property.bathrooms} Bathrooms
                  </span>
                </div>
                <div className="w-px h-8 bg-[#c1aa77]/20" />
              </>
            )}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[var(--gold)]/60 text-xl">📐</span>
              <span className="text-[var(--cream)] text-sm">
                {property.areaSize} m²
              </span>
            </div>
          </div>
        </div>
        {/* Tab Headers */}
        <div className="flex border-b border-[#c1aa77]/10 mb-10">
          {["description", "location"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-[10px] tracking-[4px] uppercase transition-all duration-300 ${
                activeTab === tab
                  ? "text-[var(--gold)] border-b-2 border-[var(--gold)]"
                  : "text-[#f5f0e8]/30 hover:text-[#f5f0e8]/60"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* Tab Content */}
        {activeTab === "description" && (
          <div className="max-w-3xl">
            <p className="text-[#f5f0e8]/60 leading-relaxed text-sm tracking-wide">
              {property.description || "No description available."}
            </p>
          </div>
        )}
        {activeTab === "location" && (
          <div className="max-w-3xl">
            {/* Address card */}
            <div className="flex items-start gap-4 border border-[#c1aa77]/20 p-6 mb-6">
              <div className="text-[var(--gold)] mt-1">📍</div>
              <div className="flex-1">
                <p className="text-[var(--cream)] text-sm leading-relaxed">
                  {property.location?.formattedAddress}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${property.location?.latitude},${property.location?.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-[var(--gold)] text-[10px] tracking-[3px] uppercase hover:text-[var(--gold-light)] transition-colors duration-300"
                >
                  View on map →
                </a>
              </div>
            </div>
            {/* Google Maps embed */}
            <div className="w-full h-[400px] border border-[#c1aa77]/20">
              <iframe
                title="Property Location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${property.location?.latitude},${property.location?.longitude}&z=15&output=embed`}
              />
            </div>
          </div>
        )}
        {/* Action Buttons */}
        <div className="flex gap-4 mt-16 pt-10 border-t border-[#c1aa77]/10">
          {/* Rent Button */}
          <button
            onClick={() => {
              if (property.intent === 2 || property.intent === "ForRent") {
                navigate(`/book/${id}`);
              }
            }}
            disabled={property.intent !== 2 && property.intent !== "ForRent"}
            className={`flex-1 py-4 text-xs tracking-[4px] uppercase transition-all duration-300 ${
              property.intent === 2 || property.intent === "ForRent"
                ? "bg-[var(--gold)] text-[var(--dark)] hover:bg-[var(--gold-light)]"
                : "border border-[#c1aa77]/20 text-[#f5f0e8]/20 cursor-not-allowed"
            }`}
          >
            Rent This Property
          </button>

          {/* Buy Button */}
          <button
            disabled={property.intent !== 1 && property.intent !== "ForSale"}
            className={`flex-1 py-4 text-xs tracking-[4px] uppercase transition-all duration-300 ${
              property.intent === 1 || property.intent === "ForSale"
                ? "bg-[var(--gold)] text-[var(--dark)] hover:bg-[var(--gold-light)]"
                : "border border-[#c1aa77]/20 text-[#f5f0e8]/20 cursor-not-allowed"
            }`}
          >
            Buy This Property
          </button>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetails;
