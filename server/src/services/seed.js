import bcrypt from "bcryptjs";
import { runSql, getSql } from "../config/db.js";

const menuItems = [
  // ── TEA & BREAKFAST (06:00-09:00) ─────────────────────────────────────────
  {
    category: "breakfast",
    name: "White Tea",
    description: "Fresh brewed white tea, light and calming.",
    price: 10,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan"],
    allergens: [],
    stock_quantity: 200,
    is_available: 1,
    serving_hours: { start: "06:00", end: "09:00" },
  },
  {
    category: "breakfast",
    name: "Black Tea",
    description: "Strong brewed black tea, served hot.",
    price: 10,
    image: "https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan"],
    allergens: [],
    stock_quantity: 200,
    is_available: 1,
    serving_hours: { start: "06:00", end: "09:00" },
  },
  {
    category: "breakfast",
    name: "Ndazi",
    description: "Freshly fried Swahili doughnuts, soft and lightly sweet.",
    price: 10,
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian"],
    allergens: ["gluten"],
    stock_quantity: 150,
    is_available: 1,
    serving_hours: { start: "06:00", end: "09:00" },
  },
  {
    category: "breakfast",
    name: "Chapati",
    description: "Soft layered flatbread, freshly made.",
    price: 20,
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian"],
    allergens: ["gluten"],
    stock_quantity: 120,
    is_available: 1,
    serving_hours: { start: "06:00", end: "09:00" },
  },
  // ── STAPLES & SIDES (11:00-14:00) ─────────────────────────────────────────
  {
    category: "lunch",
    name: "Rice",
    description: "Plain steamed white rice.",
    price: 20,
    image: "https://images.unsplash.com/photo-1536304993881-ff86e0c9ef97?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "gluten-free"],
    allergens: [],
    stock_quantity: 200,
    is_available: 1,
    serving_hours: { start: "11:00", end: "14:00" },
  },
  {
    category: "lunch",
    name: "Ugali",
    description: "Kenyan staple maize meal, firm and filling.",
    price: 20,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "gluten-free"],
    allergens: [],
    stock_quantity: 200,
    is_available: 1,
    serving_hours: { start: "11:00", end: "14:00" },
  },
  {
    category: "lunch",
    name: "Vegetable (Kales/Cabbage)",
    description: "Fresh cooked kales or cabbage, lightly seasoned.",
    price: 10,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "gluten-free"],
    allergens: [],
    stock_quantity: 200,
    is_available: 1,
    serving_hours: { start: "11:00", end: "14:00" },
  },
  {
    category: "lunch",
    name: "Ndengu Stew",
    description: "Creamy green gram stew with spices.",
    price: 20,
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "gluten-free"],
    allergens: [],
    stock_quantity: 150,
    is_available: 1,
    serving_hours: { start: "11:00", end: "14:00" },
  },
  {
    category: "lunch",
    name: "Beans Stew",
    description: "Hearty slow-cooked bean stew, well-seasoned.",
    price: 20,
    image: "https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "gluten-free"],
    allergens: [],
    stock_quantity: 150,
    is_available: 1,
    serving_hours: { start: "11:00", end: "14:00" },
  },
  // ── MIXED MEALS (11:00-14:00) ──────────────────────────────────────────────
  {
    category: "lunch",
    name: "Ugali Mix",
    description: "Ugali served with your choice of stew and vegetables.",
    price: 80,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "gluten-free"],
    allergens: [],
    stock_quantity: 100,
    is_available: 1,
    serving_hours: { start: "11:00", end: "14:00" },
  },
  {
    category: "lunch",
    name: "Rice Mix",
    description: "Rice served with stew and vegetables — a complete meal.",
    price: 80,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "gluten-free"],
    allergens: [],
    stock_quantity: 100,
    is_available: 1,
    serving_hours: { start: "11:00", end: "14:00" },
  },
  {
    category: "lunch",
    name: "Chapo Mix",
    description: "Chapati served with stew and vegetables.",
    price: 80,
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian"],
    allergens: ["gluten"],
    stock_quantity: 100,
    is_available: 1,
    serving_hours: { start: "11:00", end: "14:00" },
  },
  // ── BEEF SPECIALS (16:00-20:00) ────────────────────────────────────────────
  {
    category: "dinner",
    name: "Beef Ugali",
    description: "Tender beef stew served with ugali.",
    price: 70,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal", "gluten-free"],
    allergens: [],
    stock_quantity: 80,
    is_available: 1,
    serving_hours: { start: "16:00", end: "20:00" },
  },
  {
    category: "dinner",
    name: "Beef Rice",
    description: "Tender beef stew served with steamed rice.",
    price: 70,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal", "gluten-free"],
    allergens: [],
    stock_quantity: 80,
    is_available: 1,
    serving_hours: { start: "16:00", end: "20:00" },
  },
  {
    category: "dinner",
    name: "Beef Chapo",
    description: "Beef stew served with freshly made chapati.",
    price: 80,
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal"],
    allergens: ["gluten"],
    stock_quantity: 80,
    is_available: 1,
    serving_hours: { start: "16:00", end: "20:00" },
  },
  // ── EGG SPECIALS (16:00-20:00) ─────────────────────────────────────────────
  {
    category: "dinner",
    name: "Egg Ugali",
    description: "Fried egg served with ugali.",
    price: 45,
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian", "gluten-free"],
    allergens: ["egg"],
    stock_quantity: 100,
    is_available: 1,
    serving_hours: { start: "16:00", end: "20:00" },
  },
  {
    category: "dinner",
    name: "Egg Ugali Mboga",
    description: "Fried egg with ugali and a side of vegetables.",
    price: 55,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian", "gluten-free"],
    allergens: ["egg"],
    stock_quantity: 100,
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
        "customer@example.com", passwordHash, "Demo Customer", "customer",
        "staff@example.com",    passwordHash, "Demo Staff",    "staff",
        "admin@example.com",    passwordHash, "Demo Admin",    "admin",
      ],
    );
  }

  // Always reseed menu so new items take effect
  const existingItems = await getSql("SELECT COUNT(*) as count FROM menu_items");
  if (force || !existingItems || existingItems.count === 0) {
    if (force) await runSql("DELETE FROM menu_items");
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
    const placeholders = records.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
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
