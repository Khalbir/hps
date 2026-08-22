"use client";

import { useState } from "react";
import { AdminLayoutShell } from "@/components/layout/AdminLayoutShell";
import {
  Bot, Users, ShieldCheck, CreditCard, ShoppingBag, Star,
  BarChart3, Zap, Crown, CheckCircle2, ArrowRight, MapPin,
  Search, ChevronDown, ChevronUp, Clock, Shield, Sparkles,
  Activity, AlertCircle, Package, Bell, Wrench, DollarSign,
  Lock, Eye, FileText, RefreshCw, AlertTriangle, UserCheck,
  ClipboardList, TrendingUp, Radio, Cpu, Layers, Send
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowStep {
  step: number;
  title: string;
  detail: string;
  module?: string;
  moduleUrl?: string;
  timing?: string;
}

interface DailyTask {
  time: string;
  task: string;
  priority: "HIGH" | "MEDIUM" | "LOW" | "AUTO";
  module?: string;
  moduleUrl?: string;
}

interface StaffRole {
  key: string;
  isAI?: boolean;
  dailySummary: string;
  kpis: string[];
  dailyTasks: DailyTask[];
  workflows: WorkflowStep[];
  permissions: string[];
  restrictions: string[];
}

// ─── Role Meta (from RBAC) ────────────────────────────────────────────────────

function getRoleMeta(key: string): { label: string; title: string; color: string; icon: any; tier: number } {
  const map: Record<string, { label: string; title: string; color: string; icon: any; tier: number }> = {
    SUPER_ADMIN:                { label: "Chief Commander",              title: "Super Administrator",              color: "#EF4444", icon: Crown,       tier: 1 },
    AI_EXECUTIVE_ANALYST:       { label: "AI Executive Analyst",         title: "Chief Commander AI Assistant",     color: "#6366F1", icon: Bot,         tier: 1 },
    AI_DISPATCH_COORDINATOR:    { label: "AI Dispatch Coordinator",      title: "Autonomous Field Dispatch Engine", color: "#8B5CF6", icon: Cpu,         tier: 2 },
    AI_FRAUD_SENTINEL:          { label: "AI Fraud Sentinel",            title: "Real-Time Payment Risk Engine",    color: "#F97316", icon: Shield,      tier: 2 },
    EXECUTIVE_OPERATIONS_MANAGER:{ label: "Executive Operations (CAO)",  title: "Chief Administrative Officer",    color: "#06B6D4", icon: Sparkles,    tier: 2 },
    OPERATIONS_MANAGER:         { label: "Operations Manager",           title: "Head of Field Operations",        color: "#3B82F6", icon: Activity,    tier: 3 },
    MARKETPLACE_MANAGER:        { label: "Marketplace Manager",          title: "Head of Merchant & Logistics",    color: "#10B981", icon: ShoppingBag, tier: 3 },
    FINANCE:                    { label: "Finance Admin",                title: "Finance & Escrow Controller",     color: "#EC4899", icon: DollarSign,  tier: 3 },
    VERIFICATION_OFFICER:       { label: "Verification Officer",         title: "Compliance & Safety Officer",     color: "#F59E0B", icon: ShieldCheck, tier: 4 },
    CUSTOMER_SUPPORT:           { label: "Customer Support",             title: "Customer Support Specialist",     color: "#8B5CF6", icon: Users,       tier: 4 },
  };
  return map[key] || { label: key, title: key, color: "#64748B", icon: Users, tier: 5 };
}

// ─── Staff & AI Role Data ─────────────────────────────────────────────────────

const ROLES: StaffRole[] = [
  // ══════════════════════════════════════════════════════
  // AI ROLES
  // ══════════════════════════════════════════════════════
  {
    key: "AI_EXECUTIVE_ANALYST",
    isAI: true,
    dailySummary: "Autonomous real-time platform intelligence engine embedded in the Executive Command Center. Monitors all operational streams 24/7, scores platform health, detects bottlenecks, and surfaces executive briefings and prioritized action queues.",
    kpis: [
      "Platform Operational Health Score (0–100)",
      "Anomaly Detection Accuracy",
      "Bottleneck Identification Latency (seconds)",
      "Executive Briefing Freshness (< 10 min)",
      "Recommendation Precision Rate",
    ],
    dailyTasks: [
      { time: "Every 6s",  task: "Poll live booking, dispute & part data from the database",          priority: "AUTO", module: "KPI Command Center",   moduleUrl: "/admin/dashboard" },
      { time: "Every 6s",  task: "Recalculate Platform Operational Health Score (0–100)",             priority: "AUTO", module: "KPI Command Center",   moduleUrl: "/admin/dashboard" },
      { time: "Every 6s",  task: "Detect artisan assignment bottlenecks (unassigned bookings > 5)",   priority: "AUTO", module: "Live Map & Radius",     moduleUrl: "/admin/dashboard/map" },
      { time: "Every 6s",  task: "Flag open dispute surge (> 3 unresolved tickets)",                  priority: "AUTO", module: "Dispute Center",        moduleUrl: "/admin/dashboard/disputes" },
      { time: "Every 6s",  task: "Detect high-value part quote anomalies (> ₦75,000 benchmark)",      priority: "AUTO", module: "Replacement Parts",     moduleUrl: "/admin/dashboard/parts" },
      { time: "Every 6s",  task: "Audit unverified partner merchants pending storefront review",       priority: "AUTO", module: "Marketplace",           moduleUrl: "/admin/dashboard/marketplace" },
      { time: "Every 6s",  task: "Generate executive briefing text & recommendation bullets",         priority: "AUTO", module: "KPI Command Center",   moduleUrl: "/admin/dashboard" },
      { time: "Every 6s",  task: "Classify operational status badge: OPTIMAL / FRICTION / CRITICAL",  priority: "AUTO", module: "KPI Command Center",   moduleUrl: "/admin/dashboard" },
      { time: "Continuous", task: "Surface anomaly action queue with direct deep-links for staff",    priority: "AUTO", module: "KPI Command Center",   moduleUrl: "/admin/dashboard" },
    ],
    workflows: [
      { step: 1, title: "Data Ingestion",       detail: "Calls /api/admin/ai-analyst every 6 seconds via auto-refresh polling cycle.",             timing: "Every 6s" },
      { step: 2, title: "Multi-Stream Query",   detail: "Parallel Promise.all() fetches bookings, disputes, parts, merchants & artisans from DB.", timing: "< 200ms" },
      { step: 3, title: "Health Scoring",       detail: "Starts at 98/100; deducts penalty points per detected bottleneck category.",              timing: "< 5ms" },
      { step: 4, title: "Anomaly Cataloguing",  detail: "Builds structured anomaly objects with severity, category, title, detail & action URL.",  timing: "< 5ms" },
      { step: 5, title: "Recommendation Engine",detail: "Generates plain-English corrective action bullets for each active anomaly.",               timing: "< 5ms" },
      { step: 6, title: "Executive Briefing",   detail: "Crafts a single contextual status sentence for the Command Center header panel.",          timing: "< 5ms" },
      { step: 7, title: "Response Broadcast",   detail: "Pushes JSON to frontend; health score, badge, anomalies & recommendations rendered live.", timing: "< 50ms" },
    ],
    permissions: [
      "Read-only access to all database collections (bookings, disputes, parts, merchants, professionals)",
      "Write audit log entries for anomaly events",
      "Surface prioritized action queues with deep links to human staff modules",
    ],
    restrictions: [
      "Cannot approve, reject, or modify any booking, payment, or escrow",
      "Cannot promote or demote staff accounts",
      "Cannot execute financial transactions",
      "Cannot directly contact customers or artisans",
    ],
  },

  {
    key: "AI_DISPATCH_COORDINATOR",
    isAI: true,
    dailySummary: "Autonomous artisan-to-booking matching engine. Continuously monitors unassigned bookings and intelligently suggests optimal technician dispatch by analyzing proximity, skill set, availability, and rating — reducing response latency across all service zones.",
    kpis: [
      "Avg. Artisan Assignment Time (< 10 min)",
      "Unassigned Booking Backlog Count",
      "Dispatch Radius Recommendation Accuracy",
      "Technician-to-Job Skill Match Rate (%)",
      "Re-dispatch Rate (failed first assignments)",
    ],
    dailyTasks: [
      { time: "Every 10s", task: "Scan for bookings in PENDING state without an assigned professional", priority: "AUTO", module: "Bookings Workflow",  moduleUrl: "/admin/dashboard/bookings" },
      { time: "Every 10s", task: "Query nearest verified artisans within configurable dispatch radius",  priority: "AUTO", module: "Live Map & Radius",  moduleUrl: "/admin/dashboard/map" },
      { time: "Every 10s", task: "Score artisans by distance, skill, rating & availability",            priority: "AUTO", module: "Live Map & Radius",  moduleUrl: "/admin/dashboard/map" },
      { time: "Every 10s", task: "Surface top-3 artisan match recommendations for Operations Manager",  priority: "AUTO", module: "Bookings Workflow",  moduleUrl: "/admin/dashboard/bookings" },
      { time: "On trigger", task: "Alert Operations Manager when backlog exceeds 5 unassigned jobs",    priority: "HIGH",  module: "KPI Command Center", moduleUrl: "/admin/dashboard" },
      { time: "Daily",      task: "Generate dispatch performance summary (avg assignment time per zone)",priority: "AUTO", module: "Analytics",          moduleUrl: "/admin/dashboard/analytics" },
    ],
    workflows: [
      { step: 1, title: "Booking Queue Scan",    detail: "Queries all PENDING bookings with professionalId = null.",                                          timing: "Every 10s" },
      { step: 2, title: "Geospatial Lookup",     detail: "Retrieves verified artisans within configured radius from booking service address coordinates.",      timing: "< 300ms" },
      { step: 3, title: "Multi-Factor Scoring",  detail: "Ranks artisans by weighted score: 40% proximity + 30% skill match + 20% rating + 10% availability.", timing: "< 50ms" },
      { step: 4, title: "Match Proposal",        detail: "Surfaces ranked list in Bookings module for Operations Manager to confirm & assign.",                 timing: "< 100ms" },
      { step: 5, title: "Escalation Trigger",    detail: "If no match found in 15 min → alerts AI Executive Analyst & Operations Manager with radius expansion recommendation.", timing: "15 min SLA" },
      { step: 6, title: "Audit Trail",           detail: "Logs every dispatch suggestion and final human assignment decision to immutable audit ledger.",        timing: "Immediate" },
    ],
    permissions: [
      "Read access to verified artisan locations and skill profiles",
      "Read access to pending bookings and service addresses",
      "Write dispatch recommendations to Bookings Workflow module",
      "Trigger escalation alerts to Operations Manager and AI Executive Analyst",
    ],
    restrictions: [
      "Cannot directly assign a booking without Operations Manager confirmation",
      "Cannot contact artisans directly without human approval",
      "Cannot modify artisan profiles or ratings",
    ],
  },

  {
    key: "AI_FRAUD_SENTINEL",
    isAI: true,
    dailySummary: "Real-time payment and transaction risk engine that monitors every financial event across the platform. Flags suspicious wallet top-ups, anomalous escrow releases, duplicate payment attempts, and unusual refund patterns — protecting the platform's financial integrity.",
    kpis: [
      "Transaction Fraud Detection Rate (%)",
      "False Positive Rate (< 2%)",
      "Time-to-Flag Suspicious Transaction (< 5s)",
      "Blocked Suspicious Transactions Count",
      "Escrow Anomaly Detection Score",
    ],
    dailyTasks: [
      { time: "Real-time",  task: "Monitor all Paystack webhook events for duplicate or replay attacks",         priority: "AUTO", module: "Payments & Escrow",  moduleUrl: "/admin/dashboard/payments" },
      { time: "Real-time",  task: "Scan wallet top-up amounts for unusual patterns (> ₦500k single load)",      priority: "AUTO", module: "Payments & Escrow",  moduleUrl: "/admin/dashboard/payments" },
      { time: "Real-time",  task: "Detect escrow release requests on uncompleted or disputed bookings",          priority: "AUTO", module: "Dispute Center",     moduleUrl: "/admin/dashboard/disputes" },
      { time: "Every 5min", task: "Audit refund/dispute-to-booking ratio for customer abuse patterns",          priority: "AUTO", module: "Dispute Center",     moduleUrl: "/admin/dashboard/disputes" },
      { time: "Every 5min", task: "Flag accounts with > 3 disputes or > 2 refunds in 30 days",                 priority: "HIGH", module: "Users & Staff Roles", moduleUrl: "/admin/dashboard/users" },
      { time: "Daily",      task: "Generate financial risk summary report for Finance Admin & Super Admin",      priority: "AUTO", module: "Analytics",          moduleUrl: "/admin/dashboard/analytics" },
    ],
    workflows: [
      { step: 1, title: "Event Stream Ingestion",  detail: "Listens to all payment webhook events, wallet mutations, and escrow state changes in real-time.",    timing: "< 1s" },
      { step: 2, title: "Rule Engine Evaluation",  detail: "Applies 15+ configurable fraud detection rules including amount thresholds, velocity, and patterns.", timing: "< 5ms" },
      { step: 3, title: "Risk Scoring",            detail: "Assigns risk score 0–100 to each transaction. Score > 70 triggers Finance Admin alert.",              timing: "< 10ms" },
      { step: 4, title: "Suspicious Flag",         detail: "Marks payment record with SUSPICIOUS_FLAG in DB and pauses auto-release pending review.",             timing: "< 50ms" },
      { step: 5, title: "Human Review Escalation", detail: "Pushes high-risk item to Finance Admin and Super Admin approval queue with full transaction trace.",   timing: "< 100ms" },
      { step: 6, title: "Audit Ledger Entry",      detail: "Creates tamper-evident audit log entry for every flagged and cleared transaction.",                   timing: "Immediate" },
    ],
    permissions: [
      "Read-only access to all payment and wallet transaction records",
      "Write SUSPICIOUS_FLAG status to payment records",
      "Add items to high-risk approval queue for Finance Admin & Super Admin",
      "Generate financial risk reports",
    ],
    restrictions: [
      "Cannot approve or reject escrow releases autonomously",
      "Cannot freeze user accounts without Super Admin authorization",
      "Cannot initiate refunds or transfers",
    ],
  },

  // ══════════════════════════════════════════════════════
  // HUMAN STAFF ROLES
  // ══════════════════════════════════════════════════════
  {
    key: "SUPER_ADMIN",
    isAI: false,
    dailySummary: "Supreme platform commander with unrestricted sovereignty across all systems. Oversees executive approvals, platform policy, staff governance, financial controls, system integrity, and final decision authority on all escalated matters.",
    kpis: [
      "High-Risk Approval Queue Clearance Rate",
      "Platform Uptime & SLA Compliance (%)",
      "Staff Role Governance Actions per Week",
      "Revenue Pipeline Health (₦ Total Volume)",
      "AI Analyst Health Score (Target > 90)",
    ],
    dailyTasks: [
      { time: "07:00",  task: "Review AI Executive Analyst health score & executive briefing",           priority: "HIGH",   module: "KPI Command Center",  moduleUrl: "/admin/dashboard" },
      { time: "07:30",  task: "Clear overnight high-risk approval queue (escrow, refunds, promos)",      priority: "HIGH",   module: "KPI Command Center",  moduleUrl: "/admin/dashboard" },
      { time: "08:00",  task: "Review any pending staff role promotions or demotion requests",           priority: "HIGH",   module: "Users & Staff Roles",  moduleUrl: "/admin/dashboard/users" },
      { time: "09:00",  task: "Audit overnight payment transactions and escrow ledger",                  priority: "HIGH",   module: "Payments & Escrow",   moduleUrl: "/admin/dashboard/payments" },
      { time: "10:00",  task: "Review analytics KPI dashboard for revenue pipeline anomalies",           priority: "MEDIUM", module: "Analytics & Reports", moduleUrl: "/admin/dashboard/analytics" },
      { time: "11:00",  task: "Approve or reject platform commission or pricing policy changes",         priority: "HIGH",   module: "Settings & Backups",  moduleUrl: "/admin/dashboard/settings" },
      { time: "12:00",  task: "Review AI Fraud Sentinel reports and authorize account freezes if needed",priority: "HIGH",   module: "Payments & Escrow",   moduleUrl: "/admin/dashboard/payments" },
      { time: "14:00",  task: "Audit artisan verification pipeline completeness",                        priority: "MEDIUM", module: "Artisan Verification", moduleUrl: "/admin/dashboard/professionals" },
      { time: "15:00",  task: "Review open dispute escalations from CAO that exceed financial thresholds",priority: "HIGH",  module: "Dispute Center",      moduleUrl: "/admin/dashboard/disputes" },
      { time: "17:00",  task: "Initiate or schedule database backup (if due)",                          priority: "MEDIUM", module: "Settings & Backups",  moduleUrl: "/admin/dashboard/settings" },
      { time: "18:00",  task: "End-of-day operational status sign-off with CAO",                        priority: "HIGH",   module: "KPI Command Center",  moduleUrl: "/admin/dashboard" },
    ],
    workflows: [
      { step: 1, title: "Morning Intelligence Brief",   detail: "Read AI Analyst health score, anomaly catalogue, and executive recommendations.",                                                module: "KPI Command Center",  moduleUrl: "/admin/dashboard" },
      { step: 2, title: "Approval Queue Governance",    detail: "Review and act on all pending high-risk items: escrow releases > ₦100k, dispute refunds > ₦50k, part quotes > ₦75k.",           module: "KPI Command Center",  moduleUrl: "/admin/dashboard" },
      { step: 3, title: "Staff & Role Management",      detail: "Promote, demote, or deactivate staff accounts. Assign roles based on performance reviews. Only role with manageRoles permission.", module: "Users & Staff Roles",  moduleUrl: "/admin/dashboard/users" },
      { step: 4, title: "Financial Policy Governance",  detail: "Set commission rates, pricing rules, promo code budgets, and escrow auto-release thresholds.",                                    module: "Settings & Backups",  moduleUrl: "/admin/dashboard/settings" },
      { step: 5, title: "Dispute Final Arbitration",    detail: "Makes final binding decisions on escalated customer disputes with financial implications above CAO threshold.",                     module: "Dispute Center",      moduleUrl: "/admin/dashboard/disputes" },
      { step: 6, title: "System Integrity Audit",       detail: "Initiates and schedules automated database backups. Authorizes data purges. Reviews system health logs.",                          module: "Settings & Backups",  moduleUrl: "/admin/dashboard/settings" },
      { step: 7, title: "End-of-Day Ledger Sign-Off",  detail: "Reviews daily financial reconciliation with Finance Admin and approves any pending overnight batch operations.",                    module: "Payments & Escrow",   moduleUrl: "/admin/dashboard/payments" },
    ],
    permissions: [
      "Full unrestricted access to all dashboard modules and API endpoints",
      "Approve / reject all high-risk financial operations (escrow, refunds, payouts)",
      "Hire, promote, demote & deactivate staff accounts",
      "Set and modify platform commission and pricing policies",
      "Execute database backups and system purges",
      "Override AI Fraud Sentinel flags and authorize account freezes",
      "Approve merchant deactivation and artisan suspension",
    ],
    restrictions: [
      "All high-risk actions are logged in tamper-evident audit ledger",
      "Cannot bypass dual-approval requirement for transactions > ₦500k (future feature)",
    ],
  },

  {
    key: "EXECUTIVE_OPERATIONS_MANAGER",
    isAI: false,
    dailySummary: "Second-in-Command (CAO). Coordinates all cross-departmental operations, manages daily escalation flows, reviews AI analyst recommendations, and maintains platform operational continuity. Acts as primary escalation point for field, marketplace, dispute and procurement departments.",
    kpis: [
      "Daily Escalation Resolution Rate",
      "Cross-Department SLA Compliance (%)",
      "Approval Queue Items Cleared per Day",
      "Artisan Dispatch Avg Response Time",
      "Merchant Onboarding Pipeline Health",
    ],
    dailyTasks: [
      { time: "07:00",  task: "Review AI Executive Analyst health score & operational anomaly catalogue",  priority: "HIGH",   module: "KPI Command Center",  moduleUrl: "/admin/dashboard" },
      { time: "08:00",  task: "Review overnight bookings, dispatch gaps & unresolved escalations",         priority: "HIGH",   module: "Bookings Workflow",   moduleUrl: "/admin/dashboard/bookings" },
      { time: "09:00",  task: "Review and approve escrow releases ≤ ₦100k from Finance Admin queue",       priority: "HIGH",   module: "Payments & Escrow",   moduleUrl: "/admin/dashboard/payments" },
      { time: "10:00",  task: "Review open disputes and clear tickets within CAO refund threshold (≤ ₦50k)",priority: "HIGH",  module: "Dispute Center",      moduleUrl: "/admin/dashboard/disputes" },
      { time: "11:00",  task: "Monitor artisan verification pipeline with Verification Officer",            priority: "MEDIUM", module: "Artisan Verification", moduleUrl: "/admin/dashboard/professionals" },
      { time: "12:00",  task: "Review marketplace merchant pipeline with Marketplace Manager",             priority: "MEDIUM", module: "Marketplace",         moduleUrl: "/admin/dashboard/marketplace" },
      { time: "14:00",  task: "Review replacement parts procurement queue & approve part quotes ≤ ₦75k",  priority: "MEDIUM", module: "Replacement Parts",   moduleUrl: "/admin/dashboard/parts" },
      { time: "15:00",  task: "Coordinate with Operations Manager on live dispatch performance",           priority: "MEDIUM", module: "Live Map & Radius",   moduleUrl: "/admin/dashboard/map" },
      { time: "16:00",  task: "Review customer review queue for suspicious or fake reviews",               priority: "LOW",    module: "Customer Reviews",    moduleUrl: "/admin/dashboard/reviews" },
      { time: "17:00",  task: "Compile daily operations brief and escalate to Super Admin",                priority: "HIGH",   module: "KPI Command Center",  moduleUrl: "/admin/dashboard" },
    ],
    workflows: [
      { step: 1, title: "Morning Intelligence Brief",      detail: "Reads AI Analyst anomaly catalogue and briefing. Prioritizes action queue for the day.",                                      module: "KPI Command Center",  moduleUrl: "/admin/dashboard" },
      { step: 2, title: "Cross-Dept Coordination",         detail: "Synchronizes Operations Manager, Marketplace Manager, Verification Officer & Support team on daily targets.",                module: "KPI Command Center",  moduleUrl: "/admin/dashboard" },
      { step: 3, title: "Approval Delegation",             detail: "Acts as first approval authority for escrow releases ≤ ₦100k, dispute refunds ≤ ₦50k, part quotes ≤ ₦75k.",               module: "KPI Command Center",  moduleUrl: "/admin/dashboard" },
      { step: 4, title: "Dispute & Escalation Triage",     detail: "Receives escalated disputes from Support. Resolves within CAO threshold or escalates to Super Admin.",                       module: "Dispute Center",      moduleUrl: "/admin/dashboard/disputes" },
      { step: 5, title: "Merchant & Artisan Oversight",    detail: "Reviews Marketplace Manager merchant pipeline and Verification Officer artisan dossier progress.",                           module: "Marketplace",         moduleUrl: "/admin/dashboard/marketplace" },
      { step: 6, title: "EOD Reporting",                   detail: "Prepares daily operational status report and escalation log to deliver to Super Admin at 17:00.",                            module: "Analytics & Reports", moduleUrl: "/admin/dashboard/analytics" },
    ],
    permissions: [
      "Access to all dashboard modules except system settings, backups, and staff role management",
      "Approve escrow releases up to ₦100,000",
      "Approve dispute refunds up to ₦50,000",
      "Approve part quotes up to ₦75,000",
      "Coordinate all department heads and review their queues",
      "Escalate high-risk items to Super Admin approval queue",
    ],
    restrictions: [
      "Cannot modify platform commission rates or system settings",
      "Cannot promote or demote staff (Super Admin only)",
      "Cannot approve transactions above CAO financial thresholds",
      "Cannot execute database backups or system purges",
    ],
  },

  {
    key: "OPERATIONS_MANAGER",
    isAI: false,
    dailySummary: "Manages live field operations: booking dispatch, artisan-to-job matching, radius configuration, and booking lifecycle supervision. Coordinates with AI Dispatch Coordinator to minimize unassigned booking backlog and maximize artisan utilization.",
    kpis: [
      "Avg. Artisan Assignment Time (< 10 min target)",
      "Unassigned Booking Backlog (< 3 at all times)",
      "Job Completion Rate per Day (%)",
      "Artisan Dispatch Radius Utilization",
      "Dispute Escalation Count from Bookings",
    ],
    dailyTasks: [
      { time: "07:00",  task: "Review overnight unassigned bookings and dispatch AI recommendations",       priority: "HIGH",   module: "Bookings Workflow",  moduleUrl: "/admin/dashboard/bookings" },
      { time: "08:00",  task: "Review live map: artisan positions, dispatch zones & coverage gaps",         priority: "HIGH",   module: "Live Map & Radius",  moduleUrl: "/admin/dashboard/map" },
      { time: "09:00",  task: "Assign unmatched bookings using AI-recommended artisan shortlist",           priority: "HIGH",   module: "Bookings Workflow",  moduleUrl: "/admin/dashboard/bookings" },
      { time: "10:00",  task: "Monitor in-progress bookings for SLA breaches (> 2 hrs without update)",    priority: "HIGH",   module: "Bookings Workflow",  moduleUrl: "/admin/dashboard/bookings" },
      { time: "11:00",  task: "Adjust dispatch radius for underserved zones (Abuja/Lagos expansion)",       priority: "MEDIUM", module: "Live Map & Radius",  moduleUrl: "/admin/dashboard/map" },
      { time: "13:00",  task: "Review replacement part requests associated with in-progress bookings",      priority: "MEDIUM", module: "Replacement Parts",  moduleUrl: "/admin/dashboard/parts" },
      { time: "15:00",  task: "Triage booking disputes escalated by Customer Support",                      priority: "HIGH",   module: "Dispute Center",     moduleUrl: "/admin/dashboard/disputes" },
      { time: "17:00",  task: "End-of-day booking completion audit; submit dispatch KPI report to CAO",     priority: "MEDIUM", module: "Analytics & Reports",moduleUrl: "/admin/dashboard/analytics" },
    ],
    workflows: [
      { step: 1, title: "Daily Dispatch Briefing",     detail: "Reviews AI Dispatch Coordinator's unassigned booking list and recommended artisan matches.",                        module: "Bookings Workflow",  moduleUrl: "/admin/dashboard/bookings" },
      { step: 2, title: "Manual Assignment Override",  detail: "Confirms or overrides AI recommendations; manually assigns artisan to booking from verified professionals list.",   module: "Bookings Workflow",  moduleUrl: "/admin/dashboard/bookings" },
      { step: 3, title: "Radius Calibration",          detail: "Adjusts dispatch radius per zone in Live Map to expand artisan coverage in high-demand areas.",                    module: "Live Map & Radius",  moduleUrl: "/admin/dashboard/map" },
      { step: 4, title: "SLA Monitoring",              detail: "Monitors in-progress bookings for delays. Calls artisan if no status update in 2 hrs. Escalates to CAO if unresolved.", module: "Bookings Workflow",  moduleUrl: "/admin/dashboard/bookings" },
      { step: 5, title: "Parts Coordination",          detail: "Approves REQUESTED replacement parts needed for active jobs. Coordinates with merchant on procurement ETA.",       module: "Replacement Parts",  moduleUrl: "/admin/dashboard/parts" },
      { step: 6, title: "Dispute Triage",              detail: "Reviews booking-related disputes from Support. Provides field context before CAO arbitration.",                    module: "Dispute Center",     moduleUrl: "/admin/dashboard/disputes" },
    ],
    permissions: [
      "View and manage all bookings (assign, reassign, cancel, escalate)",
      "Configure dispatch radius per geographic zone in live map",
      "Approve replacement part requests for active jobs",
      "Triage booking-related disputes",
      "Access analytics for field performance reporting",
    ],
    restrictions: [
      "Cannot approve financial transactions or escrow releases",
      "Cannot access customer payment data or wallet balances",
      "Cannot access platform settings or commission rules",
      "Cannot manage staff accounts",
    ],
  },

  {
    key: "MARKETPLACE_MANAGER",
    isAI: false,
    dailySummary: "Governs the HandyHub Marketplace commerce layer: partner merchant onboarding, product catalog moderation, delivery zone configuration, and merchant compliance. Ensures all marketplace listings meet quality, pricing, and logistics standards.",
    kpis: [
      "Merchant Onboarding Pipeline (applications/week)",
      "Catalog Moderation Clearance Rate",
      "Marketplace GMV (Gross Merchandise Value ₦)",
      "Unverified Merchant Count (target: 0 at day-end)",
      "Delivery Zone Coverage (%)",
    ],
    dailyTasks: [
      { time: "08:00",  task: "Review new merchant applications and storefront verification submissions",    priority: "HIGH",   module: "Marketplace",          moduleUrl: "/admin/dashboard/marketplace" },
      { time: "09:00",  task: "Audit product catalog listings for pricing anomalies or duplicate listings",  priority: "HIGH",   module: "Marketplace",          moduleUrl: "/admin/dashboard/marketplace" },
      { time: "10:00",  task: "Review merchant CAC registration documents and GPS coordinates",              priority: "HIGH",   module: "Marketplace",          moduleUrl: "/admin/dashboard/marketplace" },
      { time: "11:00",  task: "Process replacement part procurement orders from verified merchants",         priority: "MEDIUM", module: "Replacement Parts",    moduleUrl: "/admin/dashboard/parts" },
      { time: "13:00",  task: "Update delivery zone configurations for new service districts",               priority: "MEDIUM", module: "Live Map & Radius",    moduleUrl: "/admin/dashboard/map" },
      { time: "14:00",  task: "Review merchant dispute tickets raised by artisans (parts quality issues)",  priority: "HIGH",   module: "Dispute Center",       moduleUrl: "/admin/dashboard/disputes" },
      { time: "15:00",  task: "Moderate customer reviews on marketplace products",                           priority: "LOW",    module: "Customer Reviews",     moduleUrl: "/admin/dashboard/reviews" },
      { time: "16:00",  task: "Manage active promo codes for marketplace-specific promotions",               priority: "LOW",    module: "Promo Codes",          moduleUrl: "/admin/dashboard/promo-codes" },
      { time: "17:00",  task: "Submit merchant pipeline KPI report to CAO",                                  priority: "MEDIUM", module: "Analytics & Reports",  moduleUrl: "/admin/dashboard/analytics" },
    ],
    workflows: [
      { step: 1, title: "Merchant Application Review", detail: "Receives new merchant applications. Reviews CAC number, business name, and submitted documents.",                           module: "Marketplace",       moduleUrl: "/admin/dashboard/marketplace" },
      { step: 2, title: "Storefront GPS Verification", detail: "Cross-references submitted GPS coordinates against physical address on CAC registration. Flags discrepancies.",             module: "Marketplace",       moduleUrl: "/admin/dashboard/marketplace" },
      { step: 3, title: "Catalog Audit",               detail: "Reviews all new product listings for prohibited items, price anomalies vs market benchmarks, and duplicate SKUs.",         module: "Marketplace",       moduleUrl: "/admin/dashboard/marketplace" },
      { step: 4, title: "Procurement Coordination",    detail: "Processes approved replacement part orders. Assigns to merchant with nearest stock and best price per zone.",              module: "Replacement Parts", moduleUrl: "/admin/dashboard/parts" },
      { step: 5, title: "Merchant Dispute Resolution", detail: "Arbitrates parts quality disputes between artisans and merchants. Issues replacement or refund within CAO threshold.",     module: "Dispute Center",    moduleUrl: "/admin/dashboard/disputes" },
      { step: 6, title: "Zone & Logistics Config",     detail: "Configures delivery zones, estimated ETAs, and district-level delivery pricing on the marketplace map layer.",             module: "Live Map & Radius", moduleUrl: "/admin/dashboard/map" },
    ],
    permissions: [
      "Approve, reject, and suspend merchant accounts",
      "Moderate product catalog listings (approve, flag, remove)",
      "Process replacement part procurement orders",
      "Configure delivery zones and marketplace logistics",
      "Manage marketplace-specific promo codes",
      "Resolve marketplace-related disputes",
    ],
    restrictions: [
      "Cannot access individual user wallet or payment data",
      "Cannot assign bookings or manage artisan dispatch",
      "Cannot view or manage staff accounts",
      "Cannot modify platform-level commission rates",
    ],
  },

  {
    key: "VERIFICATION_OFFICER",
    isAI: false,
    dailySummary: "Conducts rigorous 5-pillar artisan compliance dossier audits (NIN, live biometrics, trade certification, address proof, guarantor verification) and customer proof-of-address reviews. Ensures only vetted professionals access the live field operations network.",
    kpis: [
      "Artisan Dossiers Reviewed per Day",
      "Avg. Artisan Verification Turnaround (< 48 hrs)",
      "Pending Verification Queue Length (target: < 5)",
      "Customer Address Proof Clearance Rate",
      "False Approval Rate (target: 0%)",
    ],
    dailyTasks: [
      { time: "08:00",  task: "Review new artisan verification submissions in pending queue",                priority: "HIGH",   module: "Artisan Verification",        moduleUrl: "/admin/dashboard/professionals" },
      { time: "09:00",  task: "Audit NIN (National Identity Number) validity via NIMC lookup",               priority: "HIGH",   module: "Artisan Verification",        moduleUrl: "/admin/dashboard/professionals" },
      { time: "10:00",  task: "Review live biometric selfie submissions for identity match",                  priority: "HIGH",   module: "Artisan Verification",        moduleUrl: "/admin/dashboard/professionals" },
      { time: "11:00",  task: "Verify trade certifications (SON, NAFDAC, COREN, etc.) for relevant trades", priority: "HIGH",   module: "Artisan Verification",        moduleUrl: "/admin/dashboard/professionals" },
      { time: "12:00",  task: "Review address proof documents (utility bills, tenancy agreements)",          priority: "MEDIUM", module: "Artisan Verification",        moduleUrl: "/admin/dashboard/professionals" },
      { time: "13:00",  task: "Contact and verify guarantor references by phone or email",                   priority: "MEDIUM", module: "Artisan Verification",        moduleUrl: "/admin/dashboard/professionals" },
      { time: "14:00",  task: "Review customer address verification submissions (proof of residence)",        priority: "MEDIUM", module: "Client Address Verification", moduleUrl: "/admin/dashboard/verification" },
      { time: "15:00",  task: "Flag and suspend artisans with expired or fraudulent documentation",          priority: "HIGH",   module: "Artisan Verification",        moduleUrl: "/admin/dashboard/professionals" },
      { time: "16:00",  task: "Submit daily verification throughput report to CAO",                          priority: "LOW",    module: "Analytics & Reports",         moduleUrl: "/admin/dashboard/analytics" },
    ],
    workflows: [
      { step: 1, title: "Document Ingestion",        detail: "Artisan submits 5-pillar dossier via Pro app. Documents land in verification queue.",                                        module: "Artisan Verification", moduleUrl: "/admin/dashboard/professionals" },
      { step: 2, title: "NIN & Identity Check",      detail: "Cross-references NIN with biometric selfie. Fails instantly if NIN lookup returns mismatch.",                               module: "Artisan Verification", moduleUrl: "/admin/dashboard/professionals" },
      { step: 3, title: "Trade Cert Audit",          detail: "Verifies trade certification number with relevant issuing body (SON, COREN, etc.) for the specific service category.",     module: "Artisan Verification", moduleUrl: "/admin/dashboard/professionals" },
      { step: 4, title: "Address & Guarantor Check", detail: "Validates utility bill or tenancy agreement. Contacts two guarantors by registered phone number.",                         module: "Artisan Verification", moduleUrl: "/admin/dashboard/professionals" },
      { step: 5, title: "Approval or Rejection",     detail: "Marks artisan as VERIFIED (5-star badge) or REJECTED with specific failure reason codes.",                                 module: "Artisan Verification", moduleUrl: "/admin/dashboard/professionals" },
      { step: 6, title: "Customer Address Review",   detail: "Reviews utility bills or government-issued address documents submitted by customers for high-value service bookings.",     module: "Client Address Verification", moduleUrl: "/admin/dashboard/verification" },
    ],
    permissions: [
      "View full artisan verification dossiers (NIN, biometrics, certs, guarantors)",
      "Approve or reject artisan verification applications",
      "Suspend artisans with expired or fraudulent documentation",
      "Review and approve customer proof-of-address submissions",
      "Flag documents for escalation to CAO",
    ],
    restrictions: [
      "Cannot access payment, escrow, or financial data",
      "Cannot view or manage booking assignments",
      "Cannot manage marketplace or merchant accounts",
      "Cannot modify platform settings or staff roles",
    ],
  },

  {
    key: "CUSTOMER_SUPPORT",
    isAI: false,
    dailySummary: "Primary customer-facing escalation team. Handles inbound service inquiries, booking status updates, dispute initiation, review moderation, and artisan feedback routing. First line of resolution before dispute escalation to Operations or CAO.",
    kpis: [
      "First Response Time (< 2 hrs target)",
      "Ticket Resolution Rate per Day (%)",
      "Dispute Tickets Opened vs. Resolved",
      "Customer Satisfaction Score (CSAT %)",
      "Escalation Rate to Operations Manager",
    ],
    dailyTasks: [
      { time: "08:00",  task: "Review overnight customer inquiry tickets and triage by priority",           priority: "HIGH",   module: "Bookings Workflow",  moduleUrl: "/admin/dashboard/bookings" },
      { time: "09:00",  task: "Update customers on in-progress booking statuses (phone/email/chat)",        priority: "HIGH",   module: "Bookings Workflow",  moduleUrl: "/admin/dashboard/bookings" },
      { time: "10:00",  task: "Review and open dispute tickets for customer complaints with evidence",      priority: "HIGH",   module: "Dispute Center",     moduleUrl: "/admin/dashboard/disputes" },
      { time: "11:00",  task: "Moderate newly submitted customer reviews (flag suspicious or fake reviews)",priority: "MEDIUM", module: "Customer Reviews",   moduleUrl: "/admin/dashboard/reviews" },
      { time: "12:00",  task: "Process customer replacement part inquiries and link to booking",           priority: "MEDIUM", module: "Replacement Parts",  moduleUrl: "/admin/dashboard/parts" },
      { time: "13:00",  task: "Follow up on unresolved disputes older than 24 hrs with Operations Manager",priority: "HIGH",   module: "Dispute Center",     moduleUrl: "/admin/dashboard/disputes" },
      { time: "14:00",  task: "Review referral code issues and claim disputes from customers",              priority: "LOW",    module: "Referral & AI Center",moduleUrl: "/admin/dashboard/referrals" },
      { time: "15:00",  task: "Review notification delivery failures for customer-facing alerts",           priority: "LOW",    module: "Notifications",      moduleUrl: "/admin/dashboard/notifications" },
      { time: "17:00",  task: "Submit daily support ticket KPI report to Operations Manager",              priority: "MEDIUM", module: "Bookings Workflow",  moduleUrl: "/admin/dashboard/bookings" },
    ],
    workflows: [
      { step: 1, title: "Ticket Triage",               detail: "Receives customer inquiry via platform chat, email, or phone. Logs into support queue by urgency.",                          module: "Bookings Workflow", moduleUrl: "/admin/dashboard/bookings" },
      { step: 2, title: "Booking Status Lookup",        detail: "Queries booking reference to pull full status, assigned artisan, and last GPS location update.",                             module: "Bookings Workflow", moduleUrl: "/admin/dashboard/bookings" },
      { step: 3, title: "Dispute Initiation",           detail: "Opens formal dispute ticket. Collects customer evidence (photos, descriptions). Notifies artisan and Operations Manager.",  module: "Dispute Center",   moduleUrl: "/admin/dashboard/disputes" },
      { step: 4, title: "Review Moderation",            detail: "Reviews newly submitted reviews. Flags reviews with hate speech, defamation, or fraud indicators for Operations Manager.", module: "Customer Reviews", moduleUrl: "/admin/dashboard/reviews" },
      { step: 5, title: "Escalation Protocol",          detail: "Unresolved tickets > 24 hrs escalated to Operations Manager. Financial disputes escalated to Finance + CAO.",              module: "Dispute Center",   moduleUrl: "/admin/dashboard/disputes" },
      { step: 6, title: "Resolution & CSAT Capture",   detail: "Resolves ticket, logs outcome, sends satisfaction survey to customer. Monitors CSAT score weekly.",                         module: "Bookings Workflow", moduleUrl: "/admin/dashboard/bookings" },
    ],
    permissions: [
      "View customer bookings, artisan assignments, and booking status",
      "Open and manage dispute tickets (initiate, comment, escalate)",
      "Moderate customer and artisan reviews",
      "View replacement part requests linked to customer bookings",
      "View referral history and flag claim disputes",
      "Access and filter notification logs for customer-facing alerts",
    ],
    restrictions: [
      "Cannot approve or reject financial transactions or escrow releases",
      "Cannot access raw payment gateway data (Paystack logs)",
      "Cannot directly assign bookings to artisans",
      "Cannot modify staff roles or platform settings",
    ],
  },

  {
    key: "FINANCE",
    isAI: false,
    dailySummary: "Manages the full financial operations layer of HandyHub Pro: Paystack transaction auditing, escrow lifecycle management, artisan payout processing, refund authorization, and financial reporting. Coordinates with AI Fraud Sentinel for risk flagging.",
    kpis: [
      "Escrow Release Processing Time (< 24 hrs)",
      "Artisan Payout Success Rate (%)",
      "Failed Transaction Rate (target: < 0.5%)",
      "Pending Refund Queue Clearance Rate",
      "Monthly Revenue Reconciliation Accuracy",
    ],
    dailyTasks: [
      { time: "07:30",  task: "Review Paystack transaction logs for overnight payment activity",            priority: "HIGH",   module: "Payments & Escrow",   moduleUrl: "/admin/dashboard/payments" },
      { time: "08:00",  task: "Process pending artisan payout requests within approved threshold",          priority: "HIGH",   module: "Payments & Escrow",   moduleUrl: "/admin/dashboard/payments" },
      { time: "09:00",  task: "Review and act on AI Fraud Sentinel flagged transactions",                   priority: "HIGH",   module: "Payments & Escrow",   moduleUrl: "/admin/dashboard/payments" },
      { time: "10:00",  task: "Release escrow for completed bookings within CAO-approved threshold (≤ ₦100k)",priority: "HIGH", module: "Payments & Escrow",   moduleUrl: "/admin/dashboard/payments" },
      { time: "11:00",  task: "Authorize approved refunds from resolved dispute tickets",                   priority: "HIGH",   module: "Dispute Center",      moduleUrl: "/admin/dashboard/disputes" },
      { time: "12:00",  task: "Audit wallet top-up events for suspicious large loads (> ₦500k)",           priority: "HIGH",   module: "Payments & Escrow",   moduleUrl: "/admin/dashboard/payments" },
      { time: "14:00",  task: "Review marketplace GMV and promo code budget burn rate",                     priority: "MEDIUM", module: "Promo Codes",         moduleUrl: "/admin/dashboard/promo-codes" },
      { time: "15:00",  task: "Prepare escrow reconciliation report for pending Super Admin approvals",     priority: "HIGH",   module: "Payments & Escrow",   moduleUrl: "/admin/dashboard/payments" },
      { time: "17:00",  task: "Submit daily financial summary and reconciliation log to CAO & Super Admin", priority: "HIGH",   module: "Analytics & Reports", moduleUrl: "/admin/dashboard/analytics" },
    ],
    workflows: [
      { step: 1, title: "Transaction Log Audit",   detail: "Reviews all Paystack events (charges, refunds, transfers) for the past 24 hrs. Flags anomalies.",                                 module: "Payments & Escrow", moduleUrl: "/admin/dashboard/payments" },
      { step: 2, title: "Escrow Release Protocol", detail: "For each completed booking: verify completion status, calculate platform commission, and release net payout to artisan.",         module: "Payments & Escrow", moduleUrl: "/admin/dashboard/payments" },
      { step: 3, title: "Fraud Review Loop",       detail: "Reviews AI Fraud Sentinel flagged transactions. Approves clearance or escalates to Super Admin for account freeze authorization.",module: "Payments & Escrow", moduleUrl: "/admin/dashboard/payments" },
      { step: 4, title: "Refund Processing",       detail: "Processes approved dispute refunds. Verifies refund amount ≤ original booking value and CAO approval present.",                  module: "Dispute Center",   moduleUrl: "/admin/dashboard/disputes" },
      { step: 5, title: "Payout Batch",            detail: "Batches approved artisan bank transfer requests. Initiates via Paystack Transfer API. Logs all transfer reference IDs.",          module: "Payments & Escrow", moduleUrl: "/admin/dashboard/payments" },
      { step: 6, title: "EOD Reconciliation",      detail: "Reconciles total escrow in, escrow released, platform fees retained, and pending balances. Submits to CAO & Super Admin.",       module: "Analytics & Reports", moduleUrl: "/admin/dashboard/analytics" },
    ],
    permissions: [
      "View all Paystack transaction logs and webhook events",
      "Process escrow releases for completed bookings (up to CAO limit)",
      "Initiate artisan bank payout transfers via Paystack API",
      "Authorize refunds for approved dispute outcomes",
      "Review and clear AI Fraud Sentinel flagged transactions",
      "Access full financial analytics and revenue reporting",
    ],
    restrictions: [
      "Cannot approve transactions above ₦100k without Super Admin sign-off",
      "Cannot manage staff roles, platform settings, or dispatch operations",
      "Cannot approve merchant accounts or artisan verifications",
      "Cannot freeze user accounts (requires Super Admin authorization)",
    ],
  },
];

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const cfg: Record<string, { color: string; bg: string; label: string }> = {
    HIGH:   { color: "#EF4444", bg: "rgba(239,68,68,0.15)",   label: "HIGH" },
    MEDIUM: { color: "#F59E0B", bg: "rgba(245,158,11,0.15)",  label: "MED"  },
    LOW:    { color: "#10B981", bg: "rgba(16,185,129,0.15)",  label: "LOW"  },
    AUTO:   { color: "#6366F1", bg: "rgba(99,102,241,0.15)",  label: "AUTO" },
  };
  const c = cfg[priority] || cfg.LOW;
  return (
    <span style={{
      padding: "2px 7px", borderRadius: "10px", fontSize: "10px", fontWeight: 700,
      letterSpacing: "0.5px", background: c.bg, color: c.color,
      border: `1px solid ${c.color}40`, flexShrink: 0,
    }}>{c.label}</span>
  );
}

// ─── Role Card ────────────────────────────────────────────────────────────────

function RoleCard({ role, defaultOpen }: { role: StaffRole; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const [activeTab, setActiveTab] = useState<"tasks" | "workflow" | "access">("tasks");
  const meta = getRoleMeta(role.key);
  const Icon = meta.icon;

  return (
    <div style={{
      background: "#1E293B",
      border: `1px solid ${open ? meta.color + "60" : "#334155"}`,
      borderRadius: "16px",
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px",
          textAlign: "left",
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: "12px",
          background: `linear-gradient(135deg, ${meta.color}25, ${meta.color}10)`,
          border: `1px solid ${meta.color}40`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={20} color={meta.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#F8FAFC" }}>{meta.label}</span>
            {role.isAI && (
              <span style={{
                padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 800,
                background: "rgba(99,102,241,0.2)", color: "#818CF8",
                border: "1px solid rgba(99,102,241,0.35)", letterSpacing: "0.5px",
                display: "flex", alignItems: "center", gap: "4px",
              }}>
                <Cpu size={9} />  AI AGENT
              </span>
            )}
            <span style={{
              padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 700,
              background: `${meta.color}15`, color: meta.color,
              border: `1px solid ${meta.color}35`,
            }}>
              Tier {meta.tier}
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "3px" }}>{meta.title}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "#64748B" }}>Daily Tasks</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: meta.color }}>{role.dailyTasks.length}</div>
          </div>
          {open
            ? <ChevronUp size={18} color="#64748B" />
            : <ChevronDown size={18} color="#64748B" />
          }
        </div>
      </button>

      {/* Expanded Body */}
      {open && (
        <div style={{ borderTop: `1px solid #334155` }}>
          {/* Summary */}
          <div style={{ padding: "16px 20px", background: "#0F172A", borderBottom: "1px solid #334155" }}>
            <p style={{ fontSize: "13px", color: "#CBD5E1", margin: 0, lineHeight: 1.7 }}>
              {role.dailySummary}
            </p>
          </div>

          {/* KPIs */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #334155", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {role.kpis.map((kpi, i) => (
              <span key={i} style={{
                padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                background: `${meta.color}10`, color: meta.color,
                border: `1px solid ${meta.color}30`,
              }}>
                📊 {kpi}
              </span>
            ))}
          </div>

          {/* Tab Switcher */}
          <div style={{ display: "flex", borderBottom: "1px solid #334155", background: "#0F172A" }}>
            {(["tasks", "workflow", "access"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: "10px", background: "none",
                  border: "none", borderBottom: activeTab === tab ? `2px solid ${meta.color}` : "2px solid transparent",
                  color: activeTab === tab ? meta.color : "#64748B",
                  fontSize: "12px", fontWeight: 700, cursor: "pointer",
                  textTransform: "capitalize", letterSpacing: "0.3px",
                }}
              >
                {tab === "tasks" ? "📋 Daily Tasks" : tab === "workflow" ? "🔄 Workflow" : "🔐 Access"}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: "16px 20px" }}>
            {/* Daily Tasks Tab */}
            {activeTab === "tasks" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {role.dailyTasks.map((task, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: "12px",
                    padding: "10px 12px", background: "#0F172A",
                    borderRadius: "10px", border: "1px solid #334155",
                  }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: "8px", fontSize: "10px",
                      fontWeight: 700, background: "#1E293B", color: "#94A3B8",
                      border: "1px solid #475569", whiteSpace: "nowrap", flexShrink: 0, minWidth: "60px",
                      textAlign: "center",
                    }}>{task.time}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "13px", color: "#CBD5E1", lineHeight: 1.5 }}>{task.task}</span>
                      {task.module && (
                        <a
                          href={task.moduleUrl}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            fontSize: "10px", color: meta.color, marginTop: "4px",
                            textDecoration: "none", fontWeight: 600,
                          }}
                        >
                          <ArrowRight size={9} /> {task.module}
                        </a>
                      )}
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                ))}
              </div>
            )}

            {/* Workflow Tab */}
            {activeTab === "workflow" && (
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", left: "19px", top: "20px", bottom: "20px",
                  width: "1px", background: `linear-gradient(to bottom, ${meta.color}60, transparent)`,
                }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {role.workflows.map((wf, i) => (
                    <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${meta.color}30, ${meta.color}10)`,
                        border: `2px solid ${meta.color}50`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, zIndex: 1,
                      }}>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: meta.color }}>{wf.step}</span>
                      </div>
                      <div style={{
                        flex: 1, padding: "10px 14px", background: "#0F172A",
                        borderRadius: "10px", border: "1px solid #334155",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#F8FAFC" }}>{wf.title}</span>
                          {wf.timing && (
                            <span style={{
                              fontSize: "10px", color: meta.color, background: `${meta.color}15`,
                              padding: "2px 8px", borderRadius: "20px", border: `1px solid ${meta.color}30`,
                              fontWeight: 700, whiteSpace: "nowrap",
                            }}><Clock size={9} style={{ display: "inline", marginRight: "3px" }} />{wf.timing}</span>
                          )}
                        </div>
                        <p style={{ fontSize: "12px", color: "#94A3B8", margin: "6px 0 0 0", lineHeight: 1.6 }}>{wf.detail}</p>
                        {wf.module && (
                          <a
                            href={wf.moduleUrl}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "4px",
                              fontSize: "10px", color: meta.color, marginTop: "6px",
                              textDecoration: "none", fontWeight: 600,
                            }}
                          >
                            <ArrowRight size={9} /> {wf.module}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Access Tab */}
            {activeTab === "access" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    marginBottom: "10px", fontSize: "12px", fontWeight: 700, color: "#10B981",
                  }}>
                    <CheckCircle2 size={14} color="#10B981" /> Granted Permissions
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {role.permissions.map((p, i) => (
                      <div key={i} style={{
                        padding: "8px 10px", background: "rgba(16,185,129,0.05)",
                        border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px",
                        fontSize: "11px", color: "#A7F3D0", lineHeight: 1.5,
                      }}>
                        ✓ {p}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    marginBottom: "10px", fontSize: "12px", fontWeight: 700, color: "#EF4444",
                  }}>
                    <Lock size={14} color="#EF4444" /> Restrictions
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {role.restrictions.map((r, i) => (
                      <div key={i} style={{
                        padding: "8px 10px", background: "rgba(239,68,68,0.05)",
                        border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px",
                        fontSize: "11px", color: "#FCA5A5", lineHeight: 1.5,
                      }}>
                        ✕ {r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffTasksPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "AI" | "HUMAN">("ALL");

  const filtered = ROLES.filter((r) => {
    const meta = getRoleMeta(r.key);
    const matchSearch =
      !search ||
      meta.label.toLowerCase().includes(search.toLowerCase()) ||
      meta.title.toLowerCase().includes(search.toLowerCase()) ||
      r.dailySummary.toLowerCase().includes(search.toLowerCase());
    const matchType =
      filterType === "ALL" ||
      (filterType === "AI" && r.isAI) ||
      (filterType === "HUMAN" && !r.isAI);
    return matchSearch && matchType;
  });

  const aiRoles = ROLES.filter((r) => r.isAI);
  const humanRoles = ROLES.filter((r) => !r.isAI);
  const totalTasks = ROLES.reduce((sum, r) => sum + r.dailyTasks.length, 0);

  return (
    <AdminLayoutShell>
      <div style={{ padding: "var(--space-5)", maxWidth: "1200px", margin: "0 auto" }}>
        {/* ── Page Header ── */}
        <header style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(14,165,233,0.15))",
              border: "1px solid rgba(99,102,241,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Layers size={22} color="#818CF8" />
            </div>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#F8FAFC", margin: 0 }}>
                Staff & AI Duties Registry
              </h1>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Daily task delegation, workflow SOPs & role-based access controls
              </span>
            </div>
          </div>

          {/* Summary Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginTop: "20px" }}>
            {[
              { label: "Total Roles",       value: ROLES.length,       icon: Users,   color: "#0EA5E9" },
              { label: "AI Agent Roles",    value: aiRoles.length,     icon: Bot,     color: "#6366F1" },
              { label: "Human Staff Roles", value: humanRoles.length,  icon: UserCheck,color: "#10B981" },
              { label: "Daily Tasks Total", value: totalTasks,         icon: ClipboardList, color: "#F59E0B" },
            ].map((s) => (
              <div key={s.label} style={{
                padding: "14px 16px", background: "#1E293B",
                border: "1px solid #334155", borderRadius: "12px",
                display: "flex", alignItems: "center", gap: "12px",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "10px",
                  background: `${s.color}20`, border: `1px solid ${s.color}35`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <s.icon size={17} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </header>

        {/* ── Filters ── */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{
            flex: 1, minWidth: "200px",
            display: "flex", alignItems: "center", gap: "10px",
            background: "#1E293B", border: "1px solid #334155", borderRadius: "10px", padding: "9px 14px",
          }}>
            <Search size={15} color="#64748B" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles, tasks, workflows..."
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: "#F8FAFC", fontSize: "13px",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["ALL", "AI", "HUMAN"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: "9px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 700,
                  cursor: "pointer", border: "none",
                  background: filterType === t ? "#0EA5E9" : "#1E293B",
                  color: filterType === t ? "#fff" : "#64748B",
                  letterSpacing: "0.4px",
                }}
              >
                {t === "ALL" ? "All Roles" : t === "AI" ? "🤖 AI Agents" : "👤 Human Staff"}
              </button>
            ))}
          </div>
        </div>

        {/* ── AI Agents Section ── */}
        {(filterType === "ALL" || filterType === "AI") && (
          <section style={{ marginBottom: "32px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              marginBottom: "14px", padding: "10px 14px",
              background: "linear-gradient(90deg, rgba(99,102,241,0.12), rgba(99,102,241,0.03))",
              borderRadius: "10px", border: "1px solid rgba(99,102,241,0.25)",
            }}>
              <Bot size={16} color="#818CF8" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#818CF8" }}>Autonomous AI Agents</span>
              <span style={{
                marginLeft: "auto", fontSize: "11px", color: "#6366F1",
                background: "rgba(99,102,241,0.15)", padding: "2px 8px", borderRadius: "10px",
                border: "1px solid rgba(99,102,241,0.3)", fontWeight: 700,
              }}>24/7 AUTONOMOUS OPERATION</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filtered.filter((r) => r.isAI).map((role) => (
                <RoleCard key={role.key} role={role} />
              ))}
              {filtered.filter((r) => r.isAI).length === 0 && (
                <div style={{ padding: "32px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>
                  No AI agent roles match your search.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Human Staff Section ── */}
        {(filterType === "ALL" || filterType === "HUMAN") && (
          <section>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              marginBottom: "14px", padding: "10px 14px",
              background: "linear-gradient(90deg, rgba(14,165,233,0.12), rgba(14,165,233,0.03))",
              borderRadius: "10px", border: "1px solid rgba(14,165,233,0.25)",
            }}>
              <Users size={16} color="#38BDF8" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#38BDF8" }}>Human Staff Delegation</span>
              <span style={{
                marginLeft: "auto", fontSize: "11px", color: "#0EA5E9",
                background: "rgba(14,165,233,0.15)", padding: "2px 8px", borderRadius: "10px",
                border: "1px solid rgba(14,165,233,0.3)", fontWeight: 700,
              }}>ROLE-BASED ACCESS CONTROL</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filtered.filter((r) => !r.isAI).map((role, i) => (
                <RoleCard key={role.key} role={role} defaultOpen={i === 0} />
              ))}
              {filtered.filter((r) => !r.isAI).length === 0 && (
                <div style={{ padding: "32px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>
                  No human staff roles match your search.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Footer Note ── */}
        <div style={{
          marginTop: "32px", padding: "16px 20px",
          background: "rgba(15,23,42,0.8)", border: "1px solid #334155",
          borderRadius: "12px", fontSize: "12px", color: "#64748B", lineHeight: 1.7,
        }}>
          🛡️ <strong style={{ color: "#94A3B8" }}>RBAC Policy Notice:</strong> All access controls are enforced via the platform's Role-Based Access Control (RBAC) engine.
          Permissions listed reflect the current production policy configuration in <code style={{ color: "#38BDF8", fontSize: "11px" }}>src/lib/rbac.ts</code>.
          Any modifications to role permissions require authorization from the <strong style={{ color: "#EF4444" }}>Chief Commander (Super Admin)</strong> and
          are recorded in the tamper-evident audit ledger.
        </div>
      </div>
    </AdminLayoutShell>
  );
}
