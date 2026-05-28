const toPlainHeaders = (request) => {
  const headers = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  return headers;
};

const parseBody = async (c) => {
  const method = c.req.method.toUpperCase();
  if (method === "GET" || method === "HEAD") return {};

  const contentType = (c.req.header("content-type") || "").toLowerCase();

  try {
    if (contentType.includes("application/json")) {
      return await c.req.json();
    }

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await c.req.text();
      return Object.fromEntries(new URLSearchParams(text));
    }

    if (contentType.includes("multipart/form-data")) {
      const form = await c.req.formData();
      const body = {};
      for (const [key, value] of form.entries()) {
        if (value instanceof File) {
          body[key] = {
            name: value.name,
            type: value.type,
            size: value.size,
          };
        } else {
          body[key] = value;
        }
      }
      return body;
    }

    const text = await c.req.text();
    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch (_err) {
      return { raw: text };
    }
  } catch (_err) {
    return {};
  }
};

const toQueryObject = (url) => {
  const query = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (query[key] === undefined) {
      query[key] = value;
      continue;
    }

    if (Array.isArray(query[key])) {
      query[key].push(value);
      continue;
    }

    query[key] = [query[key], value];
  }
  return query;
};

const buildReq = async (c) => {
  const url = new URL(c.req.url);
  const headers = toPlainHeaders(c.req.raw);
  const body = await parseBody(c);

  const req = {
    method: c.req.method,
    url: c.req.url,
    path: url.pathname,
    originalUrl: c.req.url,
    headers,
    body,
    query: toQueryObject(url),
    params: c.req.param(),
    ip: c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "",
    socket: { remoteAddress: c.req.header("cf-connecting-ip") || "" },
    get: (name) => headers[String(name).toLowerCase()],
    header: (name) => headers[String(name).toLowerCase()],
  };

  return req;
};

const createResponseState = () => ({
  statusCode: 200,
  headers: new Headers(),
  body: "",
  sent: false,
});

const normalizeBody = (payload) => {
  if (payload === undefined || payload === null) return "";

  if (payload instanceof Uint8Array || payload instanceof ArrayBuffer) return payload;

  if (typeof payload === "object") return JSON.stringify(payload);

  return String(payload);
};

const buildRes = (state) => {
  const res = {
    locals: {},
    status(code) {
      state.statusCode = Number(code) || 200;
      return res;
    },
    setHeader(name, value) {
      state.headers.set(name, String(value));
      return res;
    },
    header(name, value) {
      state.headers.set(name, String(value));
      return res;
    },
    type(value) {
      state.headers.set("content-type", String(value));
      return res;
    },
    json(payload) {
      state.headers.set("content-type", "application/json; charset=utf-8");
      state.body = JSON.stringify(payload);
      state.sent = true;
      return res;
    },
    send(payload) {
      if (typeof payload === "object" && !(payload instanceof Uint8Array) && !(payload instanceof ArrayBuffer)) {
        state.headers.set("content-type", "application/json; charset=utf-8");
      }
      state.body = normalizeBody(payload);
      state.sent = true;
      return res;
    },
    end(payload = "") {
      state.body = normalizeBody(payload);
      state.sent = true;
      return res;
    },
  };

  return res;
};

const runStack = async (stack, req, res) => {
  const dispatch = async (index) => {
    if (index >= stack.length) return;

    const handler = stack[index];
    if (typeof handler !== "function") {
      return dispatch(index + 1);
    }

    let nextCalled = false;
    const next = async () => {
      nextCalled = true;
      return dispatch(index + 1);
    };

    const result = handler(req, res, next);
    if (result && typeof result.then === "function") {
      await result;
    }

    if (!res.__state.sent && nextCalled) {
      return;
    }
  };

  await dispatch(0);
};

export const adaptExpressHandlers = (...handlers) => {
  const stack = handlers.flat().filter(Boolean);

  return async (c) => {
    const req = await buildReq(c);
    const state = createResponseState();
    const res = buildRes(state);
    res.__state = state;

    try {
      await runStack(stack, req, res);
    } catch (error) {
      console.error("Route execution error:", error);
      if (!state.sent) {
        state.statusCode = 500;
        state.headers.set("content-type", "application/json; charset=utf-8");
        state.body = JSON.stringify({ msg: "Server error" });
        state.sent = true;
      }
    }

    if (!state.sent) {
      state.statusCode = 204;
      state.body = "";
      state.sent = true;
    }

    return new Response(state.body, {
      status: state.statusCode,
      headers: state.headers,
    });
  };
};
