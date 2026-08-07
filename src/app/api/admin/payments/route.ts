import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_SEED_PAYMENTS = [
  {
    reference: "HHP_BKG_100293_17820",
    bookingRef: "BKG-10293",
    email: "audu@test.com",
    firstName: "Audu",
    lastName: "Yerima",
    amount: 18500,
    provider: "PAYSTACK",
    status: "SUCCESS",
  },
  {
    reference: "HHP_BKG_100344_17835",
    bookingRef: "BKG-10344",
    email: "sarah@test.com",
    firstName: "Sarah",
    lastName: "Chineke",
    amount: 24000,
    provider: "PAYSTACK",
    status: "SUCCESS",
  },
  {
    reference: "HHP_BKG_100392_17840",
    bookingRef: "BKG-10392",
    email: "ibrahim@test.com",
    firstName: "Ibrahim",
    lastName: "Musa",
    amount: 15000,
    provider: "MONNIFY",
    status: "PENDING",
  },
  {
    reference: "HHP_BKG_100412_17855",
    bookingRef: "BKG-10412",
    email: "emeka@test.com",
    firstName: "Emeka",
    lastName: "Nwachukwu",
    amount: 32000,
    provider: "PAYSTACK",
    status: "FAILED",
  },
];

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const provider = searchParams.get("provider");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (provider && provider !== "ALL") where.provider = provider;

    let payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        booking: { select: { reference: true } },
      },
    });

    // AUTO-SEED: If 0 payments in database, seed sample records
    if (payments.length === 0 && (!status || status === "ALL") && (!provider || provider === "ALL")) {
      // 1. Resolve or create fallback Category & Service
      let category = await prisma.serviceCategory.findFirst();
      if (!category) {
        try {
          category = await prisma.serviceCategory.create({
            data: {
              name: "Electrical Maintenance",
              slug: "electrical-maintenance",
              description: "Electrical wiring and fixes",
            },
          });
        } catch {
          category = { id: "cat_fallback" } as any;
        }
      }

      let service = await prisma.service.findFirst();
      if (!service && category) {
        try {
          service = await prisma.service.create({
            data: {
              name: "Electrical Repair",
              slug: "electrical-repair",
              description: "Fixing faults and wiring",
              categoryId: category.id,
              basePrice: 15000,
            },
          });
        } catch {
          service = { id: "srv_fallback" } as any;
        }
      }

      for (const seed of DEFAULT_SEED_PAYMENTS) {
        try {
          // Resolve or create mock customer user
          let user = await prisma.user.findFirst({ where: { email: seed.email } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: seed.email,
                firstName: seed.firstName,
                lastName: seed.lastName,
                phone: "+2348030001122",
                password: "hashedPassword123!",
                role: "CUSTOMER",
              },
            });
          }

          // Resolve or create mock booking
          let booking = await prisma.booking.findFirst({ where: { reference: seed.bookingRef } });
          if (!booking && service) {
            booking = await prisma.booking.create({
              data: {
                reference: seed.bookingRef,
                customerId: user.id,
                serviceId: service.id,
                scheduledDate: new Date(),
                scheduledTime: "10:00 AM",
                estimatedPrice: seed.amount,
                status: seed.status === "SUCCESS" ? "ACCEPTED" : "PENDING",
                paymentStatus: seed.status === "SUCCESS" ? "PAID" : "PENDING",
                address: JSON.stringify({ address: "12 Wuse II, Abuja", city: "Abuja" }),
              },
            });
          }

          if (booking) {
            await prisma.payment.create({
              data: {
                reference: seed.reference,
                bookingId: booking.id,
                userId: user.id,
                amount: seed.amount,
                currency: "NGN",
                provider: seed.provider,
                status: seed.status,
                metadata: JSON.stringify({ customerName: `${seed.firstName} ${seed.lastName}` }),
              },
            });
          }
        } catch (e) {
          console.warn("[Auto-Seed Payment Error]:", e);
        }
      }

      // Re-fetch seeded payments
      payments = await prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          booking: { select: { reference: true } },
        },
      });
    }

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
