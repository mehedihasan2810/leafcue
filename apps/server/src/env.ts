export const env = {
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;
