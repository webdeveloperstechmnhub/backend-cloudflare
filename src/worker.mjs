import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { registerApiRoutes } from "./registerRoutes.mjs";
import { ensureMongoConnected } from "./db.mjs";
import { injectEnvToProcess } from "./runtimeEnv.mjs";
import { buildCorsHeaders } from "./cors.mjs";

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

const jsonWithCors = (payload, status, origin) => {
  const headers = {
    "content-type": "application/json; charset=utf-8",
  };

  const corsHeaders = buildCorsHeaders(origin);
  if (corsHeaders) {
    Object.assign(headers, corsHeaders);
  }

  return new Response(JSON.stringify(payload), {
    status,
    headers,
  });
};

const createApp = async () => {
  const hono = new Hono();

  hono.use("*", async (c, next) => {
    const origin = c.req.header("origin");
    const corsHeaders = buildCorsHeaders(origin);

    if (c.req.method === "OPTIONS") {
      if (corsHeaders) {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      return new Response(null, { status: 204 });
    }

    await next();

    if (corsHeaders) {
      Object.entries(corsHeaders).forEach(([key, value]) => {
        c.header(key, value);
      });
    }
  });

  hono.use("*", secureHeaders());

  hono.use("/api/payment/create-order", async (c, next) => {
    const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "";
    if (!checkOrderRateLimit(ip)) {
      return c.json({ msg: "Too many payment requests, please try again later." }, 429);
    }
    await next();
  });

  await ensureMongoConnected();
  registerApiRoutes(hono);

  hono.notFound((c) => jsonWithCors({ msg: "Not found" }, 404, c.req.header("origin")));

  hono.onError((err, c) => {
    console.error("Unhandled worker error:", err);
    return jsonWithCors({ msg: "Server error" }, 500, c.req.header("origin"));
  });

  return hono;
};

export default {
  async fetch(request, env) {
    injectEnvToProcess(env);

    if (initError) {
      return jsonWithCors({ msg: "Worker init failed", error: initError.message }, 500, request.headers.get("origin"));
    }

    if (!app) {
      try {
        app = await createApp();
      } catch (err) {
        initError = err;
        console.error("App initialization failed:", err);
        return jsonWithCors({ msg: "Worker init failed", error: err.message }, 500, request.headers.get("origin"));
      }
    }

    return app.fetch(request, env);
  },
};