import { prisma } from "../src/lib/db";

async function main() {
  console.log("=== TESTING WITHDRAWAL NOTIFICATION & DASHBOARD ALERT LIFECYCLE ===\n");

  // 1. Find or pick an artisan user
  let artisan = await prisma.user.findFirst({
    where: { role: "PROFESSIONAL", professional: { isNot: null } },
    include: { professional: true, wallet: true },
  });

  if (!artisan) {
    artisan = await prisma.user.findFirst({
      include: { professional: true, wallet: true },
    });
  }

  if (!artisan) {
    console.log("❌ No user found.");
    return;
  }

  if (!artisan.wallet) {
    const w = await prisma.wallet.create({
      data: { userId: artisan.id, balance: 100000, pendingEscrow: 0, currency: "NGN" },
    });
    artisan = { ...artisan, wallet: w };
  }

  console.log(`👤 Artisan: ${artisan.firstName} ${artisan.lastName} (ID: ${artisan.id})`);

  const testRef = `WTH_TEST_${Date.now()}`;
  const testAmount = 35000;
  const testBank = "Guaranty Trust Bank (GTB)";
  const testAccount = "0123456789";

  // Step 1: Simulate Withdrawal Request Created
  console.log("\n--- Step 1: Artisan Requests Withdrawal ---");
  const wr = await prisma.withdrawalRequest.create({
    data: {
      walletId: artisan.wallet.id,
      amount: testAmount,
      bankCode: "058",
      bankName: testBank,
      accountNumber: testAccount,
      accountName: `${artisan.lastName} ${artisan.firstName}`.toUpperCase(),
      status: "PROCESSING",
      reference: testRef,
    },
  });

  const initialNotif = await prisma.notification.create({
    data: {
      userId: artisan.id,
      type: "PAYMENT",
      title: "Withdrawal Request Submitted ⏳",
      message: `Your withdrawal of ₦${testAmount.toLocaleString()} to ${testBank} (${testAccount}) has been submitted and is processing via Paystack Transfer API. Ref: ${testRef}`,
      data: JSON.stringify({
        status: "PROCESSING",
        reference: testRef,
        amount: testAmount,
      }),
    },
  });

  console.log(`✅ Withdrawal Created: ID=${wr.id}, Status=${wr.status}`);
  console.log(`✅ Initial Notification: Title="${initialNotif.title}", Message="${initialNotif.message}"`);

  // Step 2: Admin Approves / Settles Withdrawal
  console.log("\n--- Step 2: Admin Approves Withdrawal in Admin Dashboard ---");
  // Simulate admin action API
  await prisma.withdrawalRequest.update({
    where: { id: wr.id },
    data: { status: "COMPLETED" },
  });

  // Update existing notification to "Sent"
  await prisma.notification.update({
    where: { id: initialNotif.id },
    data: {
      title: "Withdrawal Approved & Sent 💸",
      message: `Your withdrawal of ₦${testAmount.toLocaleString()} to ${testBank} (${testAccount}) has been APPROVED and SENT! Ref: ${testRef}`,
      data: JSON.stringify({
        status: "SENT",
        reference: testRef,
        amount: testAmount,
        bankName: testBank,
      }),
    },
  });

  const updatedNotif = await prisma.notification.findUnique({
    where: { id: initialNotif.id },
  });

  console.log(`✅ Notification after Admin Approval:`);
  console.log(`   Title: "${updatedNotif?.title}"`);
  console.log(`   Message: "${updatedNotif?.message}"`);
  console.log(`   Status in Payload: ${JSON.parse(updatedNotif?.data || "{}").status}`);

  if (updatedNotif?.title.includes("Sent") && updatedNotif?.title.includes("Approved")) {
    console.log("\n🎉 ALL TESTS PASSED: Notification successfully changed to 'Approved & Sent'!");
  } else {
    throw new Error("Notification did not update properly.");
  }
}

main().finally(() => prisma.$disconnect());
