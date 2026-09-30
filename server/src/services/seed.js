import bcrypt from "bcryptjs";
import { db, runSql } from "../config/db.js";

const menuItems = [
  {
    category: "breakfast",
    name: "Avocado Toast Deluxe",
    description:
      "Sourdough toast topped with smashed avocado, feta, herbs, and a soft-boiled egg.",
    price: 8.5,
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian", "gluten-free"],
    allergens: ["egg", "dairy"],
    stock_quantity: 40,
    is_available: 1,
    serving_hours: { start: "06:00", end: "10:30" },
  },
  {
    category: "breakfast",
    name: "Sunrise Oat Bowl",
    description:
      "Rolled oats, berries, banana, chia seeds, and almond milk with cinnamon.",
    price: 7.25,
    image:
      "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "gluten-free"],
    allergens: ["nuts"],
    stock_quantity: 28,
    is_available: 1,
    serving_hours: { start: "06:00", end: "10:30" },
  },
  {
    category: "breakfast",
    name: "Classic Pancake Stack",
    description: "Fluffy pancakes with berry compote and maple drizzle.",
    price: 9.75,
    image:
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian"],
    allergens: ["gluten", "dairy", "egg"],
    stock_quantity: 18,
    is_available: 1,
    serving_hours: { start: "06:00", end: "10:30" },
  },
  {
    category: "breakfast",
    name: "Swahili Chai Set",
    description: "Spiced tea with mandazi and a fresh fruit cup.",
    price: 6.4,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian"],
    allergens: ["gluten"],
    stock_quantity: 22,
    is_available: 1,
    serving_hours: { start: "06:00", end: "10:30" },
  },
  {
    category: "breakfast",
    name: "Veggie Egg Wrap",
    description:
      "Scrambled eggs, spinach, peppers, and cheddar in a wholewheat wrap.",
    price: 8.0,
    image:
      "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian", "halal"],
    allergens: ["gluten", "egg", "dairy"],
    stock_quantity: 20,
    is_available: 1,
    serving_hours: { start: "06:00", end: "10:30" },
  },
  {
    category: "breakfast",
    name: "Cinnamon Yogurt Parfait",
    description:
      "Greek yogurt layered with granola, honey, and seasonal fruit.",
    price: 7.1,
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian", "gluten-free"],
    allergens: ["dairy"],
    stock_quantity: 34,
    is_available: 1,
    serving_hours: { start: "06:00", end: "10:30" },
  },
  {
    category: "breakfast",
    name: "Beetroot Smoothie Bowl",
    description: "Protein-packed smoothie bowl with coconut flakes and seeds.",
    price: 8.2,
    image:
      "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "gluten-free"],
    allergens: ["nuts"],
    stock_quantity: 14,
    is_available: 1,
    serving_hours: { start: "06:00", end: "10:30" },
  },
  {
    category: "breakfast",
    name: "Burrata Bagel",
    description:
      "Fresh bagel with burrata, tomatoes, basil, and balsamic glaze.",
    price: 9.2,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian"],
    allergens: ["gluten", "dairy"],
    stock_quantity: 11,
    is_available: 1,
    serving_hours: { start: "06:00", end: "10:30" },
  },
  {
    category: "lunch",
    name: "Chicken Shawarma Bowl",
    description:
      "Herb chicken, rice, cucumber salad, pickles, and garlic sauce.",
    price: 13.5,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal"],
    allergens: ["sesame"],
    stock_quantity: 25,
    is_available: 1,
    serving_hours: { start: "12:00", end: "15:00" },
  },
  {
    category: "lunch",
    name: "Crispy Tofu Quinoa Box",
    description:
      "Crispy tofu, quinoa, roasted vegetables, and lemon tahini dressing.",
    price: 12.8,
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "gluten-free"],
    allergens: ["sesame"],
    stock_quantity: 18,
    is_available: 1,
    serving_hours: { start: "12:00", end: "15:00" },
  },
  {
    category: "lunch",
    name: "Beef Burger & Fries",
    description:
      "Grilled beef patty, cheddar, lettuce, tomato, and signature fries.",
    price: 14.3,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal"],
    allergens: ["gluten", "dairy"],
    stock_quantity: 17,
    is_available: 1,
    serving_hours: { start: "12:00", end: "15:00" },
  },
  {
    category: "lunch",
    name: "Mediterranean Veggie Wrap",
    description:
      "Falafel, hummus, greens, cucumber, tomato, and pickled onion wrap.",
    price: 11.4,
    image:
      "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "vegetarian"],
    allergens: ["gluten"],
    stock_quantity: 21,
    is_available: 1,
    serving_hours: { start: "12:00", end: "15:00" },
  },
  {
    category: "lunch",
    name: "Grilled Chicken Caesar Salad",
    description:
      "Mixed greens, grilled chicken, parmesan, croutons, and Caesar dressing.",
    price: 13.0,
    image:
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal"],
    allergens: ["gluten", "dairy", "egg"],
    stock_quantity: 26,
    is_available: 1,
    serving_hours: { start: "12:00", end: "15:00" },
  },
  {
    category: "lunch",
    name: "Pesto Pasta Bowl",
    description:
      "Rigatoni with basil pesto, cherry tomatoes, spinach, and roasted peas.",
    price: 12.5,
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian"],
    allergens: ["nuts", "gluten"],
    stock_quantity: 16,
    is_available: 1,
    serving_hours: { start: "12:00", end: "15:00" },
  },
  {
    category: "lunch",
    name: "Spicy Lentil Stew",
    description: "Rich lentil stew with rice, roasted sweet potato, and herbs.",
    price: 10.8,
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "halal", "gluten-free"],
    allergens: ["none"],
    stock_quantity: 22,
    is_available: 1,
    serving_hours: { start: "12:00", end: "15:00" },
  },
  {
    category: "lunch",
    name: "Fish & Greens Box",
    description: "Cajun fish fillet, herbed rice, greens, and tangy slaw.",
    price: 15.2,
    image:
      "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal", "gluten-free"],
    allergens: ["fish"],
    stock_quantity: 12,
    is_available: 1,
    serving_hours: { start: "12:00", end: "15:00" },
  },
  {
    category: "supper",
    name: "Grilled Salmon Plate",
    description:
      "Cedar salmon, lemon rice, seasonal greens, and charred vegetables.",
    price: 17.9,
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal", "gluten-free"],
    allergens: ["fish"],
    stock_quantity: 15,
    is_available: 1,
    serving_hours: { start: "18:00", end: "21:30" },
  },
  {
    category: "supper",
    name: "Butter Chicken Rice",
    description: "Comforting chicken curry, saffron rice, and warm naan.",
    price: 14.8,
    image:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal"],
    allergens: ["dairy", "gluten"],
    stock_quantity: 20,
    is_available: 1,
    serving_hours: { start: "18:00", end: "21:30" },
  },
  {
    category: "supper",
    name: "Mushroom Risotto",
    description:
      "Creamy arborio rice with roasted mushrooms, parmesan, and herbs.",
    price: 14.2,
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian"],
    allergens: ["dairy"],
    stock_quantity: 13,
    is_available: 1,
    serving_hours: { start: "18:00", end: "21:30" },
  },
  {
    category: "supper",
    name: "Vegan Power Bowl",
    description:
      "Roasted chickpeas, couscous, greens, avocado, and tahini drizzle.",
    price: 13.6,
    image:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "gluten-free"],
    allergens: ["sesame"],
    stock_quantity: 19,
    is_available: 1,
    serving_hours: { start: "18:00", end: "21:30" },
  },
  {
    category: "supper",
    name: "Steak Frites",
    description: "Grilled sirloin, crispy fries, and pepper herb butter.",
    price: 19.4,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal"],
    allergens: ["dairy"],
    stock_quantity: 11,
    is_available: 1,
    serving_hours: { start: "18:00", end: "21:30" },
  },
  {
    category: "supper",
    name: "Garden Gnocchi",
    description:
      "Soft potato gnocchi with spinach, peas, and a light cream sauce.",
    price: 13.9,
    image:
      "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegetarian"],
    allergens: ["gluten", "dairy"],
    stock_quantity: 12,
    is_available: 1,
    serving_hours: { start: "18:00", end: "21:30" },
  },
  {
    category: "supper",
    name: "Lentil & Sweet Potato Curry",
    description: "Slow-cooked curry with rice and crunchy shallots.",
    price: 12.4,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["vegan", "halal", "gluten-free"],
    allergens: ["none"],
    stock_quantity: 18,
    is_available: 1,
    serving_hours: { start: "18:00", end: "21:30" },
  },
  {
    category: "supper",
    name: "BBQ Chicken Flatbread",
    description: "Roasted chicken, peppers, red onion, and barbecue glaze.",
    price: 14.6,
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
    dietary_tags: ["halal"],
    allergens: ["gluten", "dairy"],
    stock_quantity: 14,
    is_available: 1,
    serving_hours: { start: "18:00", end: "21:30" },
  },
];

export async function seedDatabase() {
  const existingUsers = await db.get("SELECT COUNT(*) as count FROM users");
  if (existingUsers.count > 0) return;

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

  await runSql(
    `INSERT OR IGNORE INTO promos (code, discount_percent) VALUES (?, ?);`,
    ["SAVE10", 10],
  );
}
