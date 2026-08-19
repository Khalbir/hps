import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // PENDING, VERIFIED, REJECTED, SUSPENDED

    const whereClause: any = {};
    if (status && status !== "ALL") {
      whereClause.verificationStatus = status;
    }

    const merchants = await prisma.merchant.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            cacNumber: true,
          },
        },
        _count: {
          select: {
            products: true,
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      merchants: merchants.map((m) => ({
        ...m,
        productCount: m._count.products,
        salesCount: m._count.orderItems,
      })),
    });
  } catch (error: any) {
    console.error("[Admin Merchants GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch merchants" }, { status: 500 });
  }
}
