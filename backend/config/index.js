const requiredKeys = ["CONNECTION_STRING", "JWT_SECRET"];

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  publicApiBaseUrl: process.env.PUBLIC_API_BASE_URL || `http://localhost:${Number(process.env.PORT || 4000)}${process.env.API_PREFIX || "/api/v1"}`,
  connectionString: process.env.CONNECTION_STRING || "",
  dbName: process.env.DB_NAME || "ITCP_database",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 12),
  fcmServiceAccountPath: process.env.FCM_SERVICE_ACCOUNT_PATH || "",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
};

const missing = requiredKeys.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.warn(`[config] Missing env key(s): ${missing.join(", ")}`);
}

module.exports = config;
