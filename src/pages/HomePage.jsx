import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Coffee, Salad, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";

const meals = [
  {
    key: "breakfast",
    label: "Breakfast",
    icon: Coffee,
    hours: "06:00 - 09:00",
    description: "Fresh, energizing favorites on the go.",
  },
  {
    key: "lunch",
    label: "Lunch",
    icon: Salad,
    hours: "11:00 - 14:00",
    description: "Balanced bowls, wraps, and seasonal mains.",
  },
  {
    key: "dinner",
    label: "Dinner",
    icon: Utensils,
    hours: "16:00 - 20:00",
    description: "Hearty evening comfort dishes and warm plates.",
  },
];

export default function HomePage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!token) return;
    apiRequest("/menu", {}, token)
      .then((data) => setItems(data))
      .catch(() => setItems([]));
  }, [token]);

  const mealCards = useMemo(
    () =>
      meals.map((meal) => {
        const availableItems = items.filter(
          (item) =>
            item.category === meal.key ||
            (meal.key === "dinner" && item.category === "supper"),
        );
        const isOpen =
          availableItems.length > 0 &&
          availableItems.some((item) => item.isAvailable);
        return { ...meal, items: availableItems, open: isOpen };
      }),
    [items],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-gradient-to-r from-savori-orange to-savori-yellow p-8 text-white shadow-soft">
        <p className="text-sm uppercase tracking-[0.15em] text-savori-brown/80 font-bold">
          Fast and fresh
        </p>
        <h1 className="mt-2 text-4xl font-bold">
          Order your favorite meal in minutes.
        </h1>
        <p className="mt-3 max-w-xl text-savori-brown/80 font-medium">
          Pick your meal, choose your add-ons, and collect it when it’s ready.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 md:grid-cols-3">
        {mealCards.map(
          ({ key, label, icon: Icon, hours, description, open, items }) => (
            <Link
              key={key}
              to={`/menu/${key}`}
              className={`card-surface block overflow-hidden p-5 transition hover:-translate-y-1 hover:shadow-xl ${
                !open
                  ? "border border-rose-300/40 bg-slate-50/60 opacity-85 dark:border-rose-900/30 dark:bg-slate-900/40"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${
                    open
                      ? "bg-savori-green/15 text-savori-green"
                      : "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                  }`}
                >
                  <Icon size={26} />
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                    open
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                  }`}
                >
                  {open ? "Open" : "Closed"}
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-bold flex items-center justify-between">
                <span>{label}</span>
                {!open && (
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">
                    Service Closed
                  </span>
                )}
              </h2>
              <p className="mt-2 text-sm text-slate-500">{description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {hours}
                </span>
                <span
                  className={`inline-flex items-center gap-2 font-semibold ${
                    open ? "text-savori-orange" : "text-slate-400"
                  }`}
                >
                  {open ? `${items.length} items` : "Disabled"} <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          ),
        )}
      </section>
    </div>
  );
}
