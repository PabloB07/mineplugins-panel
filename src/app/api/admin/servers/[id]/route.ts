import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Update server
 * PATCH /api/admin/servers/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const server = await prisma.serverStatus.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.ip !== undefined && { ip: body.ip }),
        ...(body.port !== undefined && { port: parseInt(body.port) }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
        ...(body.isOnline !== undefined && { isOnline: body.isOnline }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    return NextResponse.json({ server });
  } catch (error) {
    console.error("Update server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Delete server
 * DELETE /api/admin/servers/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.serverStatus.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
