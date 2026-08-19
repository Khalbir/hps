import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logPartAudit, ensureDefaultSuppliers, disburseFundsToSupplier } from "@/lib/parts";

export async function GET(req: Request) {
  try {
    await ensureDefaultSuppliers();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") {
      if (status === "PROCUREMENT_PAID") {
        where.destinationAccount = "PROCUREMENT_ACCOUNT";
      } else {
        where.status = status;
      }
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { partName: { contains: search, mode: "insensitive" } },
        { voucherCode: { contains: search, mode: "insensitive" } },
        { disbursementReference: { contains: search, mode: "insensitive" } },
        { booking: { reference: { contains: search, mode: "insensitive" } } },
        { customer: { firstName: { contains: search, mode: "insensitive" } } },
        { customer: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [
      parts,
      suppliers,
      totalCount,
      fraudCount,
      totalProcurementVolume,
      totalDisbursedToSuppliers,
      pendingSupplierDisbursement,
      pendingApprovalCount,
      activeVouchersCount,
    ] = await Promise.all([
      prisma.replacementPart.findMany({
        where,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          professional: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, phone: true } },
            },
          },
          supplier: true,
          booking: {
            select: {
              id: true,
              reference: true,
              status: true,
              address: true,
              service: { select: { name: true } },
            },
          },
          auditLogs: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.partSupplier.findMany({
        orderBy: { rating: "desc" },
      }),
      prisma.replacementPart.count(),
      prisma.replacementPart.count({ where: { status: "FLAGGED_FRAUD" } }),
      // Dedicated Account 2 Total Procurement Volume
      prisma.replacementPart.aggregate({
        where: {
          OR: [
            { destinationAccount: "PROCUREMENT_ACCOUNT" },
            { paymentStatus: { in: ["DIRECT_PROCUREMENT_PAID", "DISBURSED_TO_SUPPLIER", "PAID_ESCROW"] } },
          ],
        },
        _sum: { approvedCost: true },
      }),
      // Total Disbursed directly to Merchant Bank accounts
      prisma.replacementPart.aggregate({
        where: { disbursementStatus: "DISBURSED_TO_SUPPLIER" },
        _sum: { approvedCost: true },
      }),
      // Pending direct merchant disbursement
      prisma.replacementPart.aggregate({
        where: { disbursementStatus: "PENDING_DISBURSEMENT", paymentStatus: "DIRECT_PROCUREMENT_PAID" },
        _sum: { approvedCost: true },
      }),
      prisma.replacementPart.count({ where: { status: "REQUESTED" } }),
      prisma.replacementPart.count({ where: { status: "VOUCHER_ISSUED" } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalCount,
        fraudCount,
        totalProcurementVolumeNgn: totalProcurementVolume._sum.approvedCost || 0,
        totalDisbursedToSuppliersNgn: totalDisbursedToSuppliers._sum.approvedCost || 0,
        pendingSupplierDisbursementNgn: pendingSupplierDisbursement._sum.approvedCost || 0,
        pendingApprovalCount,
        activeVouchersCount,
      },
      parts,
      suppliers,
    });
  } catch (err: any) {
    console.error("[Admin Parts GET Error]", err);
    return NextResponse.json(
      { error: "Failed to fetch replacement parts administration data." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, partId, supplierData, adminNotes } = body;

    // 1. ADD / UPDATE SUPPLIER
    if (action === "SAVE_SUPPLIER") {
      const { id, name, category, contactPerson, phone, email, address, city, state, bankName, bankAccount, accountName, paystackRecipientCode, settlementType, isVerified } =
        supplierData || {};

      if (!name || !phone || !address) {
        return NextResponse.json(
          { error: "Supplier Name, Phone, and Address are required." },
          { status: 400 }
        );
      }

      if (id) {
        const updated = await prisma.partSupplier.update({
          where: { id },
          data: {
            name,
            category: (category || "GENERAL").toUpperCase(),
            contactPerson,
            phone,
            email,
            address,
            city: city || "Abuja",
            state: state || "FCT",
            bankName,
            bankAccount,
            accountName,
            paystackRecipientCode: paystackRecipientCode || null,
            settlementType: settlementType || "INSTANT_TRANSFER",
            isVerified: isVerified !== undefined ? isVerified : true,
          },
        });
        return NextResponse.json({ success: true, message: "Supplier updated successfully.", supplier: updated });
      } else {
        const created = await prisma.partSupplier.create({
          data: {
            name,
            category: (category || "GENERAL").toUpperCase(),
            contactPerson,
            phone,
            email,
            address,
            city: city || "Abuja",
            state: state || "FCT",
            bankName,
            bankAccount,
            accountName,
            paystackRecipientCode: paystackRecipientCode || null,
            settlementType: settlementType || "INSTANT_TRANSFER",
            isVerified: true,
          },
        });
        return NextResponse.json({ success: true, message: "New verified supplier added.", supplier: created });
      }
    }

    // 2. DISBURSE FUNDS TO SUPPLIER BANK (Account 2 Fast Direct Payout)
    if (action === "DISBURSE_SUPPLIER") {
      if (!partId) return NextResponse.json({ error: "Part ID is required." }, { status: 400 });

      const disbResult = await disburseFundsToSupplier(
        partId,
        "ADMIN",
        adminNotes || "Manual administrative instant disbursement from Dedicated Procurement Account."
      );

      return NextResponse.json({
        success: true,
        message: `⚡ Successfully disbursed ₦${disbResult.amount.toLocaleString()} to ${disbResult.supplier.name} (${disbResult.supplier.bankName}: ${disbResult.supplier.bankAccount}). Ref: ${disbResult.disbursementReference}`,
        disbursement: disbResult,
      });
    }

    // 3. REDEEM VOUCHER (Merchant Confirmation)
    if (action === "REDEEM_VOUCHER") {
      if (!partId) {
        return NextResponse.json({ error: "Part ID is required." }, { status: 400 });
      }

      const part = await prisma.replacementPart.findUnique({ where: { id: partId } });
      if (!part) return NextResponse.json({ error: "Part not found." }, { status: 404 });

      const updated = await prisma.replacementPart.update({
        where: { id: partId },
        data: {
          status: "PURCHASED",
          voucherRedeemedAt: new Date(),
          voucherRedeemedBy: "Admin / Merchant Confirmation",
          adminNotes: adminNotes || part.adminNotes,
        },
      });

      await logPartAudit({
        partId: part.id,
        actorRole: "ADMIN",
        action: "VOUCHER_REDEEMED",
        notes: `Admin confirmed voucher redemption for ${part.partName} (${part.voucherCode}).`,
      });

      return NextResponse.json({ success: true, message: "Voucher marked as redeemed.", part: updated });
    }

    // 4. RESOLVE FRAUD FLAG
    if (action === "RESOLVE_FRAUD") {
      if (!partId) return NextResponse.json({ error: "Part ID is required." }, { status: 400 });

      const part = await prisma.replacementPart.findUnique({ where: { id: partId } });
      if (!part) return NextResponse.json({ error: "Part not found." }, { status: 404 });

      const updated = await prisma.replacementPart.update({
        where: { id: partId },
        data: {
          status: "INSTALLED_VERIFIED",
          adminNotes: `[FRAUD CLEARED] Admin manually reviewed and cleared flag: ${adminNotes || "Legitimate receipt verified"}`,
        },
      });

      await logPartAudit({
        partId: part.id,
        actorRole: "ADMIN",
        action: "INSTALLED",
        notes: `Fraud flag manually resolved by Admin. Reason: ${adminNotes || "Approved upon manual audit"}`,
      });

      return NextResponse.json({ success: true, message: "Fraud flag resolved.", part: updated });
    }

    return NextResponse.json({ error: "Invalid admin action." }, { status: 400 });
  } catch (err: any) {
    console.error("[Admin Parts POST Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute admin replacement parts action." },
      { status: 500 }
    );
  }
}
