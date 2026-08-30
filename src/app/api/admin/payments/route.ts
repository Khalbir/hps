import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { purgeDemoRecordsFromDB, DEMO_EMAILS, DEMO_PAYMENT_REFS } from "@/lib/purge-demo-utility";
import { verifyAndRecordPayment } from "@/lib/fintech";
import { paystack } from "@/lib/paystack";
import { autoClearStaleEscrowsFromDB } from "@/lib/escrow";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Automatically purge demo records and auto-clear inactive escrows older than 14 days to preserve database storage
    await purgeDemoRecordsFromDB();
    const staleClearResult = await autoClearStaleEscrowsFromDB(14);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const provider = searchParams.get("provider");

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // 1. Fetch database payments from Payment table (strictly within 14-day active retention)
    const where: any = {
      reference: { notIn: DEMO_PAYMENT_REFS },
      createdAt: { gte: fourteenDaysAgo },
    };
    if (status && status !== "ALL") where.status = status;
    if (provider && provider !== "ALL") where.provider = provider;

    let rawPayments: any[] = [];
    try {
      rawPayments = await prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          booking: {
            select: {
              id: true,
              reference: true,
              status: true,
              service: { select: { name: true } },
            },
          },
        },
      });
    } catch (err) {
      console.warn("[Admin Payments DB Warning - Payments]:", err);
    }

    // 2. Fetch paid bookings from Booking table (strictly within 14-day retention)
    let rawPaidBookings: any[] = [];
    try {
      rawPaidBookings = await prisma.booking.findMany({
        where: {
          paymentStatus: { in: ["PAID", "HELD_IN_ESCROW", "RELEASED", "REFUNDED"] },
          customer: { email: { notIn: DEMO_EMAILS } },
          createdAt: { gte: fourteenDaysAgo },
        },
        include: {
          customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
          service: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (err) {
      console.warn("[Admin Payments DB Warning - Bookings]:", err);
    }

    const existingRefsSet = new Set(rawPayments.map((p) => p.reference));

    // Convert paid bookings without duplicate payment records into payment format
    const bookingPayments = rawPaidBookings
      .filter((b) => !existingRefsSet.has(`PAY_${b.reference}`) && !existingRefsSet.has(b.reference))
      .map((b) => ({
        id: `pay_bkg_${b.id}`,
        reference: `PAY_${b.reference}`,
        bookingId: b.id,
        booking: { id: b.id, reference: b.reference, status: b.status, service: b.service },
        amount: b.estimatedPrice,
        currency: "NGN",
        provider: b.paymentMethod ? b.paymentMethod.toUpperCase() : "PAYSTACK",
        status: b.paymentStatus === "REFUNDED" ? "REFUNDED" : "SUCCESS",
        metadata: "{}",
        user: b.customer,
        createdAt: b.createdAt,
      }));

    bookingPayments.forEach((bp) => existingRefsSet.add(bp.reference));

    // 3. Query Live Paystack REST API for True Real-Time Transactions (within 14-day window)
    let livePaystackTxs: any[] = [];
    try {
      const paystackRes = await paystack.listTransactions({ perPage: 50 });
      if (paystackRes.success && Array.isArray(paystackRes.data)) {
        livePaystackTxs = paystackRes.data
          .filter((tx: any) => {
            const txDate = new Date(tx.created_at || tx.createdAt || Date.now());
            return !existingRefsSet.has(tx.reference) && txDate >= fourteenDaysAgo;
          })
          .map((tx) => {
            const rawChannel = tx.channel || tx.authorization?.channel || "card";
            const meta = tx.metadata || {};
            const custName = `${tx.customer?.first_name || ""} ${tx.customer?.last_name || ""}`.trim() || meta.customerName || (tx.customer?.email ? tx.customer.email.split("@")[0] : "Paystack Customer");

            return {
              id: `paystack_${tx.id}`,
              reference: tx.reference,
              bookingId: meta.bookingId || null,
              booking: {
                id: meta.bookingId || null,
                reference: meta.bookingRef || `BKG-${tx.reference.slice(0, 8).toUpperCase()}`,
                status: tx.status === "success" ? "CONFIRMED" : "PENDING",
                service: { name: meta.serviceName || "HandyHub Pro On-Demand Service" },
              },
              amount: tx.amount / 100,
              currency: tx.currency || "NGN",
              provider: "PAYSTACK",
              status: tx.status === "success" ? "SUCCESS" : tx.status === "failed" ? "FAILED" : "PENDING",
              metadata: JSON.stringify({
                channel: rawChannel,
                cardType: tx.authorization?.card_type || "N/A",
                last4: tx.authorization?.last4 || "••••",
                bank: tx.authorization?.bank || "N/A",
                gatewayResponse: tx.gateway_response,
                fees: tx.fees ? tx.fees / 100 : 0,
                ipAddress: tx.ip_address,
                authorizationCode: tx.authorization?.authorization_code || null,
                isLivePaystackApi: true,
              }),
              user: {
                firstName: custName.split(" ")[0] || "Paystack",
                lastName: custName.split(" ").slice(1).join(" ") || "Client",
                email: tx.customer?.email || "customer@paystack.co",
                phone: tx.customer?.phone || meta.customerPhone || "N/A",
              },
              createdAt: tx.created_at || new Date().toISOString(),
              isLivePaystack: true,
            };
          });
      }
    } catch (paystackErr) {
      console.warn("[Admin Payments Paystack Live Sync Notice]:", paystackErr);
    }

    // Combine all payments (Database + Bookings + Live Paystack API)
    const allPaymentsCombined = [...rawPayments, ...bookingPayments, ...livePaystackTxs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const filteredPayments = allPaymentsCombined.filter(
      (p) => !p.user || !DEMO_EMAILS.includes(p.user.email)
    );

    // 4. Fetch Artisan Bank Withdrawal Requests
    let rawWithdrawals: any[] = [];
    try {
      rawWithdrawals = await prisma.withdrawalRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  professional: { select: { id: true, digitalId: true } },
                },
              },
            },
          },
        },
      });
    } catch (wErr) {
      console.warn("[Admin Payments DB Warning - Withdrawals]:", wErr);
    }

    const formattedWithdrawals = rawWithdrawals.map((w) => ({
      id: w.id,
      reference: w.reference,
      amount: w.amount,
      bankName: w.bankName,
      bankCode: w.bankCode,
      accountNumber: w.accountNumber,
      accountName: w.accountName,
      status: w.status || "PROCESSING",
      createdAt: w.createdAt,
      date: new Date(w.createdAt).toLocaleString(),
      artisanName: w.wallet?.user ? `${w.wallet.user.firstName} ${w.wallet.user.lastName}` : w.accountName,
      artisanEmail: w.wallet?.user?.email || "artisan@handyhubpro.ng",
      artisanPhone: w.wallet?.user?.phone || "N/A",
      digitalId: w.wallet?.user?.professional?.digitalId || "HHP-PRO",
      walletId: w.walletId,
    }));

    const totalSuccessPayments = filteredPayments.filter((p) => p.status === "SUCCESS");
    const totalSuccessNgn = totalSuccessPayments.reduce((acc, curr) => acc + curr.amount, 0);

    const paystackSuccessPayments = totalSuccessPayments.filter(
      (p) => p.provider === "PAYSTACK" || p.provider === "PAYSTACK_LIVE"
    );
    const paystackVolumeNgn = paystackSuccessPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // Active escrow holding (80% net artisan funds held before job sign-off)
    const escrowHeldNgn = Math.round(totalSuccessNgn * 0.80);
    const platformFeeNgn = Math.round(totalSuccessNgn * 0.20);
    const totalWithdrawnNgn = formattedWithdrawals
      .filter((w) => w.status === "COMPLETED" || w.status === "APPROVED")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const pendingWithdrawalNgn = formattedWithdrawals
      .filter((w) => w.status === "PROCESSING" || w.status === "PENDING")
      .reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json({
      success: true,
      payments: filteredPayments,
      withdrawals: formattedWithdrawals,
      stats: {
        totalSuccessNgn,
        paystackVolumeNgn: paystackVolumeNgn || totalSuccessNgn,
        platformFeeNgn,
        escrowHeldNgn,
        totalWithdrawnNgn,
        pendingWithdrawalNgn,
        pendingWithdrawalsCount: formattedWithdrawals.filter((w) => w.status === "PROCESSING" || w.status === "PENDING").length,
        failedCount: filteredPayments.filter((p) => p.status === "FAILED").length,
        totalCount: filteredPayments.length,
        livePaystackCount: livePaystackTxs.length,
        retentionDays: 14,
        storagePolicy: "Incoming client escrows older than 14 days auto-cleared to preserve storage",
      },
    });
  } catch (error: any) {
    console.error("[Payments GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch payments: " + error.message }, { status: 500 });
  }
}

/**
 * POST handler for Admin Manual Payment Verification & Reconciliation & Escrow Clearance
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference, provider, action } = body;

    if (action === "SYNC_LIVE_PAYSTACK") {
      const paystackRes = await paystack.listTransactions({ perPage: 50 });
      return NextResponse.json({
        success: true,
        message: "Paystack live API synced successfully!",
        data: paystackRes.data,
      });
    }

    if (action === "CLEAR_STALE_ESCROWS") {
      const clearRes = await autoClearStaleEscrowsFromDB(14);
      return NextResponse.json({
        success: true,
        message: `Successfully cleared ${clearRes.totalRecordsCleared} inactive escrow records (>14 days). Reclaimed ~${clearRes.estimatedKbSaved}KB storage!`,
        data: clearRes,
      });
    }

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 });
    }

    const verification = await verifyAndRecordPayment(reference, provider || "PAYSTACK");

    return NextResponse.json({
      success: true,
      verification,
      message: `Transaction ${reference} verification processed live: ${verification.status}`,
    });
  } catch (error: any) {
    console.error("[Admin Payment POST Error]:", error);
    return NextResponse.json({ error: "Manual verification error: " + error.message }, { status: 500 });
  }
}
