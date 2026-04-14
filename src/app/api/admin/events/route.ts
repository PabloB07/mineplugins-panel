import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { eventEmitter } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Please log in" },
        { status: 401 }
      );
    }

    const isAdmin =
      session.user.role === UserRole.ADMIN ||
      session.user.role === UserRole.SUPER_ADMIN;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Admin access required" },
        { status: 403 }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const sendEvent = (eventName: string, data: object) => {
          const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        const heartbeat = setInterval(() => {
          try {
            const message = `: heartbeat\n\n`;
            controller.enqueue(encoder.encode(message));
          } catch {
            clearInterval(heartbeat);
          }
        }, 30000);

        const unsubscribe = eventEmitter.subscribeAll((event) => {
          try {
            sendEvent(event.type, event.data);
          } catch (error) {
            console.error("Failed to send SSE event:", error);
          }
        });

        const keepAlive = setInterval(() => {
          if (eventEmitter.getListenerCount() === 0) {
            clearInterval(keepAlive);
            clearInterval(heartbeat);
            unsubscribe();
            controller.close();
          }
        }, 60000);

        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          clearInterval(keepAlive);
          unsubscribe();
          try {
            controller.close();
          } catch {
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("SSE connection error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to establish event stream" },
      { status: 500 }
    );
  }
}
