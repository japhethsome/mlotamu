import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Search,
  Star,
  Lock,
  AlertCircle,
  Plus,
  Coffee,
  Salad,
  Utensils,
  Sparkles,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../lib/api.js";
import { getRealisticFoodImage } from "../lib/foodImages.js";

const tags = ["vegetarian", "vegan", "halal", "gluten-free"];

const MEAL_SERVICES = [
  { key: "breakfast", label: "Breakfast", hours: "06:00 – 09:00", icon: Coffee },
  { key: "lunch", label: "Lunch", hours: "11:00 – 14:00", icon: Salad },
  { key: "dinner", label: "Dinner", hours: "16:00 – 20:00", icon: Utensils },
];

export default function MenuPage() {
  const { category = "breakfast" } = useParams();
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
    <div className="space-y-4 sm:space-y-6">
      {/* Clickable Meal Service Tabs (Mobile & Desktop) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {MEAL_SERVICES.map((cat) => {
          const isActive = (category || "breakfast").toLowerCase() === cat.key;
          const CatIcon = cat.icon;
          return (
            <Link
              key={cat.key}
              to={`/menu/${cat.key}`}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-sm ${
                isActive
                  ? "bg-savori-orange text-white shadow-savori-orange/30 shadow-md scale-[1.02]"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:border-savori-orange/40 hover:bg-slate-50 dark:hover:bg-slate-700/60"
              }`}
            >
              <CatIcon size={16} />
              <span>{cat.label}</span>
              <span className={`text-[10px] font-normal hidden sm:inline ${isActive ? "text-white/80" : "text-slate-400"}`}>
                ({cat.hours})
              </span>
            </Link>
          );
        })}
      </div>

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

      <div className="card-surface p-3.5 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm uppercase tracking-[0.15em] text-savori-orange font-bold">
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
            <h1 className="text-2xl sm:text-3xl font-bold capitalize mt-0.5">{category} menu</h1>
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
              placeholder="Search dishes..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 sm:py-3 pl-10 pr-4 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange"
            />
          </div>
        </div>

        {/* Dietary Filter Tags - Horizontally Scrollable on Mobile */}
        <div className="mt-3 sm:mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedTag("all")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all ${selectedTag === "all" ? "bg-savori-orange text-white shadow-sm" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold capitalize transition-all ${selectedTag === tag ? "bg-savori-orange text-white shadow-sm" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {visibleItems.map((item) => {
          const isClosed = !item.isAvailable;
          const itemImage = getRealisticFoodImage(item.name, item.image);

          return (
            <div
              key={item.id}
              className={`card-surface group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-xl hover:-translate-y-1 ${
                isClosed
                  ? "border-rose-300/40 bg-slate-50/70 opacity-80 dark:border-rose-900/30 dark:bg-slate-900/40"
                  : ""
              }`}
            >
              <div className="relative h-32 sm:h-36 md:h-40 lg:h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={itemImage}
                  alt={item.name}
                  loading="lazy"
                  className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    isClosed ? "grayscale-[60%] brightness-75" : ""
                  }`}
                />

                {/* Floating Rating Badge */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  <span>4.8</span>
                </div>

                {/* Floating Favorite Button */}
                <button
                  type="button"
                  onClick={() =>
                    setLiked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                  }
                  aria-label="Add to favourites"
                  className="absolute top-2 right-2 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/85 dark:bg-slate-900/85 shadow-sm backdrop-blur-sm hover:scale-110 active:scale-95 transition-all"
                >
                  <Heart
                    size={14}
                    className={
                      liked[item.id]
                        ? "fill-rose-500 text-rose-500"
                        : "text-slate-600 dark:text-slate-300"
                    }
                  />
                </button>

                {isClosed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px]">
                    <div className="flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-lg">
                      <Lock size={12} /> Closed
                    </div>
                    <p className="mt-1 text-[10px] font-medium text-white/90">
                      Not available
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <h3 className="font-bold text-sm sm:text-base leading-tight truncate text-slate-900 dark:text-slate-100 group-hover:text-savori-orange transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-2">
                    {item.description}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {(item.dietaryTags || []).slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.allergens?.length > 0 && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                        • {item.allergens[0]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base lg:text-lg font-black text-slate-900 dark:text-slate-100 truncate">
                      KSh {Number(item.price).toFixed(2)}
                    </p>
                    <p
                      className={`text-[10px] font-bold ${
                        item.isAvailable
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {item.isAvailable ? "● Open & In Stock" : "● Closed"}
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
                        image: itemImage,
                      })
                    }
                    disabled={!item.isAvailable}
                    className={`inline-flex items-center justify-center gap-1 rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                      item.isAvailable
                        ? "bg-savori-orange text-white shadow-md shadow-savori-orange/20 hover:bg-savori-orangeDark hover:shadow-lg hover:scale-105"
                        : "cursor-not-allowed border border-rose-300 bg-rose-100 text-rose-700 shadow-none dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-400"
                    }`}
                  >
                    {item.isAvailable ? (
                      <>
                        <Plus size={14} className="stroke-[3]" />
                        <span>Add</span>
                      </>
                    ) : (
                      "Closed"
                    )}
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
