import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Secure download endpoint - validates license before serving file
 * GET /api/download?versionId=xxx&license=xxx
 * OR /api/download?versionId=xxx (requires session)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const versionId = searchParams.get("versionId");
    const licenseKey = searchParams.get("license");
    const session = await getServerSession(authOptions);

    if (!versionId) {
      return NextResponse.json(
        { error: "MISSING_VERSION", message: "Version ID is required" },
        { status: 400 }
      );
    }

    if (licenseKey) {
      const license = await prisma.license.findFirst({
        where: {
          licenseKey: licenseKey,
          status: "ACTIVE",
        },
        include: {
          product: {
            include: {
              versions: true,
            },
          },
        },
      });

      if (!license) {
        return NextResponse.json(
          { error: "INVALID_LICENSE", message: "Invalid or expired license" },
          { status: 403 }
        );
      }

      if (new Date() > new Date(license.expiresAt)) {
        return NextResponse.json(
          { error: "LICENSE_EXPIRED", message: "License has expired" },
          { status: 403 }
        );
      }

      const hasAccess = license.product.versions.some(v => v.id === versionId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: "ACCESS_DENIED", message: "This version is not associated with your license" },
          { status: 403 }
        );
      }
    } else if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Login required or provide license key" },
        { status: 401 }
      );
    }

    const version = await prisma.pluginVersion.findUnique({
      where: { id: versionId },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: "VERSION_NOT_FOUND", message: "Version not found" },
        { status: 404 }
      );
    }

    if (!version.downloadUrl) {
      return NextResponse.json(
        { error: "NO_DOWNLOAD_URL", message: "Download URL not configured for this version" },
        { status: 404 }
      );
    }

    const filename = `${version.product.slug}-${version.version}.jar`;

    try {
      const fileResponse = await fetch(version.downloadUrl);
      
      if (!fileResponse.ok) {
        console.error("Failed to fetch file from blob storage:", fileResponse.status);
        return NextResponse.json(
          { error: "DOWNLOAD_FAILED", message: "Failed to retrieve file" },
          { status: 500 }
        );
      }

      const fileBuffer = await fileResponse.arrayBuffer();
      const contentType = fileResponse.headers.get("content-type") || "application/java-archive";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": fileBuffer.byteLength.toString(),
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    } catch (fetchError) {
      console.error("Error fetching file:", fetchError);
      return NextResponse.json(
        { error: "DOWNLOAD_ERROR", message: "Error retrieving file from storage" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Download API error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
