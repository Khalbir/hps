-- HandyHub Pro Solutions - Address Verification & Risk-Based Security RLS
-- Migration Date: 2026-08-12

-- 1. Enable Row-Level Security (RLS) on Core Tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;

-- 2. Client Security Policies for User Profile & Address Data
-- Policy: Users can view their own profile data
CREATE POLICY "Users can read own profile"
ON "User" FOR SELECT
USING (auth.uid()::text = id OR role = 'ADMIN' OR role = 'SUPER_ADMIN');

-- Policy: Clients can update their profile and submit pending addresses, but CANNOT self-verify or approve change requests
CREATE POLICY "Users can update own non-sensitive profile fields"
ON "User" FOR UPDATE
USING (auth.uid()::text = id)
WITH CHECK (
  auth.uid()::text = id
  -- Standard clients cannot alter permanentAddressStatus to VERIFIED directly
  AND (
    role IN ('ADMIN', 'SUPER_ADMIN') 
    OR ("permanentAddressStatus" != 'VERIFIED' OR "permanentAddressStatus" = OLD."permanentAddressStatus")
  )
);

-- Policy: Admin Users can update any user's verification status
CREATE POLICY "Admins full management of user verifications"
ON "User" FOR ALL
USING (role IN ('ADMIN', 'SUPER_ADMIN'));

-- 3. Booking Address Security Policies
-- Policy: Users can view their own saved booking addresses
CREATE POLICY "Users view own booking addresses"
ON "Address" FOR SELECT
USING (auth.uid()::text = "userId" OR role IN ('ADMIN', 'SUPER_ADMIN'));

-- Policy: Verified users can manage their booking addresses
CREATE POLICY "Users manage own booking addresses"
ON "Address" FOR ALL
USING (auth.uid()::text = "userId");

-- 4. Audit Log Policies
-- Policy: Admins can view all audit logs
CREATE POLICY "Admins read audit logs"
ON "AuditLog" FOR SELECT
USING (role IN ('ADMIN', 'SUPER_ADMIN'));

-- Policy: System/Admins can insert audit logs
CREATE POLICY "System insert audit logs"
ON "AuditLog" FOR INSERT
WITH CHECK (true);

-- 5. Service & Risk Level Security Policies
-- Policy: Anyone can view active services
CREATE POLICY "Public read services"
ON "Service" FOR SELECT
USING ("isActive" = true OR role IN ('ADMIN', 'SUPER_ADMIN'));

-- 6. Notification Policies
-- Policy: Users view their own notifications
CREATE POLICY "Users view own notifications"
ON "Notification" FOR SELECT
USING (auth.uid()::text = "userId");

-- Policy: Users update read status on their own notifications
CREATE POLICY "Users update own notifications"
ON "Notification" FOR UPDATE
USING (auth.uid()::text = "userId");
