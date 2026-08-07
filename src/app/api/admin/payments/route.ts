import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const provider = searchParams.get("provider");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (provider && provider !== "ALL") where.provider = provider;

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        booking: { select: { reference: true } },
      },
    });

    const successPayments = payments.filter((p) => p.status === "SUCCESS");
    const totalSuccessNgn = successPayments.reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json({
      success: true,
      payments,
      stats: {
        totalSuccessNgn,
        platformFeeNgn: Math.round(totalSuccessNgn * 0.15),
        failedCount: payments.filter((p) => p.status === "FAILED").length,
        totalCount: payments.length,
      },
    });
  } catch (error) {
    console.error("[Payments GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
