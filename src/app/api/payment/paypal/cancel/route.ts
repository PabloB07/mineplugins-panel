import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || "https://mineplugins.vercel.app";
  return NextResponse.redirect(`${baseUrl}/downloads?error=paypal_cancelled`);
}

export async function POST() {
  return GET();
}
