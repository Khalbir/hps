import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { calculateLogisticsFee, generateDeliveryOtp, addLogisticsTrackingMilestone } from "@/lib/logistics";
import { autoProcureBestMerchant, commitInventoryReservation } from "@/lib/marketplace";
import { validateDeliveryRegionAndZone } from "@/lib/regions";
import { initializePaystackTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerId,
      cartSessionId,
      procurementType = "DIRECT_PURCHASE", // DIRECT_PURCHASE or AUTO_PROCUREMENT
      items = [], // [{ productId, quantity }] or for auto-procurement: { partKeyword, categorySlug, requiredQty }
      deliveryAddress,
      deliveryCity = "Abuja",
      deliveryState = "FCT",
      serviceZoneId,
      deliveryCoords,
      customerNotes,
      paymentMethod = "PAYSTACK", // PAYSTACK or WALLET
      customerEmail,
      customerName,
      customerPhone,
    } = body;

    if (!deliveryAddress || !customerEmail) {
      return NextResponse.json(
        { error: "Delivery address and customer email are required for marketplace checkout." },
        { status: 400 }
      );
    }

    // Validate Region & Service Zone (Abuja Only Phase 1 Enforcement)
    const regionValidation = await validateDeliveryRegionAndZone({
      state: deliveryState,
      city: deliveryCity,
      latitude: deliveryCoords?.lat,
      longitude: deliveryCoords?.lng,
      serviceZoneId,
    });

    if (!regionValidation.isValid) {
      return NextResponse.json(
        { error: regionValidation.reason, isOutsideActiveRegion: true },
        { status: 400 }
      );
    }

    // 1. Resolve or Create User Record if not provided
    let user = null;
    if (customerId) {
      user = await prisma.user.findUnique({ where: { id: customerId } });
    }
    if (!user && customerEmail) {
      user = await prisma.user.findUnique({ where: { email: customerEmail.toLowerCase().trim() } });
      if (!user) {
        // Create lightweight customer account
        const nameParts = (customerName || "Customer").split(" ");
        user = await prisma.user.create({
          data: {
            email: customerEmail.toLowerCase().trim(),
            firstName: nameParts[0] || "Customer",
            lastName: nameParts.slice(1).join(" ") || "User",
            phone: customerPhone || null,
            password: crypto.randomBytes(16).toString("hex"),
            role: "CUSTOMER",
            isVerified: true,
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unable to identify or create customer account." }, { status: 400 });
    }

    // 2. Resolve Products & Merchants
    let orderItemsData: Array<{
      product: any;
      merchant: any;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    let totalWeightKg = 0;
    let pickupCoords = null;

    if (procurementType === "AUTO_PROCUREMENT") {
      // Auto-procurement Smart Select
      const autoMatch = await autoProcureBestMerchant({
        partKeyword: body.autoProcureQuery || items[0]?.partKeyword || "Replacement Part",
        categorySlug: body.categorySlug,
        deliveryCoords,
        requiredQuantity: items[0]?.quantity || 1,
      });

      if (!autoMatch.matched || !autoMatch.product) {
        return NextResponse.json(
          { error: autoMatch.reason || "Unable to auto-procure a verified merchant for this part." },
          { status: 400 }
        );
      }

      const qty = items[0]?.quantity || 1;
      orderItemsData.push({
        product: autoMatch.product,
        merchant: autoMatch.merchant,
        quantity: qty,
        unitPrice: autoMatch.product.price,
        totalPrice: autoMatch.product.price * qty,
      });
      totalWeightKg += (autoMatch.product.weightKg || 1) * qty;
      pickupCoords = {
        lat: autoMatch.merchant.latitude || 9.0765,
        lng: autoMatch.merchant.longitude || 7.4723,
      };
    } else {
      // Direct Purchase
      if (!items || items.length === 0) {
        return NextResponse.json({ error: "Cart is empty. Please select products to purchase." }, { status: 400 });
      }

      for (const item of items) {
        const product = await prisma.marketplaceProduct.findUnique({
          where: { id: item.productId },
          include: { merchant: true },
        });

        if (!product) {
          return NextResponse.json({ error: `Product ID ${item.productId} not found.` }, { status: 404 });
        }

        if (product.stockQuantity < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for "${product.title}". Only ${product.stockQuantity} remaining.` },
            { status: 400 }
          );
        }

        orderItemsData.push({
          product,
          merchant: product.merchant,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: product.price * item.quantity,
        });

        totalWeightKg += (product.weightKg || 1) * item.quantity;
        if (!pickupCoords && product.merchant.latitude) {
          pickupCoords = {
            lat: product.merchant.latitude,
            lng: product.merchant.longitude || 7.4723,
          };
        }
      }
    }

    // 3. Compute Logistics Delivery Fee
    const subtotal = orderItemsData.reduce((sum, item) => sum + item.totalPrice, 0);
    const logistics = calculateLogisticsFee({
      pickupCoords,
      deliveryCoords,
      weightKg: totalWeightKg,
      deliveryCity,
    });

    const totalAmount = subtotal + logistics.logisticsFee;

    // 4. Generate Order Reference and 6-Digit Delivery OTP
    const orderNumber = `HHP-MKT-${crypto.randomInt(10000, 99999)}`;
    const deliveryOtp = generateDeliveryOtp();
    const trackingNumber = `TRK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const paymentRef = `PAY-${orderNumber}-${Date.now()}`;

    // 5. Create Order in Database
    const order = await prisma.marketplaceOrder.create({
      data: {
        orderNumber,
        customerId: user.id,
        regionId: regionValidation.region?.id || null,
        serviceZoneId: regionValidation.zone?.id || null,
        procurementType,
        status: "PENDING_PAYMENT",
        subtotal,
        logisticsFee: logistics.logisticsFee,
        totalAmount,
        destinationAccount: "PROCUREMENT_ACCOUNT",
        paymentStatus: "PENDING",
        paymentMethod,
        paymentReference: paymentRef,
        deliveryAddress: typeof deliveryAddress === "string" ? deliveryAddress : JSON.stringify(deliveryAddress),
        deliveryCity,
        deliveryState,
        deliveryLatitude: deliveryCoords?.lat || null,
        deliveryLongitude: deliveryCoords?.lng || null,
        deliveryPartner: "HandyHub Priority Dispatch",
        trackingNumber,
        deliveryOtp,
        otpVerified: false,
        customerNotes,
        items: {
          create: orderItemsData.map((item) => ({
            productId: item.product.id,
            merchantId: item.merchant.id,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            merchantPayoutStatus: "ESCROW_HOLD",
            merchantPayoutAmount: item.totalPrice, // Payout held in HandyHub Procurement Account until delivery OTP verified
          })),
        },
      },
      include: {
        items: { include: { product: true, merchant: true } },
      },
    });

    // 6. Create Initial Logistics Tracking Milestone
    await addLogisticsTrackingMilestone({
      orderId: order.id,
      status: "ORDER_CONFIRMED",
      locationName: deliveryCity,
      notes: "Order placed. Awaiting merchant packaging and dispatch courier allocation.",
    });

    // 7. Commit Inventory Reservation if cart session exists
    if (cartSessionId) {
      await commitInventoryReservation(cartSessionId, order.id);
    }

    // 8. Handle Payment Initialization (Paystack Gateway)
    if (paymentMethod === "PAYSTACK") {
      const paystackRes = await initializePaystackTransaction({
        email: user.email,
        amountNgn: totalAmount,
        reference: paymentRef,
        callbackUrl: `${process.env.NEXTAUTH_URL || "https://handyhubpro.ng"}/marketplace/track/${order.orderNumber}?verified=1`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: user.id,
          type: "MARKETPLACE_PROCUREMENT",
          destinationAccount: "PROCUREMENT_ACCOUNT",
        },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber,
        subtotal: order.subtotal,
        logisticsFee: order.logisticsFee,
        totalAmount: order.totalAmount,
        paymentUrl: paystackRes.authorizationUrl,
        paymentReference: paymentRef,
      });
    }

    // If Wallet or Direct Mock (e.g. Test Mode)
    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      subtotal: order.subtotal,
      logisticsFee: order.logisticsFee,
      totalAmount: order.totalAmount,
      deliveryOtp: order.deliveryOtp,
    });
  } catch (error: any) {
    console.error("[Marketplace Checkout POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to process marketplace checkout." }, { status: 500 });
  }
}
