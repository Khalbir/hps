import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { paystack } from "@/lib/paystack";
import { validateArtisanNameMatch, NIGERIAN_BANKS } from "@/lib/banks";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: true, settings: {} });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { professional: true },
    });

    if (!user) {
      return NextResponse.json({ success: true, settings: {} });
    }

    const pro = user.professional;
    let docs: any = {};
    try {
      if (pro?.documents) docs = JSON.parse(pro.documents);
    } catch {}

    const registeredName =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      "Verified Artisan";

    const bankName = pro?.bankName || docs.bankName || "Access Bank";
    const bankAccount = pro?.bankAccount || docs.accountNumber || "";
    const accountName = pro?.accountName || docs.accountName || "";
    const bankCode =
      docs.bankCode ||
      NIGERIAN_BANKS.find((b) => b.name.toLowerCase() === bankName.toLowerCase())?.code ||
      "044";

    return NextResponse.json({
      success: true,
      registeredName,
      settings: {
        bankName,
        bankCode,
        accountNumber: bankAccount,
        accountName,
        radius: docs.radius || "25",
        isBankVerified: docs.isBankVerified || Boolean(bankAccount && accountName),
      },
    });
  } catch (error: any) {
    console.error("[Pro Settings GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch pro settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, bankName, bankCode, accountNumber, accountName: inputAccountName, radius } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { professional: true },
    });

    if (!user || !user.professional) {
      return NextResponse.json({ error: "Artisan profile not found" }, { status: 404 });
    }

    const registeredName =
      `${user.firstName || ""} ${user.lastName || ""}`.trim();

    let resolvedAccountName = inputAccountName || "";
    let isBankVerified = false;

    // If bank details provided, validate and resolve with Paystack
    if (accountNumber) {
      if (accountNumber.length !== 10) {
        return NextResponse.json(
          { error: "NUBAN account number must be exactly 10 digits." },
          { status: 400 }
        );
      }

      const effectiveBankCode =
        bankCode ||
        NIGERIAN_BANKS.find((b) => b.name.toLowerCase() === bankName.toLowerCase())?.code ||
        "044";

      // 1. Resolve Account with Paystack
      const resolution = await paystack.resolveNubanAccount(accountNumber, effectiveBankCode);
      if (resolution.success && resolution.accountName) {
        resolvedAccountName = resolution.accountName;
      }

      if (!resolvedAccountName) {
        return NextResponse.json(
          { error: "Could not resolve bank account name with the selected bank. Please check your account number and bank." },
          { status: 422 }
        );
      }

      // 2. Strict Name Matching Validation
      if (registeredName) {
        const matchResult = validateArtisanNameMatch(registeredName, resolvedAccountName);
        if (!matchResult.isValid) {
          return NextResponse.json(
            {
              error: `Name Mismatch Error: The bank account name "${resolvedAccountName}" does not match your registered artisan profile name "${registeredName}". For security and anti-fraud protection, bank accounts must belong to the registered professional.`,
              resolvedAccountName,
              registeredName,
              matchScore: matchResult.matchScore,
            },
            { status: 422 }
          );
        }
      }

      isBankVerified = true;
    }

    let docs: any = {};
    try {
      if (user.professional.documents) docs = JSON.parse(user.professional.documents);
    } catch {}

    const updatedDocs = {
      ...docs,
      bankName,
      bankCode,
      accountNumber,
      accountName: resolvedAccountName,
      radius: radius || docs.radius || "25",
      isBankVerified,
      bankSavedAt: new Date().toISOString(),
    };

    // Update Professional database record directly
    await prisma.professional.update({
      where: { userId },
      data: {
        bankName,
        bankAccount: accountNumber,
        accountName: resolvedAccountName,
        documents: JSON.stringify(updatedDocs),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bank payout details verified & saved successfully! Payouts are linked to your profile.",
      settings: {
        bankName,
        bankCode,
        accountNumber,
        accountName: resolvedAccountName,
        radius: radius || docs.radius || "25",
        isBankVerified,
      },
    });
  } catch (error: any) {
    console.error("[Pro Settings POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to save settings" }, { status: 500 });
  }
}
