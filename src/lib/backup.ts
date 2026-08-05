/**
 * Database Snapshot & Backup Utility for HandyHub Pro Solutions
 * Export system records into JSON snapshots for Super Admin security audit & disaster recovery.
 */

import { prisma } from "@/lib/db";

export interface SystemBackupData {
  timestamp: string;
  version: string;
  environment: string;
  stats: {
    usersCount: number;
    professionalsCount: number;
    bookingsCount: number;
    paymentsCount: number;
    disputesCount: number;
  };
  users: any[];
  professionals: any[];
  bookings: any[];
  payments: any[];
  disputes: any[];
  auditLogs: any[];
}

export async function generateDatabaseSnapshot(adminUserId: string): Promise<SystemBackupData> {
  const [users, professionals, bookings, payments, disputes, auditLogs] = await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, isVerified: true, createdAt: true } }),
    prisma.professional.findMany({ select: { id: true, userId: true, verificationStatus: true, rating: true, totalJobs: true, idType: true, idNumber: true, addressVerified: true } }),
    prisma.booking.findMany({ take: 500, orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany({ take: 500, orderBy: { createdAt: "desc" } }),
    prisma.dispute.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.auditLog.findMany({ take: 200, orderBy: { createdAt: "desc" } }),
  ]);

  // Record audit log entry for database backup action
  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: "GENERATE_DATABASE_BACKUP",
      entity: "System",
      details: JSON.stringify({
        usersCount: users.length,
        bookingsCount: bookings.length,
        disputesCount: disputes.length,
      }),
    },
  });

  return {
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "production",
    stats: {
      usersCount: users.length,
      professionalsCount: professionals.length,
      bookingsCount: bookings.length,
      paymentsCount: payments.length,
      disputesCount: disputes.length,
    },
    users,
    professionals,
    bookings,
    payments,
    disputes,
    auditLogs,
  };
}
