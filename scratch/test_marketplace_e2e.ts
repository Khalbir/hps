import crypto from "crypto";
import { prisma } from "../src/lib/prisma";
import {
  ensureDefaultMarketplaceCategories,
  isMerchantActiveAndEligible,
  reserveProductInventory,
  commitInventoryReservation,
  autoProcureBestMerchant,
  STANDARD_SUBSCRIPTION_AMOUNT,
} from "../src/lib/marketplace";
import {
  calculateLogisticsFee,
  generateDeliveryOtp,
  addLogisticsTrackingMilestone,
  verifyOrderDeliveryOtp,
} from "../src/lib/logistics";
import {
  checkPriceAnomaly,
  computeInvoiceHash,
  isDuplicateInvoiceHash,
} from "../src/lib/fraud-prevention";

async function runMarketplaceE2ETestSuite() {
  console.log("================================================================================");
  console.log("🚀 STARTING HANDYHUB MARKETPLACE END-TO-END AUTOMATED VERIFICATION TEST SUITE");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // STEP 1: Categories Initialization & Future Architecture Verification
  // ---------------------------------------------------------------------------
  console.log("--- STEP 1: Initializing Marketplace Categories ---");
  await ensureDefaultMarketplaceCategories();

  const categories = await prisma.marketplaceCategory.findMany({ orderBy: { order: "asc" } });
  console.log(`Found ${categories.length} Marketplace Categories in database:`);
  categories.forEach((c) => {
    console.log(`  - [${c.isActive ? "ACTIVE (Phase 1)" : "DORMANT (Future)"}] ${c.name} (${c.type})`);
  });

  const activeReplacementParts = categories.find((c) => c.slug === "replacement-parts" && c.isActive);
  const dormantTools = categories.find((c) => c.slug === "tools-and-equipment" && !c.isActive);

  if (!activeReplacementParts || !dormantTools) {
    throw new Error("Category validation failed: Replacement Parts must be active, Tools must be dormant.");
  }
  console.log("✓ Step 1 Passed: Phase 1 replacement parts active; future categories properly dormant.\n");

  // ---------------------------------------------------------------------------
  // STEP 2: Merchant Onboarding & Monthly Subscription Enforcement
  // ---------------------------------------------------------------------------
  console.log("--- STEP 2: Testing Verified Merchant Onboarding & Subscription ---");

  const testMerchantEmail = `e2e.merchant.${Date.now()}@handyhubpro.ng`;
  const testUser = await prisma.user.create({
    data: {
      email: testMerchantEmail,
      firstName: "Maitama",
      lastName: "ElectroHub Supplies",
      phone: `+234803${Math.floor(1000000 + Math.random() * 9000000)}`,
      password: "HashedPassword123!",
      role: "CUSTOMER",
      cacNumber: "RC-849201",
      isVerified: true,
    },
  });

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const testMerchant = await prisma.merchant.create({
    data: {
      userId: testUser.id,
      businessName: "Abuja Central HVAC & Electro Mart",
      slug: `abuja-central-hvac-${Date.now()}`,
      cacNumber: "RC-849201",
      businessAddress: "Plot 14, Maitama Commercial District, Abuja",
      city: "Abuja",
      state: "FCT",
      latitude: 9.0882,
      longitude: 7.4984,
      phone: testUser.phone!,
      email: testMerchantEmail,
      bankName: "Guaranty Trust Bank",
      bankAccount: "0123984756",
      accountName: "Abuja HVAC Mart Ltd",
      verificationStatus: "VERIFIED",
      subscriptionStatus: "ACTIVE",
      subscriptionAmount: STANDARD_SUBSCRIPTION_AMOUNT,
      subscriptionStartedAt: now,
      subscriptionExpiresAt: thirtyDaysLater,
    },
  });

  const eligibility = await isMerchantActiveAndEligible(testMerchant.id);
  if (!eligibility.eligible) {
    throw new Error(`Merchant eligibility failed: ${eligibility.reason}`);
  }
  console.log(`✓ Merchant "${testMerchant.businessName}" verified with active monthly subscription (Expires: ${thirtyDaysLater.toLocaleDateString()}).\n`);

  // ---------------------------------------------------------------------------
  // STEP 3: Catalog Listing & Price Anomaly Detection
  // ---------------------------------------------------------------------------
  console.log("--- STEP 3: Catalog Listing & Price Anomaly Checks ---");

  // 3a. Normal Priced Replacement Part
  const normalProduct = await prisma.marketplaceProduct.create({
    data: {
      merchantId: testMerchant.id,
      categoryId: activeReplacementParts.id,
      sku: `SKU-E2E-${Date.now().toString().slice(-6)}`,
      title: "Daikin 1.5HP AC Rotary Compressor R410A",
      slug: `daikin-15hp-compressor-${Date.now()}`,
      description: "OEM Genuine Japanese Daikin 1.5HP R410A Inverter Compressor.",
      partNumber: "2YC23V110",
      brand: "Daikin",
      price: 85000,
      stockQuantity: 15,
      weightKg: 12.5,
      compatibility: JSON.stringify(["Daikin FT15", "Panasonic Inverter 1.5HP", "LG Dual Inverter"]),
      images: JSON.stringify(["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500"]),
      status: "ACTIVE",
      isVerified: true,
      priceAnomalyFlag: false,
    },
  });

  // 3b. Gouged Priced Part (Test Anomaly Detection)
  const gougedPrice = 550000; // Benchmark ceiling is ₦450,000 for replacement parts
  const anomalyCheck = checkPriceAnomaly({
    categorySlug: "replacement-parts",
    price: gougedPrice,
  });

  if (!anomalyCheck.isAnomaly) {
    throw new Error("Fraud Prevention failed: Price ₦550,000 should have been flagged as anomaly!");
  }
  console.log(`✓ Fraud Guard successfully detected price anomaly: "${anomalyCheck.reason}"`);
  console.log(`✓ Published authentic part: "${normalProduct.title}" (₦${normalProduct.price.toLocaleString()}, Stock: ${normalProduct.stockQuantity})\n`);

  // ---------------------------------------------------------------------------
  // STEP 4: 15-Minute Inventory Reservation Window
  // ---------------------------------------------------------------------------
  console.log("--- STEP 4: Testing 15-Minute Inventory Reservation Lock ---");

  const cartSessionId = `SESS-E2E-${Date.now()}`;
  const reserveRes = await reserveProductInventory({
    productId: normalProduct.id,
    customerId: testUser.id,
    cartSessionId,
    quantity: 2,
  });

  if (!reserveRes.success) {
    throw new Error(`Inventory reservation failed: ${reserveRes.error}`);
  }
  console.log(`✓ Successfully locked 2 units in reservation window (Session: ${cartSessionId}).`);

  // Test over-reservation prevention
  const overReserve = await reserveProductInventory({
    productId: normalProduct.id,
    customerId: "another_customer",
    cartSessionId: "another_session",
    quantity: 14, // 15 total stock - 2 reserved = 13 available. 14 should fail!
  });

  if (overReserve.success) {
    throw new Error("Overselling safeguard failed: Session was allowed to reserve more than available unreserved stock!");
  }
  console.log(`✓ Overselling safeguard active: Rejected excess reservation (${overReserve.error}).\n`);

  // ---------------------------------------------------------------------------
  // STEP 5: Dynamic Logistics Fee Engine
  // ---------------------------------------------------------------------------
  console.log("--- STEP 5: Testing Abuja Logistics Fee Calculation Engine ---");

  // Case A: Intra-zone (Maitama to Wuse 2: ~3 km)
  const intraZoneLogistics = calculateLogisticsFee({
    pickupCoords: { lat: 9.0882, lng: 7.4984 }, // Maitama
    deliveryCoords: { lat: 9.0765, lng: 7.4723 }, // Wuse 2
    weightKg: 2,
  });
  console.log(`  - Intra-Zone (Maitama -> Wuse 2, ${intraZoneLogistics.distanceKm} km): ₦${intraZoneLogistics.logisticsFee} (Est: ${intraZoneLogistics.estimatedMinutes} mins)`);

  // Case B: Cross-zone + Heavy Part (Maitama to Lugbe: ~22 km, 12.5 kg compressor)
  const crossZoneLogistics = calculateLogisticsFee({
    pickupCoords: { lat: 9.0882, lng: 7.4984 }, // Maitama
    deliveryCoords: { lat: 8.9743, lng: 7.3789 }, // Lugbe
    weightKg: 12.5,
  });
  console.log(`  - Cross-Zone Heavy Part (Maitama -> Lugbe, ${crossZoneLogistics.distanceKm} km, 12.5kg): ₦${crossZoneLogistics.logisticsFee} (Est: ${crossZoneLogistics.estimatedMinutes} mins)`);

  if (crossZoneLogistics.logisticsFee <= intraZoneLogistics.logisticsFee) {
    throw new Error("Logistics calculation error: Cross-zone heavy trip should cost more than intra-zone trip.");
  }
  console.log("✓ Step 5 Passed: Dynamic logistics calculation validated.\n");

  // ---------------------------------------------------------------------------
  // STEP 6: Customer Checkout & Dedicated Procurement Payment Routing
  // ---------------------------------------------------------------------------
  console.log("--- STEP 6: Customer Checkout & Order Creation ---");

  const orderNumber = `HHP-MKT-${Math.floor(10000 + Math.random() * 90000)}`;
  const deliveryOtp = generateDeliveryOtp();
  const trackingNumber = `TRK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const subtotal = normalProduct.price * 2;
  const totalAmount = subtotal + crossZoneLogistics.logisticsFee;

  const order = await prisma.marketplaceOrder.create({
    data: {
      orderNumber,
      customerId: testUser.id,
      procurementType: "DIRECT_PURCHASE",
      status: "PROCESSING",
      subtotal,
      logisticsFee: crossZoneLogistics.logisticsFee,
      totalAmount,
      destinationAccount: "PROCUREMENT_ACCOUNT",
      paymentStatus: "PAID",
      paymentMethod: "PAYSTACK",
      paymentReference: `PAY-E2E-${Date.now()}`,
      deliveryAddress: "Plot 89, Sector F, Lugbe Commercial Estate, Abuja",
      deliveryCity: "Abuja",
      deliveryState: "FCT",
      deliveryPartner: "HandyHub Priority Dispatch",
      trackingNumber,
      deliveryOtp,
      otpVerified: false,
      items: {
        create: [
          {
            productId: normalProduct.id,
            merchantId: testMerchant.id,
            unitPrice: normalProduct.price,
            quantity: 2,
            totalPrice: subtotal,
            merchantPayoutStatus: "ESCROW_HOLD",
            merchantPayoutAmount: subtotal,
          },
        ],
      },
    },
    include: { items: true },
  });

  // Commit reservation & deduct stock
  await commitInventoryReservation(cartSessionId, order.id);

  const updatedProduct = await prisma.marketplaceProduct.findUnique({ where: { id: normalProduct.id } });
  console.log(`✓ Order #${order.orderNumber} placed for ₦${order.totalAmount.toLocaleString()} (Funds routed to ${order.destinationAccount}).`);
  console.log(`✓ Stock atomically decremented from 15 to ${updatedProduct?.stockQuantity}.`);
  console.log(`✓ Customer Delivery Security OTP Generated: [${order.deliveryOtp}]\n`);

  // ---------------------------------------------------------------------------
  // STEP 7: Auto-Procurement Smart Select Matching
  // ---------------------------------------------------------------------------
  console.log("--- STEP 7: Testing HandyHub Smart Select Auto-Procurement ---");

  const smartSelectMatch = await autoProcureBestMerchant({
    partKeyword: "Daikin",
    deliveryCoords: { lat: 9.0882, lng: 7.4984 },
    requiredQuantity: 1,
  });

  if (!smartSelectMatch.matched || !smartSelectMatch.merchant) {
    throw new Error("Smart Select failed to match verified merchant with in-stock part.");
  }
  console.log(`✓ Smart Select successfully matched nearest verified supplier: "${smartSelectMatch.merchant.businessName}" (Match Score: ${smartSelectMatch.score}/100).\n`);

  // ---------------------------------------------------------------------------
  // STEP 8: Dispatch Timeline & Customer 6-Digit OTP Delivery Confirmation
  // ---------------------------------------------------------------------------
  console.log("--- STEP 8: Real-Time Dispatch Pipeline & OTP Confirmation ---");

  // 8a. Merchant marks packed
  await addLogisticsTrackingMilestone({
    orderId: order.id,
    status: "MERCHANT_PACKED",
    locationName: "Maitama Store",
    notes: "Part packed in OEM shockproof box. Dispatch courier assigned.",
  });

  // 8b. Courier in transit
  await addLogisticsTrackingMilestone({
    orderId: order.id,
    status: "IN_TRANSIT",
    locationName: "Airport Expressway, Lugbe",
    notes: "Courier en-route with part.",
    riderName: "Rider Musa Ibrahim",
    riderPhone: "+2348039998877",
  });

  // 8c. Customer submits wrong OTP -> Should Fail
  const wrongOtpAttempt = await verifyOrderDeliveryOtp({
    orderId: order.id,
    submittedOtp: "000000",
  });
  if (wrongOtpAttempt.success) {
    throw new Error("Security failure: Invalid OTP was accepted!");
  }
  console.log("✓ Invalid OTP attempt safely rejected.");

  // 8d. Customer submits correct OTP -> Should Disburse & Mark Delivered
  const validOtpConfirmation = await verifyOrderDeliveryOtp({
    orderId: order.id,
    submittedOtp: order.deliveryOtp!,
  });

  if (!validOtpConfirmation.success || validOtpConfirmation.order.status !== "DELIVERED") {
    throw new Error("Delivery OTP verification failed.");
  }

  const updatedOrderItem = await prisma.marketplaceOrderItem.findFirst({
    where: { orderId: order.id },
  });

  if (updatedOrderItem?.merchantPayoutStatus !== "DISBURSED") {
    throw new Error("Payout disbursement status failed to update to DISBURSED upon delivery confirmation.");
  }

  console.log(`✓ Valid OTP [${order.deliveryOtp}] verified successfully!`);
  console.log(`✓ Order status updated to: ${validOtpConfirmation.order.status}`);
  console.log(`✓ Merchant payout status: ${updatedOrderItem.merchantPayoutStatus} (Ref: ${updatedOrderItem.disbursementReference}).\n`);

  // ---------------------------------------------------------------------------
  // STEP 9: Duplicate Invoice Fraud Guard
  // ---------------------------------------------------------------------------
  console.log("--- STEP 9: Testing Duplicate Invoice / Receipt Fraud Guard ---");

  const sampleInvoicePayload = `INVOICE-SUPPLIER-001-${order.orderNumber}`;
  const invoiceHash = computeInvoiceHash(sampleInvoicePayload);

  await prisma.marketplaceOrder.update({
    where: { id: order.id },
    data: { invoiceHash },
  });

  const duplicateCheck = await isDuplicateInvoiceHash(invoiceHash);
  if (!duplicateCheck.isDuplicate || duplicateCheck.matchedOrderId !== order.orderNumber) {
    throw new Error("Duplicate invoice detection failed to recognize previously submitted hash.");
  }
  console.log(`✓ Duplicate Invoice Hash correctly identified and blocked (Matched Order #${duplicateCheck.matchedOrderId}).\n`);

  console.log("================================================================================");
  console.log("🎉 ALL 9 HANDYHUB MARKETPLACE END-TO-END TEST MODULES PASSED WITH 100% SUCCESS!");
  console.log("================================================================================");
}

runMarketplaceE2ETestSuite()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
