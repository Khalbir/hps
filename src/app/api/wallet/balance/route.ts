import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "pro-user-demo-id";

  return NextResponse.json({
    userId,
    currency: "NGN",
    availableBalance: 142500,
    pendingEscrow: 25000,
    totalLifetimeEarnings: 1240000,
    history: [
      {
        id: "tx_101",
        type: "ESCROW_RELEASE",
        amount: 21250,
        description: "Net earnings from Deep Cleaning (Ref: HHP-M1K9X)",
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
      },
      {
        id: "tx_102",
        type: "WITHDRAWAL",
        amount: 50000,
        description: "NUBAN Bank Transfer to GTBank (0123456789)",
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  });
}
