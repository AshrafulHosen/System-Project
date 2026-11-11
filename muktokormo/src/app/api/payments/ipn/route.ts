import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleSslCommerzIpnRequest } from "@/lib/payments/callbacks";

export async function POST(request: NextRequest) {
  return handleSslCommerzIpnRequest(request);
}

export async function GET(request: NextRequest) {
  const hasParams = request.nextUrl.searchParams.has("tran_id");
  if (!hasParams) {
    return NextResponse.json({
      ok: true,
      service: "MuktoKormo SSLCOMMERZ Sandbox IPN Listener",
      sandbox: true,
    });
  }
  return handleSslCommerzIpnRequest(request);
}

