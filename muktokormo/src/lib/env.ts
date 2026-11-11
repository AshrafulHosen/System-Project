if (typeof window !== "undefined") {
  throw new Error("src/lib/env.ts cannot be imported in client-side code.");
}

export class PaymentConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentConfigError";
  }
}

export interface SupabaseServerEnv {
  url: string;
  anonKey: string;
}

export interface SupabaseAdminEnv {
  url: string;
  serviceRoleKey: string;
}

export interface SslCommerzSandboxEnv {
  storeId: string;
  storePassword: string;
  isLive: false;
  appUrl: string;
  sessionApiUrl: "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
  validationApiUrl: "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";
  refundApiUrl: "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php";
}

function assertNonEmptyEnv(name: string, placeholders: string[] = []): string {
  const val = process.env[name]?.trim();
  if (!val) {
    throw new PaymentConfigError(`Missing required server environment variable: ${name}`);
  }
  if (placeholders.includes(val)) {
    throw new PaymentConfigError(`Server environment variable ${name} still has a placeholder value.`);
  }
  return val;
}

function parseValidHttpUrl(name: string, raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new PaymentConfigError(`Invalid URL format for environment variable: ${name}`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new PaymentConfigError(`Environment variable ${name} must use http:// or https:// protocol.`);
  }
  return parsed.origin + parsed.pathname.replace(/\/+$/, "");
}

export function getSupabaseServerEnv(): SupabaseServerEnv {
  const urlRaw = assertNonEmptyEnv("NEXT_PUBLIC_SUPABASE_URL");
  const url = parseValidHttpUrl("NEXT_PUBLIC_SUPABASE_URL", urlRaw);
  const anonKey = assertNonEmptyEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, anonKey };
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  const { url } = getSupabaseServerEnv();
  const serviceRoleKey = assertNonEmptyEnv("SUPABASE_SERVICE_ROLE_KEY", [
    "your_supabase_service_role_key",
    "your_service_role_key",
  ]);
  return { url, serviceRoleKey };
}

export function getSslCommerzSandboxEnv(): SslCommerzSandboxEnv {
  const storeId = assertNonEmptyEnv("SSLCOMMERZ_STORE_ID", ["your_sandbox_store_id"]);
  const storePassword = assertNonEmptyEnv("SSLCOMMERZ_STORE_PASSWORD", ["your_sandbox_store_password"]);

  const rawIsLive = (process.env.SSLCOMMERZ_IS_LIVE ?? "false").trim().toLowerCase();
  if (rawIsLive !== "false") {
    throw new PaymentConfigError(
      "Live SSLCOMMERZ gateway is blocked. Set SSLCOMMERZ_IS_LIVE=false to keep sandbox mode enabled."
    );
  }

  const rawAppUrl = assertNonEmptyEnv("APP_URL", ["https://abc123.ngrok-free.app"]);
  const appUrl = parseValidHttpUrl("APP_URL", rawAppUrl);

  return {
    storeId,
    storePassword,
    isLive: false,
    appUrl,
    sessionApiUrl: "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    validationApiUrl: "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php",
    refundApiUrl: "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php",
  };
}

