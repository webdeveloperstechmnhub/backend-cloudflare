export const injectEnvToProcess = (env) => {
  if (!globalThis.process) {
    globalThis.process = { env: {} };
  }

  if (!globalThis.process.env) {
    globalThis.process.env = {};
  }

  for (const [key, value] of Object.entries(env || {})) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      globalThis.process.env[key] = String(value);
    }
  }

};
