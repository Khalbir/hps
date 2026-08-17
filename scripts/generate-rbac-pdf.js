const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'HandyHub_Pro_Staff_Roles_and_Access_Control_Architecture.pdf');
const doc = new PDFDocument({
  margin: 40,
  size: 'A4',
  bufferPages: true,
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Color Palette
const COLORS = {
  primary: '#0284C7',     // Sky Blue
  primaryDark: '#0369A1',
  navyDark: '#0F172A',
  slateDark: '#1E293B',
  slateBorder: '#334155',
  textDark: '#0F172A',
  textMuted: '#64748B',
  white: '#FFFFFF',
  red: '#EF4444',
  orange: '#F97316',
  blue: '#3B82F6',
  amber: '#F59E0B',
  green: '#10B981',
  purple: '#8B5CF6',
  lightBg: '#F8FAFC',
};

// -------------------------------------------------------------
// PAGE 1: HEADER & OVERVIEW & ROLES
// -------------------------------------------------------------

// Header Box
doc.rect(40, 40, 515, 75).fill(COLORS.navyDark);

doc.fillColor(COLORS.primary).fontSize(10).font('Helvetica-Bold')
   .text('HANDYHUB PRO SOLUTIONS  •  EXECUTIVE GOVERNANCE SUITE', 55, 52);

doc.fillColor(COLORS.white).fontSize(18).font('Helvetica-Bold')
   .text('Staff Roles & Access Control Architecture (RBAC)', 55, 68);

doc.fillColor('#94A3B8').fontSize(9).font('Helvetica')
   .text('Security Protocol Specification  •  Version 2.4 (Production Live)  •  FCT Abuja & National Expansion', 55, 92);

doc.moveDown(3);

// Section 1: Executive Overview
let y = 130;
doc.fillColor(COLORS.primaryDark).fontSize(13).font('Helvetica-Bold')
   .text('1. Executive Overview & Security Philosophy', 40, y);

y += 18;
doc.fillColor(COLORS.textDark).fontSize(9.5).font('Helvetica').lineGap(3)
   .text(
     'HandyHub Pro Solutions enforces a strict Role-Based Access Control (RBAC) architecture designed on the Principle of Least Privilege. Administrative privileges are partitioned into 5 discrete functional tiers, ensuring operational agility while guaranteeing financial isolation, customer data privacy, and tamper-proof compliance audits.',
     40, y, { width: 515, align: 'justify' }
   );

y += 48;

// Section 2: The 5 Administrative Roles
doc.fillColor(COLORS.primaryDark).fontSize(13).font('Helvetica-Bold')
   .text('2. Administrative Staff Roles & Responsibilities', 40, y);

y += 18;

const roles = [
  {
    role: 'SUPER_ADMIN',
    title: 'Chief Commander',
    color: COLORS.red,
    desc: 'Supreme platform sovereignty. Complete unchecked authority over global system settings, dynamic commission percentages, database backups, staff promotions, API credentials, and administrative overrides.',
  },
  {
    role: 'OPERATIONS_MANAGER',
    title: 'Operations Manager',
    color: COLORS.blue,
    desc: 'Command of field dispatch, booking state lifecycles (Assigned, En Route, In Progress), artisan radius zones, active artisan reassignments, and operational dispute triage.',
  },
  {
    role: 'VERIFICATION_OFFICER',
    title: 'Verification Officer',
    color: COLORS.amber,
    desc: 'Responsible for trust, safety, and compliance. Audits the 5-pillar artisan dossier (NIN identity, live facial biometric selfie, trade competency certificate, residential utility bill, guarantors, trade quiz) and customer address proofs.',
  },
  {
    role: 'CUSTOMER_SUPPORT',
    title: 'Customer Support Agent',
    color: COLORS.green,
    desc: 'Customer experience and issue mediation. Handles booking status tracking, customer inquiries, dispute ticket mediation, review moderation, and artisan performance triage.',
  },
  {
    role: 'FINANCE',
    title: 'Finance Administrator',
    color: COLORS.purple,
    desc: 'Oversees financial infrastructure. Audits Paystack/Monnify payment logs, manages the Escrow Vault (holding, release, customer refunds), reviews artisan bank withdrawal requests, and manages promo code budgets.',
  },
];

roles.forEach((r) => {
  // Card Container
  doc.rect(40, y, 515, 62).fillAndStroke(COLORS.lightBg, '#E2E8F0');
  
  // Left Color Accent Bar
  doc.rect(40, y, 5, 62).fill(r.color);

  // Role Title & Badge
  doc.fillColor(COLORS.textDark).fontSize(11).font('Helvetica-Bold')
     .text(r.title, 55, y + 8);
  
  doc.fillColor(r.color).fontSize(8.5).font('Helvetica-Bold')
     .text(`[ ROLE: ${r.role} ]`, 220, y + 9);

  // Role Description
  doc.fillColor('#334155').fontSize(8.5).font('Helvetica').lineGap(2)
     .text(r.desc, 55, y + 24, { width: 485 });

  y += 70;
});

// -------------------------------------------------------------
// PAGE 2: PERMISSIONS MATRIX & SECURITY CONTROLS
// -------------------------------------------------------------
doc.addPage();

// Header on Page 2
doc.rect(40, 40, 515, 36).fill(COLORS.navyDark);
doc.fillColor(COLORS.white).fontSize(12).font('Helvetica-Bold')
   .text('3. Granular Module Permissions Matrix', 52, 52);

y = 90;

// Table Header
doc.rect(40, y, 515, 22).fill(COLORS.primaryDark);
doc.fillColor(COLORS.white).fontSize(8).font('Helvetica-Bold');
doc.text('Dashboard Module / Permission', 48, y + 6);
doc.text('Super Admin', 215, y + 6);
doc.text('Operations', 285, y + 6);
doc.text('Verification', 355, y + 6);
doc.text('Support', 425, y + 6);
doc.text('Finance', 485, y + 6);

y += 22;

const matrix = [
  { module: 'KPI Command Center Telemetry (/dashboard)', sa: 'Full', op: 'Full', vo: 'Full', cs: 'Full', fn: 'Full' },
  { module: 'Live Map & Dispatch Radius (/map)', sa: 'Full', op: 'Full', vo: '—', cs: '—', fn: '—' },
  { module: 'Bookings Workflow & Dispatch (/bookings)', sa: 'Full', op: 'Full', vo: '—', cs: 'Read/Triage', fn: 'Audit' },
  { module: 'Users & Staff Role Directory (/users)', sa: 'Full', op: 'View Users', vo: '—', cs: 'View Users', fn: '—' },
  { module: 'Staff Hiring & Role Promotion', sa: 'Authorized', op: '—', vo: '—', cs: '—', fn: '—' },
  { module: 'Artisan Verification Dossiers (/professionals)', sa: 'Full', op: 'View Only', vo: 'Approve/Reject', cs: 'View Only', fn: '—' },
  { module: 'Customer Address Proof Audits (/verification)', sa: 'Full', op: '—', vo: 'Approve/Reject', cs: '—', fn: '—' },
  { module: 'Dispute & Refund Resolution (/disputes)', sa: 'Full', op: 'Manage', vo: '—', cs: 'Mediate', fn: 'Refund Auth' },
  { module: 'Payments & Escrow Vault (/payments)', sa: 'Full', op: '—', vo: '—', cs: '—', fn: 'Full Audit' },
  { module: 'Escrow Payout Releases & Refunds', sa: 'Authorized', op: '—', vo: '—', cs: '—', fn: 'Authorized' },
  { module: 'Customer Reviews & Moderation (/reviews)', sa: 'Full', op: 'Moderate', vo: '—', cs: 'Moderate', fn: '—' },
  { module: 'Promo Codes Campaign Engine (/promo-codes)', sa: 'Full', op: '—', vo: '—', cs: '—', fn: 'Manage' },
  { module: 'Analytics & Financial Export (/analytics)', sa: 'Full', op: 'Ops Metrics', vo: '—', cs: '—', fn: 'Rev Reports' },
  { module: 'Commission & Escrow Policy (/settings)', sa: 'Authorized', op: '—', vo: '—', cs: '—', fn: '—' },
  { module: 'Database Backups & System Purge', sa: 'Authorized', op: '—', vo: '—', cs: '—', fn: '—' },
];

matrix.forEach((row, idx) => {
  const bg = idx % 2 === 0 ? COLORS.lightBg : COLORS.white;
  doc.rect(40, y, 515, 18).fillAndStroke(bg, '#E2E8F0');

  doc.fillColor(COLORS.textDark).fontSize(7.5).font('Helvetica-Bold')
     .text(row.module, 48, y + 5);

  const drawCell = (val, x) => {
    if (val === '—') {
      doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica').text('—', x, y + 5);
    } else if (val === 'Full' || val === 'Authorized' || val === 'Approve/Reject') {
      doc.fillColor(COLORS.green).fontSize(7.5).font('Helvetica-Bold').text(val, x, y + 5);
    } else {
      doc.fillColor(COLORS.blue).fontSize(7.5).font('Helvetica').text(val, x, y + 5);
    }
  };

  drawCell(row.sa, 215);
  drawCell(row.op, 285);
  drawCell(row.vo, 355);
  drawCell(row.cs, 425);
  drawCell(row.fn, 485);

  y += 18;
});

y += 20;

// Section 4: Enforcement Architecture
doc.fillColor(COLORS.primaryDark).fontSize(12).font('Helvetica-Bold')
   .text('4. Multi-Layer Enforcement Architecture', 40, y);

y += 16;

const layers = [
  {
    title: 'A. Dynamic Navigation Filtering (Frontend UI)',
    desc: 'The Admin Layout Shell evaluates logged-in staff roles against src/lib/rbac.ts. Unauthorized dashboard modules and tools are completely omitted from the sidebar navigation menu.',
  },
  {
    title: 'B. Server-Side Route Guarding & API Authorization',
    desc: 'Every backend endpoint (/api/admin/*) cryptographically inspects the requesting session and cookies. Direct URL manipulation returns HTTP 403 Forbidden with zero data exposure.',
  },
  {
    title: 'C. Immutable Audit Trail Logging',
    desc: 'High-consequence actions (artisan verification, escrow payout releases, dispute refunds, staff promotion, and commission rule updates) write immutable records to the PostgreSQL AuditLog ledger with actor ID, timestamp, and metadata.',
  },
];

layers.forEach((l) => {
  doc.fillColor(COLORS.textDark).fontSize(8.5).font('Helvetica-Bold').text(l.title, 40, y);
  y += 11;
  doc.fillColor(COLORS.textMuted).fontSize(8).font('Helvetica').lineGap(2).text(l.desc, 40, y, { width: 515 });
  y += 26;
});

// Footer
const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
  doc.switchToPage(i);
  doc.rect(40, 790, 515, 1).fill('#CBD5E1');
  doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica')
     .text('HandyHub Pro Solutions  •  Confidential & Proprietary Governance Protocol', 40, 798);
  doc.text(`Page ${i + 1} of ${pages.count}`, 500, 798, { align: 'right' });
}

doc.end();

stream.on('finish', () => {
  console.log('PDF successfully generated at:', outputPath);
});
