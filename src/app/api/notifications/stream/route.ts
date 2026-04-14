import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getAdminNotificationPayload, getClientNotificationPayload } from "@/lib/notifications";

export const runtime = "nodejs";

const encoder = new TextEncoder();

type StreamScope = "client" | "admin";

async function resolvePayload(scope: StreamScope, userId: string) {
  if (scope === "admin") {
    return getAdminNotificationPayload();
  }
  return getClientNotificationPayload(userId);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const scopeParam = request.nextUrl.searchParams.get("scope");
  const scope: StreamScope = scopeParam === "admin" ? "admin" : "client";

  if (scope === "admin") {
    const isAdmin =
      session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN;
    if (!isAdmin) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let lastPayload = "";

      const writeEvent = (payload: unknown) => {
        const body = JSON.stringify(payload);
        controller.enqueue(encoder.encode(`data: ${body}\n\n`));
      };

      const heartbeat = () => {
        controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
      };

      const tick = async () => {
        if (closed) return;
        try {
          const payload = await resolvePayload(scope, session.user.id);
          const serialized = JSON.stringify(payload);
          if (serialized !== lastPayload) {
            lastPayload = serialized;
            writeEvent(payload);
          } else {
            heartbeat();
          }
        } catch {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: "STREAM_ERROR" })}\n\n`
            )
          );
        }
      };

      tick();
      const interval = setInterval(tick, 5000);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
