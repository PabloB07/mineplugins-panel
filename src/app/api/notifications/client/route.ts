import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getClientNotificationPayload } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const payload = await getClientNotificationPayload(session.user.id);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Client notifications error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
