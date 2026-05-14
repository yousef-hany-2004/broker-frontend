import { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Home, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar";
import useAuth from "../../hooks/useAuth";
import { getManageListings } from "../../services/propertyService";

const LISTING_STATUS = {
  1: {
    label: "Draft",
    color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  },
  2: {
    label: "Published",
    color: "text-green-400 bg-green-400/10 border-green-400/30",
  },
  3: {
    label: "Archived",
    color: "text-gray-400 bg-gray-400/10 border-gray-400/30",
  },
  4: {
    label: "Rejected",
    color: "text-red-400 bg-red-400/10 border-red-400/30",
  },
};

const LISTING_INTENT = {
  1: "For Sale",
  2: "For Rent",
  ForSale: "For Sale",
  ForRent: "For Rent",
};

const PROPERTY_TYPE = {
  1: "Apartment",
  2: "Villa",
  Apartment: "Apartment",
  Villa: "Villa",
};

const SkeletonCard = () => (
  <div className="bg-[var(--dark-2)] border border-white/5 rounded-2xl overflow-hidden animate-pulse flex items-center gap-4 p-4">
    <div className="w-24 h-20 rounded-xl bg-white/5 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-white/5 rounded w-3/4" />
      <div className="h-3 bg-white/5 rounded w-1/2" />
      <div className="h-3 bg-white/5 rounded w-1/3" />
    </div>
  </div>
);

const ListingCard = ({ listing, onClick }) => {
  console.log("intent raw value:", listing.intent, typeof listing.intent);
  const status = LISTING_STATUS[listing.status];
  const intent = LISTING_INTENT[listing.intent] ?? "";
  const type = PROPERTY_TYPE[listing.type] ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-[var(--dark-2)] border border-white/5 rounded-2xl overflow-hidden hover:border-[var(--gold)]/30 transition-all duration-300 cursor-pointer group flex gap-0"
    >
      {/* Image */}
      <div className="w-64 h-48 shrink-0 overflow-hidden relative">
        {listing.primaryImageUrl ? (
          <img
            src={listing.primaryImageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <Home size={32} className="text-white/10" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          {/* Title + Status */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3
              className="text-white font-semibold text-xl leading-snug line-clamp-1 group-hover:text-[var(--gold)] transition-colors duration-300"
              style={{ fontFamily: "Cormorant Garamond, serif" }}
            >
              {listing.title}
            </h3>
            <span
              className={`shrink-0 px-3 py-1 rounded-full border text-xs font-medium ${status?.color}`}
            >
              {status?.label ?? listing.status}
            </span>
          </div>

          {/* Type + City */}
          <p className="text-white/40 text-sm mb-4 flex items-center gap-2">
            <span>{type}</span>
            {intent && (
              <>
                <span>·</span>
                <span className="text-[var(--gold)] text-xs tracking-[2px] uppercase ">
                  {intent}
                </span>
              </>
            )}
            <span>·</span>
            <span>{listing.city}</span>
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-white/30 text-xs">
            <span className="flex items-center gap-1">
              <span>📅</span>
              Created{" "}
              {new Date(listing.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            {listing.publishedAt && (
              <span className="flex items-center gap-1">
                <span>🌐</span>
                Published{" "}
                {new Date(listing.publishedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        {/* Price + Arrow */}
        <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/5">
          <p
            className="text-[var(--gold)] text-2xl font-semibold"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
          >
            {listing.priceAmount?.toLocaleString()}{" "}
            <span className="text-sm text-white/40 font-normal">
              {listing.priceCurrency}
            </span>
          </p>
          <span className="text-white/20 group-hover:text-[var(--gold)] group-hover:translate-x-1 transition-all duration-300 text-lg">
            →
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default function HostListings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const fetchListings = async (page) => {
    setLoading(true);
    try {
      const result = await getManageListings({
        PageNumber: page,
        PageSize: PAGE_SIZE,
        UserId: user?.id,
        UserRoles: user?.roles,
      });
      if (result.succeeded) {
        setListings(result.data || []);
        setTotalPages(result.totalPages || 1);
        setTotalCount(result.totalCount || 0);
      } else {
        toast.error(result.message || "Failed to load listings.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen text-white relative bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(13,13,13,0.7) 0%, rgba(13,13,13,0.9) 50%, rgba(13,13,13,1) 100%), url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1800&q=80')`,
      }}
    >
      <div className="relative z-10 pt-12">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero */}
          <div className="relative w-full h-52 rounded-3xl overflow-hidden mb-8">
            <img
              src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1800&q=80"
              alt="My Listings"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-10">
              <h1
                className="text-5xl font-semibold text-white"
                style={{ fontFamily: "Cormorant Garamond, serif" }}
              >
                My Listings
              </h1>
              {!loading && (
                <p className="text-white/50 mt-2 text-sm">
                  {totalCount} {totalCount === 1 ? "property" : "properties"}{" "}
                  found
                </p>
              )}
            </div>
          </div>

          {/* Add New Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => navigate("/create-listing")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--gold)]/40 text-[var(--gold)] text-sm hover:bg-[var(--gold)]/10 transition-colors"
            >
              <Plus size={16} />
              Add New Listing
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Home size={48} className="text-white/10 mb-4" />
              <p className="text-white/40 text-lg">No listings yet</p>
              <p className="text-white/25 text-sm mt-1">
                Start by creating your first property
              </p>
              <button
                onClick={() => navigate("/create-listing")}
                className="mt-6 px-6 py-2.5 rounded-full border border-[var(--gold)]/40 text-[var(--gold)] text-sm hover:bg-[var(--gold)]/10 transition-colors"
              >
                Create Listing
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => navigate(`/manage-listing/${listing.id}`)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/50 hover:border-[var(--gold)]/40 hover:text-[var(--gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? "bg-[var(--gold)] text-[var(--dark)] font-semibold"
                        : "border border-white/10 text-white/50 hover:border-[var(--gold)]/40 hover:text-[var(--gold)]"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/50 hover:border-[var(--gold)]/40 hover:text-[var(--gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
