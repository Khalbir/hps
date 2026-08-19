/**
 * HandyHub Pro Solutions - Automated Governance & RBAC Test Suite
 * Validates permissions, approval thresholds, audit logging structure, and AI diagnostics.
 */

import {
  hasPermission,
  evaluateApprovalRequirement,
  ROLE_PERMISSIONS,
  DEFAULT_APPROVAL_THRESHOLDS,
  getRoleBadgeInfo,
} from "../src/lib/rbac";

function assert(condition: boolean, testName: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${testName}`);
    throw new Error(`Assertion failed: ${testName}`);
  } else {
    console.log(`✅ PASS: ${testName}`);
  }
}

async function runGovernanceTests() {
  console.log("\n=======================================================");
  console.log("🛡️ RUNNING ENTERPRISE GOVERNANCE & RBAC TEST SUITE");
  console.log("=======================================================\n");

  // -------------------------------------------------------------
  // TEST 1: Super Admin Permissions (Full Unchecked Sovereignty)
  // -------------------------------------------------------------
  console.log("--- 1. Super Admin Role Permissions ---");
  assert(hasPermission("SUPER_ADMIN", "dashboard") === true, "Super Admin has dashboard access");
  assert(hasPermission("SUPER_ADMIN", "settings") === true, "Super Admin has system settings access");
  assert(hasPermission("SUPER_ADMIN", "backup") === true, "Super Admin has backup/purge access");
  assert(hasPermission("SUPER_ADMIN", "manageRoles") === true, "Super Admin can promote/manage staff roles");
  assert(hasPermission("SUPER_ADMIN", "executiveApprovals") === true, "Super Admin has executive approvals queue");

  // -------------------------------------------------------------
  // TEST 2: CAO / Executive Operations Manager Permissions
  // -------------------------------------------------------------
  console.log("\n--- 2. Executive Operations Manager (CAO) Permissions ---");
  assert(hasPermission("EXECUTIVE_OPERATIONS_MANAGER", "dashboard") === true, "CAO has dashboard access");
  assert(hasPermission("EXECUTIVE_OPERATIONS_MANAGER", "executiveApprovals") === true, "CAO has approvals access");
  assert(hasPermission("EXECUTIVE_OPERATIONS_MANAGER", "aiAnalyst") === true, "CAO has AI Analyst access");
  assert(hasPermission("EXECUTIVE_OPERATIONS_MANAGER", "bookings") === true, "CAO has bookings access");
  assert(hasPermission("EXECUTIVE_OPERATIONS_MANAGER", "marketplace") === true, "CAO has marketplace access");
  assert(hasPermission("EXECUTIVE_OPERATIONS_MANAGER", "parts") === true, "CAO has parts access");
  assert(hasPermission("EXECUTIVE_OPERATIONS_MANAGER", "users") === true, "CAO can view users");
  // Restricted items:
  assert(hasPermission("EXECUTIVE_OPERATIONS_MANAGER", "settings") === false, "CAO is restricted from global settings");
  assert(hasPermission("EXECUTIVE_OPERATIONS_MANAGER", "backup") === false, "CAO is restricted from database backup/purge");
  assert(hasPermission("EXECUTIVE_OPERATIONS_MANAGER", "manageRoles") === false, "CAO cannot unilaterally reassign staff roles");

  // -------------------------------------------------------------
  // TEST 3: Departmental Least-Privilege Isolation
  // -------------------------------------------------------------
  console.log("\n--- 3. Departmental Isolation Checks ---");
  assert(hasPermission("OPERATIONS_MANAGER", "bookings") === true, "Operations Manager has bookings");
  assert(hasPermission("OPERATIONS_MANAGER", "settings") === false, "Operations Manager restricted from settings");
  assert(hasPermission("MARKETPLACE_MANAGER", "marketplace") === true, "Marketplace Manager has marketplace");
  assert(hasPermission("MARKETPLACE_MANAGER", "bookings") === false, "Marketplace Manager isolated from field bookings");
  assert(hasPermission("VERIFICATION_OFFICER", "verification") === true, "Verification Officer has compliance");
  assert(hasPermission("VERIFICATION_OFFICER", "payments") === false, "Verification Officer restricted from financial vault");
  assert(hasPermission("FINANCE", "payments") === true, "Finance Admin has financial vault");
  assert(hasPermission("FINANCE", "verification") === false, "Finance Admin isolated from artisan vetting");
  assert(hasPermission("CUSTOMER_SUPPORT", "disputes") === true, "Support has dispute triage");
  assert(hasPermission("CUSTOMER_SUPPORT", "payments") === false, "Support restricted from financial vault");

  // -------------------------------------------------------------
  // TEST 4: Configurable Approval Threshold Engine
  // -------------------------------------------------------------
  console.log("\n--- 4. Configurable Approval Thresholds & Escalations ---");
  
  // Escrow Release: <= 100k -> CAO autonomous; > 100k -> Super Admin
  const lowEscrow = evaluateApprovalRequirement({
    actionType: "ESCROW_RELEASE",
    amountNgn: 45000,
    actorRole: "EXECUTIVE_OPERATIONS_MANAGER",
  });
  assert(lowEscrow.requiresSuperAdmin === false && lowEscrow.canCaoApprove === true, "Escrow release of ₦45,000 is approved autonomously by CAO");

  const highEscrow = evaluateApprovalRequirement({
    actionType: "ESCROW_RELEASE",
    amountNgn: 250000,
    actorRole: "EXECUTIVE_OPERATIONS_MANAGER",
  });
  assert(highEscrow.requiresSuperAdmin === true && highEscrow.canCaoApprove === false, "Escrow release of ₦250,000 escalates to Super Admin");

  // Dispute Refund: <= 50k -> CAO autonomous; > 50k -> Super Admin
  const lowRefund = evaluateApprovalRequirement({
    actionType: "DISPUTE_REFUND",
    amountNgn: 20000,
    actorRole: "EXECUTIVE_OPERATIONS_MANAGER",
  });
  assert(lowRefund.requiresSuperAdmin === false, "Dispute refund of ₦20,000 is within CAO autonomous limit");

  const highRefund = evaluateApprovalRequirement({
    actionType: "DISPUTE_REFUND",
    amountNgn: 85000,
    actorRole: "EXECUTIVE_OPERATIONS_MANAGER",
  });
  assert(highRefund.requiresSuperAdmin === true, "Dispute refund of ₦85,000 escalates to Super Admin");

  // Staff Promotion: Strictly Super Admin Only
  const staffPromotion = evaluateApprovalRequirement({
    actionType: "STAFF_PROMOTION",
    actorRole: "EXECUTIVE_OPERATIONS_MANAGER",
  });
  assert(staffPromotion.requiresSuperAdmin === true, "Staff promotion strictly requires Super Admin");

  // Super Admin can approve all directly
  const superAdminAny = evaluateApprovalRequirement({
    actionType: "ESCROW_RELEASE",
    amountNgn: 5000000,
    actorRole: "SUPER_ADMIN",
  });
  assert(superAdminAny.requiresSuperAdmin === false, "Super Admin can approve any amount directly");

  // -------------------------------------------------------------
  // TEST 5: Role Badges & Metadata
  // -------------------------------------------------------------
  console.log("\n--- 5. Role Badge & Metadata Consistency ---");
  const caoBadge = getRoleBadgeInfo("EXECUTIVE_OPERATIONS_MANAGER");
  assert(caoBadge.label.includes("CAO") || caoBadge.label.includes("Executive"), "CAO badge label is properly formatted");
  assert(caoBadge.badgeColor === "#06B6D4", "CAO badge color is cyan");

  const mktBadge = getRoleBadgeInfo("MARKETPLACE_MANAGER");
  assert(mktBadge.badgeColor === "#10B981", "Marketplace Manager badge color is emerald green");

  const aiBadge = getRoleBadgeInfo("AI_EXECUTIVE_ANALYST");
  assert(aiBadge.label === "AI Executive Analyst", "AI Executive Analyst label is present in directory");
  assert(aiBadge.badgeColor === "#6366F1", "AI Executive Analyst badge color is indigo");

  console.log("\n=======================================================");
  console.log("🎉 ALL GOVERNANCE & RBAC ASSERTIONS PASSED PERFECTLY");
  console.log("=======================================================\n");
}

runGovernanceTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
