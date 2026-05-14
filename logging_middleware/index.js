const LOG_API_URL =
  process.env.LOG_API_URL || "http://4.224.186.213/evaluation-service/logs";
const LOG_AUTH_TOKEN = process.env.LOG_AUTH_TOKEN || process.env.ACCESS_TOKEN;

const VALID_STACKS = new Set(["backend", "frontend"]);
const VALID_LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
const VALID_PACKAGES = new Set([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "middleware",
  "repository",
  "route",
  "service",
]);

const getLogHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (LOG_AUTH_TOKEN) {
    headers.Authorization = `Bearer ${LOG_AUTH_TOKEN}`;
  }

  return headers;
};

const buildLogPayload = (stack, level, packageName, message) => {
  const payload = {
    stack: String(stack || "").toLowerCase(),
    level: String(level || "").toLowerCase(),
    package: String(packageName || "").toLowerCase(),
    message: String(message || "No log message provided"),
  };

  if (!VALID_STACKS.has(payload.stack)) {
    throw new Error(`Invalid stack value: ${stack}`);
  }

  if (!VALID_LEVELS.has(payload.level)) {
    throw new Error(`Invalid level value: ${level}`);
  }

  if (!VALID_PACKAGES.has(payload.package)) {
    throw new Error(`Invalid package value: ${packageName}`);
  }

  return payload;
};

export const Log = async (stack, level, packageName, message) => {
  try {
    const payload = buildLogPayload(stack, level, packageName, message);

    const response = await fetch(LOG_API_URL, {
      method: "POST",
      headers: getLogHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `Log API failed with status ${response.status}: ${payload.message}`
      );
    }

    return response;
  } catch (error) {
    console.error("Log API error:", error.message);
    return null;
  }
};

export const loggingMiddleware = async (req, res, next) => {
  const startedAt = Date.now();

  await Log(
    "backend",
    "info",
    "middleware",
    `Incoming request started: method=${req.method}, url=${req.originalUrl}, ip=${req.ip}`
  );

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    Log(
      "backend",
      level,
      "middleware",
      `Request completed: method=${req.method}, url=${req.originalUrl}, status=${res.statusCode}, duration=${durationMs}ms`
    );
  });

  next();
};

export const errorLoggingMiddleware = async (err, req, res, next) => {
  await Log(
    "backend",
    "error",
    "middleware",
    `Unhandled error: method=${req.method}, url=${req.originalUrl}, message=${err.message}`
  );

  next(err);
};

export default loggingMiddleware;
