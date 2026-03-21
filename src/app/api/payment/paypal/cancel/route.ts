import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || "https://mineplugins.vercel.app";

  // PayPal cancellation redirects here.
  return NextResponse.redirect(`${baseUrl}/downloads?error=paypal_cancelled`);
}

export async function POST(request: NextRequest) {
  return GET(request);
}

