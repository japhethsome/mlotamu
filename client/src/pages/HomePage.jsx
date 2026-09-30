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
    hours: "06:00 - 10:30",
    description: "Fresh, energizing favorites on the go.",
  },
  {
    key: "lunch",
    label: "Lunch",
    icon: Salad,
    hours: "12:00 - 15:00",
    description: "Balanced bowls, wraps, and seasonal mains.",
  },
  {
    key: "supper",
    label: "Supper",
    icon: Utensils,
    hours: "18:00 - 21:30",
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
          (item) => item.category === meal.key,
        );
        const hasOpenHours = availableItems.some(
          (item) =>
            item.servingHours &&
            item.servingHours.start &&
            item.servingHours.end,
        );
        return { ...meal, items: availableItems, open: hasOpenHours };
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

      <section className="grid gap-5 md:grid-cols-3">
        {mealCards.map(
          ({ key, label, icon: Icon, hours, description, open, items }) => (
            <Link
              key={key}
              to={`/menu/${key}`}
              className="card-surface block overflow-hidden p-5 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-savori-green/15 text-savori-green shadow-sm">
                  <Icon size={26} />
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${open ? "bg-savori-green/20 text-savori-greenDark" : "bg-red-100 text-red-700"}`}
                >
                  {open ? "Open" : "Closed"}
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-bold">{label}</h2>
              <p className="mt-2 text-sm text-slate-500">{description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {hours}
                </span>
                <span className="inline-flex items-center gap-2 font-semibold text-savori-orange">
                  {items.length} items <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          ),
        )}
      </section>
    </div>
  );
}
