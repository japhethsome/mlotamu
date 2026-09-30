import { useEffect, useMemo, useState } from "react";
import { Heart, Search, Star } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="card-surface p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.15em] text-savori-orange">
              {category}
            </p>
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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => (
          <div key={item.id} className="card-surface overflow-hidden">
            <img
              src={
                item.image ||
                "https://images.unsplash.com/photo-1547592180-85f173990554"
              }
              alt={item.name}
              className="h-48 w-full object-cover"
            />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLiked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                  }
                  aria-label="Add to favourites"
                >
                  <Heart
                    size={18}
                    className={
                      liked[item.id]
                        ? "fill-red-500 text-red-500"
                        : "text-slate-500"
                    }
                  />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(item.dietaryTags || []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                <span>
                  {item.allergens?.length
                    ? `Allergens: ${item.allergens.join(", ")}`
                    : "No major allergens"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  4.8
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold">
                    KSh {Number(item.price).toFixed(2)}
                  </p>
                  <p
                    className={`text-xs font-medium ${item.isAvailable ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {item.isAvailable ? "In stock" : "Sold out"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
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
                  className="btn-primary disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {item.isAvailable ? "Add to cart" : "Sold out"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
