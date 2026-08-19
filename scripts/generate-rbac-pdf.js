const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'HandyHub_Pro_Staff_Roles_and_Access_Control_Architecture.pdf');
const doc = new PDFDocument({
  margin: 36,
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
  cyan: '#06B6D4',
  orange: '#F97316',
  blue: '#3B82F6',
  amber: '#F59E0B',
  green: '#10B981',
  purple: '#8B5CF6',
  pink: '#EC4899',
  lightBg: '#F8FAFC',
};

// -------------------------------------------------------------
// PAGE 1: HEADER & OVERVIEW & ROLES
// -------------------------------------------------------------

// Header Box
doc.rect(36, 36, 523, 75).fill(COLORS.navyDark);

doc.fillColor(COLORS.primary).fontSize(9).font('Helvetica-Bold')
   .text('HANDYHUB PRO SOLUTIONS  •  EXECUTIVE GOVERNANCE SUITE', 50, 48);

doc.fillColor(COLORS.white).fontSize(16).font('Helvetica-Bold')
   .text('Dual Executive Governance & RBAC Protocol (v3.0)', 50, 62);

doc.fillColor('#94A3B8').fontSize(8.5).font('Helvetica')
   .text('Super Admin & CAO Hierarchy  •  Configurable Thresholds  •  AI Operations Diagnostics', 50, 84);

doc.moveDown(3);

// Section 1: Executive Overview
let y = 122;
doc.fillColor(COLORS.primaryDark).fontSize(12).font('Helvetica-Bold')
   .text('1. Executive Overview & Security Philosophy', 36, y);

y += 16;
doc.fillColor(COLORS.textDark).fontSize(8.5).font('Helvetica').lineGap(2.5)
   .text(
     'HandyHub Pro Solutions enforces a Dual-Executive Governance & Least-Privilege Role-Based Access Control (RBAC) architecture. Administrative authority is partitioned across strategic policy (Super Admin) and operational coordination (Executive Operations / CAO), supported by specialized departmental managers with cryptographic audit logging.',
     36, y, { width: 523, align: 'justify' }
   );

y += 40;

// Section 2: Administrative Roles
doc.fillColor(COLORS.primaryDark).fontSize(12).font('Helvetica-Bold')
   .text('2. Enterprise Staff Roles & Functional Hierarchy', 36, y);

y += 16;

const roles = [
  {
    role: 'SUPER_ADMIN',
    title: 'Chief Commander (Super Admin)',
    color: COLORS.red,
    desc: 'Supreme platform sovereignty. Sets policy, manages staff promotions, approves high-risk financial decisions (>₦100k escrow, >₦50k refunds), and controls database backups.',
  },
  {
    role: 'EXECUTIVE_OPERATIONS_MANAGER',
    title: 'Executive Operations / CAO (Second-in-Command)',
    color: COLORS.cyan,
    desc: 'Cross-departmental command. Coordinates field bookings, marketplace merchants, parts procurement, and verification. Escalates items exceeding autonomous thresholds to Super Admin.',
  },
  {
    role: 'OPERATIONS_MANAGER',
    title: 'Operations Manager (Field Dispatch)',
    color: COLORS.blue,
    desc: 'Command of field bookings, live technician radar, district radius tuning, and active artisan job matching.',
  },
  {
    role: 'MARKETPLACE_MANAGER',
    title: 'Marketplace & Logistics Manager',
    color: COLORS.green,
    desc: 'Commercial store onboarding, physical storefront GPS checks, catalog SKU moderation, and multi-zone delivery fees.',
  },
  {
    role: 'VERIFICATION_OFFICER',
    title: 'Verification & Compliance Officer',
    color: COLORS.amber,
    desc: 'Audits 5-pillar artisan dossiers (NIN, facial biometrics, trade cert, address proof, guarantors) and customer proof of address.',
  },
  {
    role: 'FINANCE',
    title: 'Finance & Escrow Controller',
    color: COLORS.pink,
    desc: 'Audits Paystack transaction logs, reviews artisan bank withdrawal requests, manages promo budgets, and audits escrow balances.',
  },
  {
    role: 'CUSTOMER_SUPPORT',
    title: 'Customer Support Specialist',
    color: COLORS.purple,
    desc: 'Customer ticket mediation, live booking progress tracking, review moderation, and dispute triage.',
  },
];

roles.forEach((r) => {
  doc.rect(36, y, 523, 44).fillAndStroke(COLORS.lightBg, '#E2E8F0');
  doc.rect(36, y, 4, 44).fill(r.color);

  doc.fillColor(COLORS.textDark).fontSize(9.5).font('Helvetica-Bold')
     .text(r.title, 48, y + 6);
  
  doc.fillColor(r.color).fontSize(7.5).font('Helvetica-Bold')
     .text(`[ ROLE: ${r.role} ]`, 260, y + 7);

  doc.fillColor('#334155').fontSize(7.5).font('Helvetica').lineGap(1.5)
     .text(r.desc, 48, y + 19, { width: 500 });

  y += 48;
});

// -------------------------------------------------------------
// PAGE 2: PERMISSIONS MATRIX & THRESHOLDS & AI ANALYST
// -------------------------------------------------------------
doc.addPage();

// Header on Page 2
doc.rect(36, 36, 523, 32).fill(COLORS.navyDark);
doc.fillColor(COLORS.white).fontSize(11).font('Helvetica-Bold')
   .text('3. Granular Module Permissions & Governance Matrix', 48, 46);

y = 78;

// Table Header
doc.rect(36, y, 523, 20).fill(COLORS.primaryDark);
doc.fillColor(COLORS.white).fontSize(7.5).font('Helvetica-Bold');
doc.text('Module / System Capability', 44, y + 5);
doc.text('Super Admin', 185, y + 5);
doc.text('CAO (Ops)', 245, y + 5);
doc.text('Operations', 305, y + 5);
doc.text('Marketplace', 365, y + 5);
doc.text('Verification', 425, y + 5);
doc.text('Finance', 475, y + 5);
doc.text('Support', 520, y + 5);

y += 20;

const matrix = [
  { mod: 'KPI Command Center & AI Analyst', sa: 'Full', cao: 'Full', op: 'Ops', mk: 'Mkt', vo: '—', fn: 'Fin', cs: '—' },
  { mod: 'Executive Approval Queue', sa: 'Supreme', cao: 'Auton. Limit', op: '—', mk: '—', vo: '—', fn: '—', cs: '—' },
  { mod: 'Bookings Workflow & Live Map', sa: 'Full', cao: 'Full', op: 'Full', mk: '—', vo: '—', fn: 'Audit', cs: 'Track' },
  { mod: 'Marketplace & Partner Stores', sa: 'Full', cao: 'Full', op: 'View', mk: 'Full', vo: '—', fn: 'Audit', cs: 'View' },
  { mod: 'Spare Parts & Supplier Vouchers', sa: 'Full', cao: 'Full', op: 'Approve', mk: 'Stores', vo: '—', fn: 'Disburse', cs: '—' },
  { mod: 'Staff Roles & Hierarchy Promotion', sa: 'Authorized', cao: '—', op: '—', mk: '—', vo: '—', fn: '—', cs: '—' },
  { mod: 'Artisan 5-Pillar Compliance', sa: 'Full', cao: 'Full', op: 'View', mk: '—', vo: 'Full', fn: '—', cs: 'View' },
  { mod: 'Customer Address Proof Audits', sa: 'Full', cao: 'Full', op: '—', mk: '—', vo: 'Full', fn: '—', cs: '—' },
  { mod: 'Disputes & Customer Refunds', sa: 'Full', cao: '≤ ₦50k', op: 'Mediate', mk: 'Mkt Disp', vo: '—', fn: 'Refund Auth', cs: 'Triage' },
  { mod: 'Escrow Vault & Bank Withdrawals', sa: 'Full', cao: '≤ ₦100k', op: '—', mk: '—', vo: '—', fn: 'Full', cs: '—' },
  { mod: 'Commission Policy & System Config', sa: 'Authorized', cao: '—', op: '—', mk: '—', vo: '—', fn: '—', cs: '—' },
  { mod: 'Database Backups & System Purge', sa: 'Authorized', cao: '—', op: '—', mk: '—', vo: '—', fn: '—', cs: '—' },
];

matrix.forEach((row, idx) => {
  const bg = idx % 2 === 0 ? COLORS.lightBg : COLORS.white;
  doc.rect(36, y, 523, 16).fillAndStroke(bg, '#E2E8F0');

  doc.fillColor(COLORS.textDark).fontSize(7).font('Helvetica-Bold')
     .text(row.mod, 42, y + 4);

  const drawCell = (val, x) => {
    if (val === '—') {
      doc.fillColor('#94A3B8').fontSize(7).font('Helvetica').text('—', x, y + 4);
    } else if (val === 'Full' || val === 'Supreme' || val === 'Authorized') {
      doc.fillColor(COLORS.green).fontSize(7).font('Helvetica-Bold').text(val, x, y + 4);
    } else {
      doc.fillColor(COLORS.blue).fontSize(7).font('Helvetica').text(val, x, y + 4);
    }
  };

  drawCell(row.sa, 185);
  drawCell(row.cao, 245);
  drawCell(row.op, 305);
  drawCell(row.mk, 365);
  drawCell(row.vo, 425);
  drawCell(row.fn, 475);
  drawCell(row.cs, 520);

  y += 16;
});

y += 14;

// Section 4: Configurable Approval Thresholds
doc.fillColor(COLORS.primaryDark).fontSize(11).font('Helvetica-Bold')
   .text('4. Autonomous Thresholds & Escalation Protocol', 36, y);

y += 14;

const thresholds = [
  { item: 'Escrow Payout Releases', limit: '≤ ₦100,000 Autonomous (CAO)', esc: '> ₦100,000 Mandatory Super Admin' },
  { item: 'Customer Dispute Refunds', limit: '≤ ₦50,000 Autonomous (CAO)', esc: '> ₦50,000 Mandatory Super Admin' },
  { item: 'Procurement Part Quotes', limit: '≤ ₦75,000 Autonomous (CAO)', esc: '> ₦75,000 Mandatory Super Admin' },
  { item: 'Staff Role Reassignments', limit: 'Strictly Super Admin Only', esc: 'All promotions & hiring' },
];

thresholds.forEach((t) => {
  doc.rect(36, y, 523, 20).fillAndStroke(COLORS.lightBg, '#CBD5E1');
  doc.fillColor(COLORS.textDark).fontSize(7.5).font('Helvetica-Bold').text(t.item, 44, y + 5);
  doc.fillColor(COLORS.cyan).fontSize(7.5).font('Helvetica-Bold').text(t.limit, 180, y + 5);
  doc.fillColor(COLORS.red).fontSize(7.5).font('Helvetica-Bold').text(t.esc, 360, y + 5);
  y += 22;
});

y += 10;

// Section 5: AI Executive Operations Analyst
doc.fillColor(COLORS.primaryDark).fontSize(11).font('Helvetica-Bold')
   .text('5. AI Executive Operations Analyst Engine', 36, y);

y += 14;
doc.fillColor(COLORS.textDark).fontSize(7.8).font('Helvetica').lineGap(2)
   .text(
     'The autonomous AI Analyst inspects real-time PostgreSQL database telemetry across booking assignment velocity, price quote variance, dispute backlog, and merchant fulfillment SLAs to produce a dynamic Platform Health Index (0-100) with actionable 1-click executive remediations.',
     36, y, { width: 523 }
   );

// Footer
const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
  doc.switchToPage(i);
  doc.rect(36, 792, 523, 1).fill('#CBD5E1');
  doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica')
     .text('HandyHub Pro Solutions  •  Confidential & Proprietary Enterprise Governance Protocol', 36, 800);
  doc.text(`Page ${i + 1} of ${pages.count}`, 500, 800, { align: 'right' });
}

doc.end();

stream.on('finish', () => {
  console.log('Executive RBAC PDF generated successfully at:', outputPath);
});
