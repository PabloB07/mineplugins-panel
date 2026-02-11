import { NextRequest, NextResponse } from "next/server";
import { withPluginAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

interface RevokeBody {
  key: string;
  serverId?: string;
}

async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as RevokeBody;
    const key = (body.key || "").trim();

    if (!key) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const updated = await prisma.license.updateMany({
      where: {
        licenseKey: key,
        status: {
          not: "REVOKED",
        },
      },
      data: {
        status: "REVOKED",
      },
    });

    return NextResponse.json({ success: updated.count > 0 });
  } catch (error) {
    console.error("Paper license revoke error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export const POST = withPluginAuth(handler);
