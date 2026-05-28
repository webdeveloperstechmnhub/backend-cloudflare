export const allowedOrigins = new Set([
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

export const buildCorsHeaders = (origin) => {
  if (!origin || !allowedOrigins.has(origin)) {
    return null;
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-performance-key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
};