import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { registerApiRoutes } from "./registerRoutes.js";
import { ensureMongoConnected } from "./db.js";
import { injectEnvToProcess } from "./runtimeEnv.js";

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://127.0.0.1:8080",
  "null",
  "https://techmnhub-gamma.vercel.app",
  "https://techmnhub-admin.vercel.app",
  "https://techmnhub.com",
  "https://www.techmnhub.com",
  "https://checkin-system.pages.dev",
  "https://tickets-generator.pages.dev",
  "https://techmnhub-1.pages.dev",
  "https://techmnhub-frontend.pages.dev",
  "https://admin-techmnhub.pages.dev",
  "https://session-manager-atex.onrender.com",
]);

const orderRateWindowMs = 15 * 60 * 1000;
const orderRateMax = 20;
const orderRateMap = new Map();

const checkOrderRateLimit = (ip) => {
  const now = Date.now();
  const key = ip || "unknown";
  const current = orderRateMap.get(key);

  if (!current || now - current.start > orderRateWindowMs) {
    orderRateMap.set(key, { start: now, count: 1 });
    return true;
  }

  if (current.count >= orderRateMax) return false;
  current.count += 1;
  return true;
};

let app;
let initError;

const createApp = async () => {
  const hono = new Hono();

  hono.use("*", secureHeaders());
  hono.use("*", cors({
    origin: (origin) => {
      if (!origin) return "";
      return allowedOrigins.has(origin) ? origin : "";
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-performance-key"],
    credentials: true,
  }));

  hono.use("/api/payment/create-order", async (c, next) => {
    const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "";
    if (!checkOrderRateLimit(ip)) {
      return c.json({ msg: "Too many payment requests, please try again later." }, 429);
    }
    await next();
  });

  await ensureMongoConnected();
  registerApiRoutes(hono);

  hono.notFound((c) => c.json({ msg: "Not found" }, 404));

  hono.onError((err, c) => {
    console.error("Unhandled worker error:", err);
    return c.json({ msg: "Server error" }, 500);
  });

  return hono;
};

export default {
  async fetch(request, env) {
    injectEnvToProcess(env);

    if (initError) {
      return new Response(JSON.stringify({ msg: "Worker init failed", error: initError.message }), {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    if (!app) {
      try {
        app = await createApp();
      } catch (err) {
        initError = err;
        console.error("App initialization failed:", err);
        return new Response(JSON.stringify({ msg: "Worker init failed", error: err.message }), {
          status: 500,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }
    }

    return app.fetch(request, env);
  },
};
