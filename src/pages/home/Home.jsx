import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar";
import { getProperties } from "../../services/propertyService";

const PROPERTY_TYPES = [
  { value: "", label: "All Types" },
  { value: "Apartment", label: "Apartment" },
  { value: "Villa", label: "Villa" },
];

const LISTING_INTENTS = [
  { value: "", label: "All" },
  { value: "ForSale", label: "Sale" },
  { value: "ForRent", label: "Rent" },
];

const PAGE_SIZE = 10;

function Home() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    SearchTerm: "",
    City: "",
    State: "",
    Type: "",
    Intent: "",
    MinPrice: "",
    MaxPrice: "",
    Bedrooms: "",
    Bathrooms: "",
  });

  const fetchProperties = async (page = 1) => {
    setLoading(true);
    try {
      const params = { PageNumber: page, PageSize: PAGE_SIZE };
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "") params[key] = value;
      });

      const result = await getProperties(params);
      if (result.succeeded) {
        setProperties(result.data || []);
        setTotalPages(result.totalPages || 1);
        setCurrentPage(result.currentPage || 1);
      } else {
        toast.error(result.message || "Failed to load properties.");
      }
    } catch (err) {
      const message = err.response?.data?.message;
      toast.error(message || "Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchProperties(1);
  };

  const handlePageChange = (page) => {
    fetchProperties(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[var(--dark)] font-jost">
      <Navbar />

      {/* HERO */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1800&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d]/30 via-[#0d0d0d]/55 to-[#0d0d0d]/90" />

        <div className="relative z-10 max-w-3xl px-6">
          <p className="text-[11px] tracking-[5px] uppercase text-[var(--gold)] mb-5">
            Exclusive Real Estate
          </p>
          <h1 className="font-cormorant text-6xl md:text-8xl font-light leading-tight text-[var(--cream)] mb-6">
            Find Your{" "}
            <em className="italic text-[var(--gold-light)]">Perfect</em>
            <br />
            Property
          </h1>
          <p className="text-sm text-[#f5f0e8]/50 mb-10 tracking-wide">
            Discover premium properties curated for the discerning buyer
          </p>

          {/* Hero Search Bar */}
          <div className="flex bg-[#0d0d0d]/80 backdrop-blur-md border border-[#c1aa77]/25 w-full max-w-2xl mx-auto">
            <input
              type="text"
              name="SearchTerm"
              value={filters.SearchTerm}
              onChange={handleFilterChange}
              placeholder="Search by city, title or keyword..."
              className="flex-1 bg-transparent px-7 py-5 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/30 outline-none"
            />
            <div className="w-px bg-[#c1aa77]/20 my-3" />
            <select
              name="Type"
              value={filters.Type}
              onChange={handleFilterChange}
              className="bg-transparent px-5 py-5 text-[#f5f0e8]/50 text-sm outline-none cursor-pointer min-w-[120px]"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-[#1a1a1a]">
                  {t.label}
                </option>
              ))}
            </select>
            <div className="w-px bg-[#c1aa77]/20 my-3" />
            <select
              name="Intent"
              value={filters.Intent}
              onChange={handleFilterChange}
              className="bg-transparent px-5 py-5 text-[#f5f0e8]/50 text-sm outline-none cursor-pointer min-w-[120px]"
            >
              {LISTING_INTENTS.map((i) => (
                <option key={i.value} value={i.value} className="bg-[#1a1a1a]">
                  {i.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              className="bg-[var(--gold)] hover:bg-[var(--gold-light)] px-8 text-[var(--dark)] text-xs tracking-[3px] uppercase font-medium transition-all duration-300"
            >
              Search
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#f5f0e8]/30">
          <div className="w-px h-12 bg-gradient-to-b from-[var(--gold)] to-transparent animate-pulse" />
          <span className="text-[9px] tracking-[3px] uppercase">Scroll</span>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="flex gap-0 px-16 py-16">
        {/* Filters Panel */}
        <aside className="w-72 shrink-0 pr-10 border-r border-[#c1aa77]/10">
          <div className="sticky top-24">
            <h2 className="font-cormorant text-2xl text-[var(--cream)] mb-8 pb-4 border-b border-[#c1aa77]/15">
              Refine Search
            </h2>

            {[
              {
                label: "City",
                name: "City",
                placeholder: "e.g. Cairo",
                type: "text",
              },
              {
                label: "State",
                name: "State",
                placeholder: "e.g. Giza",
                type: "text",
              },
              {
                label: "Min Price",
                name: "MinPrice",
                placeholder: "0",
                type: "number",
              },
              {
                label: "Max Price",
                name: "MaxPrice",
                placeholder: "Any",
                type: "number",
              },
              {
                label: "Bedrooms",
                name: "Bedrooms",
                placeholder: "Any",
                type: "number",
              },
              {
                label: "Bathrooms",
                name: "Bathrooms",
                placeholder: "Any",
                type: "number",
              },
            ].map(({ label, name, placeholder, type }) => (
              <div key={name} className="mb-7">
                <label className="block text-[10px] tracking-[3px] uppercase text-[#c1aa77]/60 mb-2">
                  {label}
                </label>
                <input
                  type={type}
                  name={name}
                  value={filters[name]}
                  onChange={handleFilterChange}
                  placeholder={placeholder}
                  className="w-full bg-transparent border-b border-[#c1aa77]/20 pb-2 text-[var(--cream)] text-sm placeholder-[#f5f0e8]/20 outline-none focus:border-[var(--gold)] transition-colors duration-300"
                />
              </div>
            ))}

            <button
              onClick={handleSearch}
              className="w-full border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--dark)] py-3 text-xs tracking-[3px] uppercase transition-all duration-300 mt-2"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setFilters({
                  SearchTerm: "",
                  City: "",
                  State: "",
                  Type: "",
                  Intent: "",
                  MinPrice: "",
                  MaxPrice: "",
                  Bedrooms: "",
                  Bathrooms: "",
                });
                fetchProperties(1);
              }}
              className="w-full border border-[#f5f0e8]/10 text-[#f5f0e8]/30 hover:border-[#f5f0e8]/30 hover:text-[#f5f0e8]/60 py-3 text-xs tracking-[3px] uppercase transition-all duration-300 mt-3"
            >
              Clear All
            </button>
          </div>
        </aside>

        {/* Properties List */}
        <div className="flex-1 pl-10">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-[#f5f0e8]/30 tracking-widest uppercase text-xs">
                Loading...
              </p>
            </div>
          ) : properties.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-[#f5f0e8]/30 tracking-widest uppercase text-xs">
                No properties found.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-px">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => navigate(`/property/${property.id}`)}
                    className="group relative flex bg-[var(--dark-2)] border border-[#c1aa77]/8 hover:bg-[#1f1f1f] cursor-pointer transition-all duration-300 overflow-hidden"
                  >
                    {/* Gold left accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--gold)] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom" />

                    {/* Image */}
                    <div className="w-56 h-40 shrink-0 overflow-hidden">
                      {property.primaryImageUrl ? (
                        <img
                          src={property.primaryImageUrl}
                          alt={property.title}
                          className="w-full h-full object-cover brightness-85 group-hover:brightness-100 group-hover:scale-105 transition-all duration-400"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-[#f5f0e8]/20 text-xs tracking-widest uppercase">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-7 flex flex-col justify-between flex-1">
                      <div>
                        <p className="text-[10px] tracking-[3px] uppercase text-[var(--gold)] mb-2">
                          {property.city}
                          {property.state ? ` · ${property.state}` : ""}
                        </p>
                        <h3 className="font-cormorant text-2xl text-[var(--cream)] mb-1">
                          {property.title}
                        </h3>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-6 text-xs text-[#f5f0e8]/40 tracking-wide">
                          {property.bedrooms != null && (
                            <span>🛏 {property.bedrooms} Beds</span>
                          )}
                          {property.bathrooms != null && (
                            <span>🚿 {property.bathrooms} Baths</span>
                          )}
                          <span>📐 {property.areaSize} m²</span>
                        </div>
                        {(property.minNights > 1 ||
                          property.discountPercentagePerWeek ||
                          property.discountPercentagePerMonth) && (
                          <div className="flex gap-4 text-xs text-[#c1aa77]/50 tracking-wide">
                            {property.minNights > 1 && (
                              <span>🌙 Min {property.minNights} nights</span>
                            )}
                            {property.discountPercentagePerWeek && (
                              <span>
                                🏷 {property.discountPercentagePerWeek}% weekly
                              </span>
                            )}
                            {property.discountPercentagePerMonth && (
                              <span>
                                🏷 {property.discountPercentagePerMonth}%
                                monthly
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col items-end justify-end p-7 shrink-0">
                      <p className="text-[10px] tracking-[2px] uppercase text-[#c1aa77]/50 mb-1">
                        Starting from
                      </p>
                      <p className="font-cormorant text-2xl text-[var(--gold)]">
                        {property.priceAmount} {property.currency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 text-xs tracking-widest transition-all duration-300 ${
                          page === currentPage
                            ? "bg-[var(--gold)] text-[var(--dark)]"
                            : "border border-[#c1aa77]/20 text-[#f5f0e8]/40 hover:border-[var(--gold)] hover:text-[var(--gold)]"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
