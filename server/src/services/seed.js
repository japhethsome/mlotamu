import bcrypt from "bcryptjs";
import { runSql, getSql } from "../config/db.js";

const menuItems = [
  // ── BREAKFAST 06:00–09:00 ──────────────────────────────────────────────────
  {
    category: "breakfast",
    name: "Avocado Toast Deluxe",
    description: "Sourdough toast topped with smashed avocado, feta, herbs, and a soft-boiled egg.",
    price: 650,
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian", "gluten-free"],
    allergens: ["egg", "dairy"],
    stock_quantity: 40,
    is_available: 1,
    serving_hours: { start: "06:00", end: "09:00" },
  },
  {
    category: "breakfast",
    name: "Sunrise Oat Bowl",
    description: "Rolled oats, berries, banana, chia seeds, and almond milk with cinnamon.",
    price: 520,
    image: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "gluten-free"],
    allergens: ["nuts"],
    stock_quantity: 28,
    is_available: 1,
    serving_hours: { start: "06:00", end: "09:00" },
  },
  {
    category: "breakfast",
    name: "Classic Pancake Stack",
    description: "Fluffy pancakes with berry compote and maple drizzle.",
    price: 580,
    image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian"],
    allergens: ["gluten", "dairy", "egg"],
    stock_quantity: 18,
    is_available: 1,
    serving_hours: { start: "06:00", end: "09:00" },
  },
  {
    category: "breakfast",
    name: "Swahili Chai Set",
    description: "Spiced tea with mandazi and a fresh fruit cup.",
    price: 350,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian"],
    allergens: ["gluten"],
    stock_quantity: 22,
    is_available: 1,
    serving_hours: { start: "06:00", end: "09:00" },
  },
  // ── LUNCH 11:00–14:00 ──────────────────────────────────────────────────────
  {
    category: "lunch",
    name: "Grilled Chicken Rice",
    description: "Tender grilled chicken with seasoned rice, salad, and kachumbari.",
    price: 850,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal"],
    allergens: [],
    stock_quantity: 25,
    is_available: 1,
    serving_hours: { start: "11:00", end: "14:00" },
  },
  {
    category: "lunch",
    name: "Mediterranean Veggie Wrap",
    description: "Falafel, hummus, greens, cucumber, tomato, and pickled onion wrap.",
    price: 720,
    image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "vegetarian"],
    allergens: ["gluten"],
    stock_quantity: 21,
    is_available: 1,
    serving_hours: { start: "11:00", end: "14:00" },
  },
  {
    category: "lunch",
    name: "Beef Burger & Fries",
    description: "Grilled beef patty, cheddar, lettuce, tomato, and crispy fries.",
    price: 980,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal"],
    allergens: ["gluten", "dairy"],
    stock_quantity: 17,
    is_available: 1,
    serving_hours: { start: "11:00", end: "14:00" },
  },
  {
    category: "lunch",
    name: "Spicy Lentil Stew",
    description: "Rich lentil stew with ugali, roasted sweet potato, and herbs.",
    price: 650,
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "halal", "gluten-free"],
    allergens: [],
    stock_quantity: 22,
    is_available: 1,
    serving_hours: { start: "11:00", end: "14:00" },
  },
  // ── DINNER 16:00–20:00 ─────────────────────────────────────────────────────
  {
    category: "dinner",
    name: "Beef Stew & Ugali",
    description: "Slow-cooked beef stew served with ugali and sukuma wiki.",
    price: 950,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal"],
    allergens: [],
    stock_quantity: 18,
    is_available: 1,
    serving_hours: { start: "16:00", end: "20:00" },
  },
  {
    category: "dinner",
    name: "Grilled Tilapia",
    description: "Fresh Nile tilapia grilled with spices, served with ugali and kachumbari.",
    price: 1100,
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal", "gluten-free"],
    allergens: ["fish"],
    stock_quantity: 15,
    is_available: 1,
    serving_hours: { start: "16:00", end: "20:00" },
  },
  {
    category: "dinner",
    name: "Butter Chicken Rice",
    description: "Comforting chicken curry, saffron rice, and warm chapati.",
    price: 920,
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal"],
    allergens: ["dairy", "gluten"],
    stock_quantity: 20,
    is_available: 1,
    serving_hours: { start: "16:00", end: "20:00" },
  },
  {
    category: "dinner",
    name: "Vegan Power Bowl",
    description: "Roasted chickpeas, couscous, greens, avocado, and tahini drizzle.",
    price: 800,
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "gluten-free"],
    allergens: ["sesame"],
    stock_quantity: 19,
    is_available: 1,
    serving_hours: { start: "16:00", end: "20:00" },
  },
];

export async function seedDatabase(force = false) {
  const existingUsers = await getSql("SELECT COUNT(*) as count FROM users");
  if (force || !existingUsers || existingUsers.count === 0) {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    await runSql(
      `INSERT OR IGNORE INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?);`,
      [
        "customer@example.com",
        passwordHash,
        "Demo Customer",
        "customer",
        "staff@example.com",
        passwordHash,
        "Demo Staff",
        "staff",
        "admin@example.com",
        passwordHash,
        "Demo Admin",
        "admin",
      ],
    );
  }

  // Clear existing menu items if forced or empty
  const existingItems = await getSql("SELECT COUNT(*) as count FROM menu_items");
  if (force || !existingItems || existingItems.count === 0) {
    if (force) {
      await runSql("DELETE FROM menu_items");
    }
    const records = menuItems.map((item) => [
      item.name,
      item.description,
      item.price,
      item.image,
      item.category,
      JSON.stringify(item.dietary_tags),
      JSON.stringify(item.allergens),
      item.stock_quantity,
      item.is_available,
      JSON.stringify(item.serving_hours),
    ]);

    const placeholders = records
      .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .join(", ");
    await runSql(
      `INSERT INTO menu_items (name, description, price, image, category, dietary_tags, allergens, stock_quantity, is_available, serving_hours) VALUES ${placeholders};`,
      records.flat(),
    );
  }

  await runSql(
    `INSERT OR IGNORE INTO promos (code, discount_percent) VALUES (?, ?);`,
    ["SAVE10", 10],
  );
}

export { menuItems };
