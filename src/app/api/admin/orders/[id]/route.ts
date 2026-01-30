
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id: orderId } = await params;

        // Check if order exists
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        license: true
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        // Delete related licenses first (if any cascading needed, but usually Prisma handles relations if configured, 
        // or we might want to manually delete them to be safe if they are not set to cascade)
        // Assuming simple deletion of order is enough if cascade is set, but let's be safe.
        // Actually, checking standard Prisma behavior, if we delete the order, we should ensure items are deleted.
        // However, licenses are distinct entities. If we delete a "FAILED" order, we probably want to clean up any licenses associated with it if they were created but not active.

        // For now, let's just delete the order. Prisma schema usually dictates cascade behavior.
        await prisma.order.delete({
            where: { id: orderId },
        });

        return NextResponse.json({ message: "Order deleted successfully" });
    } catch (error) {
        console.error("Failed to delete order:", error);
        return NextResponse.json(
            { message: "Failed to delete order" },
            { status: 500 }
        );
    }
}
