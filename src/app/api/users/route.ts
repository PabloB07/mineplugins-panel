import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { toSafeInt } from "@/lib/security";

/**
 * Helper function to log admin activities
 */
async function logActivity(data: {
  adminId: string;
  action: string;
  details?: string;
  targetUserId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    // For now, just log to console since schema needs migration
    console.log("Admin Activity:", data);
    // TODO: Implement proper activity logging when schema is migrated
    // await prisma.adminActivityLog.create({
    //   data: {
    //     adminId: data.adminId,
    //     action: data.action,
    //     details: data.details,
    //     targetUserId: data.targetUserId,
    //     ipAddress: data.ipAddress,
    //     userAgent: data.userAgent,
    //   },
    // });
  } catch (error) {
    console.error("Failed to log admin activity:", error);
  }
}

/**
 * Get all users (admin only)
 * GET /api/users
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const page = toSafeInt(searchParams.get("page"), {
      defaultValue: 1,
      min: 1,
      max: 100000,
    });
    const limit = toSafeInt(searchParams.get("limit"), {
      defaultValue: 25,
      min: 1,
      max: 100,
    });
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (role && role !== "all") {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          },
        },
        _count: {
          select: {
            licenses: true,
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ 
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    });

  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to get users" },
      { status: 500 }
    );
  }
}
