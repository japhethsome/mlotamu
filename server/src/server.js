import http from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { initializeDatabase } from "./config/db.js";
import { seedDatabase } from "./services/seed.js";
import { configureSocket } from "./services/socket.js";

async function startServer() {
  try {
    await initializeDatabase();
    await seedDatabase();

    const server = http.createServer(app);
    configureSocket(server);

    server.listen(env.port, () => {
      console.log(`Cafeteria API running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
