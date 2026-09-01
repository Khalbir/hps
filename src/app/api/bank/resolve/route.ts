import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { paystack } from "@/lib/paystack";
import { validateArtisanNameMatch } from "@/lib/banks";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountNumber, bankCode, userId, registeredName: inputRegisteredName } = body;

    if (!accountNumber || accountNumber.length !== 10 || !bankCode) {
      return NextResponse.json(
        { error: "10-digit account number and valid bank code are required." },
        { status: 400 }
      );
    }

    // 1. Resolve Account with Paystack
    const resolution = await paystack.resolveNubanAccount(accountNumber, bankCode);
    if (!resolution.success || !resolution.accountName) {
      return NextResponse.json(
        { error: resolution.error || "Unable to resolve account number with the bank. Please check your account number and bank." },
        { status: 422 }
      );
    }

    const resolvedAccountName = resolution.accountName;

    // 2. Resolve Artisan Profile Name
    let officialName = inputRegisteredName || "";

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { professional: true },
      });

      if (user) {
        officialName =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.professional?.accountName ||
          officialName;
      }
    }

    // 3. Perform Smart Name Matching
    const matchResult = officialName
      ? validateArtisanNameMatch(officialName, resolvedAccountName)
      : {
          isValid: true,
          matchScore: 100,
          reason: "No registered name provided for comparison.",
        };

    return NextResponse.json({
      success: true,
      accountNumber,
      accountName: resolvedAccountName,
      registeredName: officialName,
      nameMatches: matchResult.isValid,
      matchScore: matchResult.matchScore,
      matchReason: matchResult.reason,
    });
  } catch (error: any) {
    console.error("[Bank Resolve API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resolve bank account" },
      { status: 500 }
    );
  }
}
