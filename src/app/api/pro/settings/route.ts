import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: true, settings: {} });
    }

    const pro = await prisma.professional.findUnique({
      where: { userId },
    });

    if (!pro) {
      return NextResponse.json({ success: true, settings: {} });
    }

    let docs: any = {};
    try {
      if (pro.documents) docs = JSON.parse(pro.documents);
    } catch {}

    return NextResponse.json({
      success: true,
      settings: {
        bankName: docs.bankName || "Access Bank",
        accountNumber: docs.accountNumber || "",
        accountName: docs.accountName || "",
        radius: docs.radius || "25",
      },
    });
  } catch (error) {
    console.error("[Pro Settings GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch pro settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, bankName, accountNumber, accountName, radius } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const pro = await prisma.professional.findUnique({
      where: { userId },
    });

    if (!pro) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 });
    }

    let docs: any = {};
    try {
      if (pro.documents) docs = JSON.parse(pro.documents);
    } catch {}

    const updatedDocs = {
      ...docs,
      bankName,
      accountNumber,
      accountName,
      radius,
      bankSavedAt: new Date().toISOString(),
    };

    await prisma.professional.update({
      where: { userId },
      data: {
        documents: JSON.stringify(updatedDocs),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account bank payout details & dispatch preferences saved successfully!",
      settings: { bankName, accountNumber, accountName, radius },
    });
  } catch (error) {
    console.error("[Pro Settings POST Error]:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
