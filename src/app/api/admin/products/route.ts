import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";

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

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        image: image || null,
        price: priceCLP,
        salePrice: salePriceCLP,
        priceUSD,
        priceCLP,
        salePriceUSD,
        salePriceCLP,
        defaultDurationDays,
        maxActivations,
        isActive,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
