import { prisma } from "../src/lib/prisma";
import {
  ensureDefaultMarketplaceRegionsAndZones,
  getActiveMarketplaceRegions,
  validateDeliveryRegionAndZone,
  calculateZoneLogisticsFee,
} from "../src/lib/regions";
import { autoProcureBestMerchant } from "../src/lib/marketplace";
import { createMarketplaceDispute, resolveMarketplaceDispute } from "../src/lib/disputes";

async function runTest() {
  console.log("\n=======================================================");
  console.log("  HANDYHUB MARKETPLACE REGIONS & DISPUTES E2E TEST");
  console.log("=======================================================\n");

  // 1. Seed & Verify Regions
  console.log("[Test 1] Testing Region & Service Zone Seeding...");
  await ensureDefaultMarketplaceRegionsAndZones();
  const activeRegions = await getActiveMarketplaceRegions();
  console.log(`✓ Active Regions count: ${activeRegions.length}`);
  const fct = activeRegions.find((r) => r.code === "FCT");
  if (!fct) throw new Error("FCT (Abuja) region should be ACTIVE");
  console.log(`✓ FCT (Abuja) is ACTIVE with ${fct.serviceZones.length} service zones`);

  const allRegions = await prisma.marketplaceRegion.findMany();
  console.log(`✓ Total Regions in DB: ${allRegions.length}`);
  const lagos = allRegions.find((r) => r.code === "LA");
  if (!lagos || lagos.isMarketplaceActive) throw new Error("Lagos should be dormant (isMarketplaceActive: false) in Phase 1");
  console.log(`✓ Lagos State is dormant (isMarketplaceActive = false)`);

  // 2. Validate Abuja vs Non-Abuja Delivery Requests
  console.log("\n[Test 2] Testing Delivery Region & Zone Enforcement...");
  const validAbujaCheck = await validateDeliveryRegionAndZone({
    state: "FCT",
    city: "Abuja",
  });
  console.log(`✓ Abuja validation: isValid = ${validAbujaCheck.isValid}`);
  if (!validAbujaCheck.isValid) throw new Error("Abuja validation failed");

  const invalidLagosCheck = await validateDeliveryRegionAndZone({
    state: "Lagos State",
    city: "Ikeja",
  });
  console.log(`✓ Lagos validation: isValid = ${invalidLagosCheck.isValid}, Reason = "${invalidLagosCheck.reason}"`);
  if (invalidLagosCheck.isValid) throw new Error("Lagos should be rejected in Phase 1");

  // 3. Test GPS Verified Merchant Smart Select
  console.log("\n[Test 3] Testing GPS Verified Merchant Auto-Procurement...");
  const autoProcureResult = await autoProcureBestMerchant({
    partKeyword: "Compressor",
    deliveryCoords: { lat: 9.0765, lng: 7.4723 },
    requiredQuantity: 1,
  });
  console.log(`✓ Auto-Procure Matched: ${autoProcureResult.matched}`);
  if (autoProcureResult.matched && autoProcureResult.merchant) {
    console.log(`✓ Selected Merchant: ${autoProcureResult.merchant.businessName} (GPS Verified: ${autoProcureResult.merchant.isGpsVerified})`);
  }

  // 4. Test Dispute Lifecycle on a Test Order
  console.log("\n[Test 4] Testing Dispute Creation & Escrow Payout Freezing...");
  // Create or find dummy customer, merchant, product, and order
  let testUser = await prisma.user.findFirst({ where: { email: "dispute_tester@handyhubpro.ng" } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: "dispute_tester@handyhubpro.ng",
        firstName: "Test",
        lastName: "Disputer",
        password: "hashedpassword123",
        role: "CUSTOMER",
      },
    });
  }

  let testMerchant = await prisma.merchant.findFirst();
  let testProduct = await prisma.marketplaceProduct.findFirst();

  if (!testMerchant || !testProduct) {
    console.log("No merchant/product found to build order. Skipping order creation portion.");
  } else {
    const testOrder = await prisma.marketplaceOrder.create({
      data: {
        orderNumber: `TEST-ORD-${Date.now()}`,
        customerId: testUser.id,
        procurementType: "DIRECT_PURCHASE",
        status: "PROCESSING",
        subtotal: 45000,
        logisticsFee: 1500,
        totalAmount: 46500,
        destinationAccount: "PROCUREMENT_ACCOUNT",
        paymentStatus: "PAID",
        paymentMethod: "WALLET",
        deliveryAddress: "Wuse 2, Abuja",
        deliveryCity: "Abuja",
        deliveryState: "FCT",
        deliveryPartner: "HandyHub Priority Dispatch",
        trackingNumber: `TRK-TEST-${Date.now()}`,
        deliveryOtp: "123456",
        items: {
          create: [
            {
              productId: testProduct.id,
              merchantId: testMerchant.id,
              unitPrice: 45000,
              quantity: 1,
              totalPrice: 45000,
              merchantPayoutStatus: "ESCROW_HOLD",
              merchantPayoutAmount: 45000,
            },
          ],
        },
      },
      include: { items: true },
    });

    console.log(`✓ Created test order #${testOrder.orderNumber} with merchant payout in ESCROW_HOLD`);

    // Create Dispute
    const disputeRes = await createMarketplaceDispute({
      orderId: testOrder.id,
      orderItemId: testOrder.items[0].id,
      customerId: testUser.id,
      reason: "DAMAGED_IN_TRANSIT",
      description: "Compressor terminal cracked during motorbike transit.",
    });

    if (!disputeRes.success || !disputeRes.dispute) {
      throw new Error(`Dispute creation failed: ${disputeRes.error}`);
    }

    console.log(`✓ Dispute created: #${disputeRes.dispute.disputeNumber} (Status: ${disputeRes.dispute.status})`);

    // Verify order status and payout status
    const updatedOrder = await prisma.marketplaceOrder.findUnique({
      where: { id: testOrder.id },
      include: { items: true },
    });

    console.log(`✓ Order status updated to: ${updatedOrder?.status}`);
    console.log(`✓ Order item payout status updated to: ${updatedOrder?.items[0].merchantPayoutStatus}`);

    if (updatedOrder?.status !== "DISPUTED") throw new Error("Order status should be DISPUTED");
    if (updatedOrder?.items[0].merchantPayoutStatus !== "FROZEN_DISPUTE") throw new Error("Payout should be FROZEN_DISPUTE");

    // 5. Test Dispute Resolution: Customer Refund
    console.log("\n[Test 5] Testing Admin Dispute Resolution (Customer Refund)...");
    const resolveRes = await resolveMarketplaceDispute({
      disputeId: disputeRes.dispute.id,
      resolution: "RESOLVED_REFUND_CUSTOMER",
      resolutionNotes: "Dispute approved. Part returned to hub. Full refund credited to customer wallet.",
      refundAmount: 45000,
    });

    if (!resolveRes.success) {
      throw new Error(`Resolution failed: ${resolveRes.error}`);
    }

    console.log(`✓ Dispute resolved: Status = ${resolveRes.dispute?.status}`);

    const refundedOrder = await prisma.marketplaceOrder.findUnique({
      where: { id: testOrder.id },
      include: { items: true },
    });

    console.log(`✓ Order status after refund: ${refundedOrder?.status}`);
    console.log(`✓ Order item payout after refund: ${refundedOrder?.items[0].merchantPayoutStatus}`);
    if (refundedOrder?.status !== "REFUNDED") throw new Error("Order status should be REFUNDED");
    if (refundedOrder?.items[0].merchantPayoutStatus !== "REFUNDED") throw new Error("Payout should be REFUNDED");
  }

  console.log("\n=======================================================");
  console.log("  ALL MARKETPLACE REGIONS & DISPUTES TESTS PASSED! 🚀");
  console.log("=======================================================\n");
}

runTest()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
