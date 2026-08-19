import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const disputes = await prisma.marketplaceDispute.findMany({
      include: {
        order: true,
        orderItem: {
          include: {
            product: true,
          },
        },
        customer: true,
        merchant: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      disputes,
    });
  } catch (error: any) {
    console.error("[Admin Disputes API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load marketplace disputes." },
      { status: 500 }
    );
  }
}
