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
    const serverId = body.serverId;

    if (!key) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const license = await prisma.license.findUnique({
      where: { licenseKey: key },
      include: {
        activations: true,
      },
    });

    if (!license) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    if (serverId) {
      const activation = license.activations.find((a) => a.serverId === serverId);
      if (activation) {
        await prisma.licenseActivation.update({
          where: { id: activation.id },
          data: { isActive: false },
        });
      }
    } else {
      await prisma.license.update({
        where: { id: license.id },
        data: { status: "REVOKED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Paper license revoke error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export const POST = withPluginAuth(handler);
