import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const providers: Record<string, boolean> = {};
  
  authOptions.providers.forEach((provider: { id: string }) => {
    providers[provider.id] = true;
  });
  
  return NextResponse.json(providers);
}