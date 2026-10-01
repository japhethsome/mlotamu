import { useEffect, useMemo, useState } from "react";
import { Heart, Search, Star, Lock, AlertCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../lib/api.js";

const tags = ["vegetarian", "vegan", "halal", "gluten-free"];

export default function MenuPage() {
  const { category } = useParams();
  const { token } = useAuth();
  const { addItem } = useCart();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [liked, setLiked] = useState({});

  useEffect(() => {
    if (!token) return;
    apiRequest(`/menu?category=${category || "breakfast"}`, {}, token)
      .then((data) => setItems(data))
      .catch(() => setItems([]));
  }, [category, token]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      const matchesTag =
        selectedTag === "all" || (item.dietaryTags || []).includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [items, search, selectedTag]);

  const isCategoryClosed = items.length > 0 && items.every((item) => !item.isAvailable);

  return (
    <div className="space-y-6">
      {/* Category Closed Alert Banner */}
      {isCategoryClosed && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-rose-500/30 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/40">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="font-bold text-rose-800 dark:text-rose-200">
              {category ? category.toUpperCase() : "MEAL"} SERVICE IS CURRENTLY CLOSED
            </h3>
            <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
              Cafeteria staff have closed this meal category. Ordering is temporarily disabled for all items in this section.
            </p>
          </div>
        </div>
      )}

      <div className="card-surface p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm uppercase tracking-[0.15em] text-savori-orange font-bold">
                {category}
              </p>
              {isCategoryClosed ? (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  Service Closed
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Open
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold capitalize">{category} menu</h1>
          </div>
          <div className="relative md:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search menu"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedTag("all")}
            className={`rounded-full px-3 py-2 text-sm font-medium ${selectedTag === "all" ? "bg-savori-orange text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`rounded-full px-3 py-2 text-sm font-medium ${selectedTag === tag ? "bg-savori-orange text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 xl:grid-cols-3">
        {visibleItems.map((item) => {
          const isClosed = !item.isAvailable;
          return (
            <div
              key={item.id}
              className={`card-surface overflow-hidden transition-all ${
                isClosed
                  ? "border border-rose-300/40 bg-slate-50/70 opacity-80 dark:border-rose-900/30 dark:bg-slate-900/40"
                  : ""
              }`}
            >
              <div className="relative h-32 sm:h-40 md:h-48 w-full overflow-hidden">
                <img
                  src={
                    item.image ||
                    "https://images.unsplash.com/photo-1547592180-85f173990554"
                  }
                  alt={item.name}
                  className={`h-full w-full object-cover transition-transform duration-300 ${
                    isClosed ? "grayscale-[60%] brightness-75" : ""
                  }`}
                />
                {isClosed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
                    <div className="flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-lg">
                      <Lock size={14} /> Closed
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-white/90">
                      Not currently available to order
                    </p>
                  </div>
                )}
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base md:text-xl font-bold leading-tight truncate">{item.name}</h3>
                    <p className="mt-0.5 text-xs sm:text-sm text-slate-500 line-clamp-2 hidden sm:block">
                      {item.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setLiked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                    }
                    aria-label="Add to favourites"
                    className="shrink-0"
                  >
                    <Heart
                      size={16}
                      className={
                        liked[item.id]
                          ? "fill-red-500 text-red-500"
                          : "text-slate-500"
                      }
                    />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(item.dietaryTags || []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-amber-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate max-w-[70%] hidden sm:block">
                    {item.allergens?.length
                      ? `Allergens: ${item.allergens.join(", ")}`
                      : "No major allergens"}
                  </span>
                  <span className="inline-flex items-center gap-1 ml-auto">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    4.8
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base sm:text-xl font-bold truncate">
                      KSh {Number(item.price).toFixed(2)}
                    </p>
                    <p
                      className={`text-[10px] sm:text-xs font-bold ${
                        item.isAvailable ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {item.isAvailable ? "● Open" : "● Closed"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      item.isAvailable &&
                      addItem({
                        id: item.id,
                        name: item.name,
                        price: Number(item.price),
                        quantity: 1,
                        notes: "",
                        image: item.image,
                      })
                    }
                    disabled={!item.isAvailable}
                    className={`shrink-0 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all ${
                      item.isAvailable
                        ? "btn-primary"
                        : "cursor-not-allowed border border-rose-300 bg-rose-100 text-rose-700 shadow-none dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-400"
                    }`}
                  >
                    {item.isAvailable ? "Add" : "Closed"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
