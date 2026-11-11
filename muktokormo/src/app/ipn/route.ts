import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleSslCommerzIpnRequest } from "@/lib/payments/callbacks";

/**
 * Top-level /ipn route matching store-level SSLCOMMERZ IPN configuration
 * (e.g., https://<ngrok-domain>/ipn) alongside /api/payments/ipn.
 */
export async function POST(request: NextRequest) {
  return handleSslCommerzIpnRequest(request);
}

export async function GET(request: NextRequest) {
  const hasParams = request.nextUrl.searchParams.has("tran_id");
  if (!hasParams) {
    return NextResponse.json({
      ok: true,
      service: "MuktoKormo SSLCOMMERZ Sandbox IPN Listener (/ipn)",
      sandbox: true,
    });
  }
  return handleSslCommerzIpnRequest(request);
}

