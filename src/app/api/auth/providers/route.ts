import { NextResponse } from "next/server";

export async function GET() {
  // Returns the available auth providers for the login page
  const providers: Record<string, boolean> = {
    discord: true,
  };

  return NextResponse.json(providers);
}