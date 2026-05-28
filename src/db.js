import mongoose from "mongoose";
import eventController from "../controllers/eventController.js";

export const ensureMongoConnected = async () => {

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);

  try {
    const { ensureSeedEventsIfEmpty } = eventController || {};
    if (typeof ensureSeedEventsIfEmpty === "function") {
      await ensureSeedEventsIfEmpty();
    }
  } catch (err) {
    console.error("Seed verification failed:", err);
  }
};
