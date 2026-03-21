import { NextRequest, NextResponse } from "next/server";
import { withPluginAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { toPanelLicenseDto } from "@/lib/license-utils";

interface GetBody {
  key: string;
  serverId?: string;
}

async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as GetBody;
    const key = (body.key || "").trim();

    if (!key) {
      return NextResponse.json({ license: null }, { status: 400 });
    }

    const license = await prisma.license.findUnique({
      where: { licenseKey: key },
      include: {
        product: true,
        user: true,
      },
    });

    if (!license) {
      return NextResponse.json({ license: null });
    }

    return NextResponse.json({
      license: toPanelLicenseDto(license),
    });
  } catch (error) {
    console.error("Paper license get error:", error);
    return NextResponse.json({ license: null }, { status: 500 });
  }
}

export const POST = withPluginAuth(handler);
