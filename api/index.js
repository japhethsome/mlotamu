import app from "../server/src/app.js";
import { initializeDatabase } from "../server/src/config/db.js";
import { seedDatabase } from "../server/src/services/seed.js";

let readyPromise = null;
function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await initializeDatabase();
      await seedDatabase();
    })();
  }
  return readyPromise;
}

export default async function handler(req, res) {
  try {
    await ensureReady();
    return app(req, res);
  } catch (error) {
    console.error("Vercel serverless handler error:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
