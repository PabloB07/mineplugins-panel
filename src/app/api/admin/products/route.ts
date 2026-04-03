import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";
import { generateProductApiToken } from "@/lib/api-auth";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.download.deleteMany({ where: { version: { productId } } }),
      prisma.orderItem.deleteMany({ where: { productId } }),
      prisma.licenseActivation.deleteMany({ where: { license: { productId } } }),
      prisma.license.deleteMany({ where: { productId } }),
      prisma.pluginVersion.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as string;
    const icon = formData.get("icon") as string;
    const priceUSD = parseFloat(formData.get("priceUSD") as string);
    const priceCLP = parseInt(formData.get("priceCLP") as string);
    const salePriceUSD = formData.get("salePriceUSD") ? parseFloat(formData.get("salePriceUSD") as string) : null;
    const salePriceCLP = formData.get("salePriceCLP") ? parseInt(formData.get("salePriceCLP") as string) : null;
    const defaultDurationDays = parseInt(formData.get("defaultDurationDays") as string);
    const maxActivations = parseInt(formData.get("maxActivations") as string);
    const isActive = formData.get("isActive") === "on";

    if (!name || !slug || !priceUSD || !priceCLP) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: `A product with slug "${slug}" already exists` },
        { status: 400 }
      );
    }

    const apiToken = generateProductApiToken();

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        image: image || null,
        icon: icon || null,
        price: priceCLP,
        salePrice: salePriceCLP,
        priceUSD,
        priceCLP,
        salePriceUSD,
        salePriceCLP,
        defaultDurationDays,
        maxActivations,
        isActive,
        apiToken,
      },
    });

    return NextResponse.json({
      ...product,
      apiToken,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { productId, action } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (action === "generateToken" || action === "regenerateToken") {
      const newToken = generateProductApiToken();
      const updated = await prisma.product.update({
        where: { id: productId },
        data: { apiToken: newToken },
      });
      return NextResponse.json({
        apiToken: updated.apiToken,
      });
    }

    if (action === "getToken") {
      return NextResponse.json({
        apiToken: product.apiToken,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
