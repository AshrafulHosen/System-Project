import type { NextConfig } from "next";

const devOrigins = new Set<string>([
  "localhost",
  "127.0.0.1",
  "*.ngrok-free.dev",
  "**.ngrok-free.dev",
  "*.ngrok-free.app",
  "**.ngrok-free.app",
  "*.ngrok.io",
  "**.ngrok.io",
]);

if (process.env.APP_URL) {
  try {
    const parsedHost = new URL(process.env.APP_URL).hostname;
    if (parsedHost) {
      devOrigins.add(parsedHost);
    }
  } catch {
    // Ignore malformed APP_URL values during config loading
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: Array.from(devOrigins),
};

export default nextConfig;
