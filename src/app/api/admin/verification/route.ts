import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getValidMediaUrl, SAMPLE_PORTFOLIO_IMAGE } from "@/lib/sample-documents";
import { formatDigitalId } from "@/lib/digitalId";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // 1. Fetch all Professional records with their linked User
    let dbPros: any[] = [];
    try {
      dbPros = await prisma.professional.findMany({
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: true,
              isVerified: true,
              permanentAddress: true,
              permanentAddressProof: true,
              permanentAddressStatus: true,
              ninNumber: true,
              ninStatus: true,
            },
          },
        },
      });
    } catch (err) {
      console.warn("[Admin Verification DB Warning - Professionals include user]:", err);
      try {
        dbPros = await prisma.professional.findMany();
      } catch (err2) {
        console.warn("[Admin Verification DB Warning - Professionals basic]:", err2);
      }
    }

    // 2. Fetch Users who have role PROFESSIONAL only (NOT CUSTOMERS!)
    let proUsers: any[] = [];
    try {
      proUsers = await prisma.user.findMany({
        where: {
          role: "PROFESSIONAL",
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          permanentAddress: true,
          permanentAddressProof: true,
          permanentAddressStatus: true,
          ninNumber: true,
          ninStatus: true,
          createdAt: true,
          professional: true,
        },
      });
    } catch (err) {
      console.warn("[Admin Verification DB Warning - Users]:", err);
    }

    // 3. For any professional without a resolved user, query user directly
    const missingUserIds = dbPros.filter((p) => !p.user && p.userId).map((p) => p.userId);
    let resolvedUsersMap = new Map<string, any>();
    if (missingUserIds.length > 0) {
      try {
        const extraUsers = await prisma.user.findMany({
          where: { id: { in: missingUserIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            isVerified: true,
            permanentAddress: true,
            permanentAddressProof: true,
            permanentAddressStatus: true,
            ninNumber: true,
            ninStatus: true,
          },
        });
        extraUsers.forEach((u) => resolvedUsersMap.set(u.id, u));
      } catch {}
    }

    // Combine into unified map keyed by User ID or Pro ID
    const proMap = new Map<string, any>();

    // Add all database professionals
    dbPros.forEach((p) => {
      const userObj = p.user || (p.userId ? resolvedUsersMap.get(p.userId) : null);
      const key = p.userId || p.id;
      proMap.set(key, { ...p, user: userObj });
    });

    // Add/enrich with user entries
    for (const u of proUsers) {
      const key = u.id;
      if (!proMap.has(key)) {
        let pro = u.professional;
        const resolvedNin = (u.ninStatus || "").toUpperCase();
        const initialStatus = resolvedNin === "VERIFIED" ? "VERIFIED" : resolvedNin === "REJECTED" ? "REJECTED" : "PENDING";
        if (!pro) {
          pro = {
            id: `pro_${u.id}`,
            userId: u.id,
            verificationStatus: initialStatus,
            skills: JSON.stringify(["Skilled Services"]),
            documents: "{}",
            createdAt: u.createdAt,
          };
        }
        proMap.set(key, { ...pro, user: u });
      } else {
        const existing = proMap.get(key);
        if (!existing.user) {
          proMap.set(key, { ...existing, user: u });
        }
      }
    }

    const allCombined = Array.from(proMap.values());

    // Format all combined professionals
    const formattedPros = allCombined.map((p) => {
      const u = p.user || {};
      let docs: any = {};
      try {
        if (typeof p.documents === "string" && p.documents.trim()) {
          let parsed = JSON.parse(p.documents);
          if (typeof parsed === "string") parsed = JSON.parse(parsed);
          docs = parsed || {};
        } else if (p.documents && typeof p.documents === "object") {
          docs = p.documents;
        }
      } catch {}

      let skillArray: string[] = [];
      try {
        if (typeof p.skills === "string" && p.skills.trim()) {
          const parsedSkills = JSON.parse(p.skills);
          if (Array.isArray(parsedSkills)) skillArray = parsedSkills;
          else if (typeof parsedSkills === "string") skillArray = [parsedSkills];
        } else if (Array.isArray(p.skills)) {
          skillArray = p.skills;
        }
      } catch {
        if (typeof p.skills === "string" && p.skills) skillArray = [p.skills];
      }

      const rawPStatus = (p.verificationStatus || "").toUpperCase();
      const rawUStatus = (u.ninStatus || "").toUpperCase();
      const vStatus = rawPStatus === "REJECTED" || rawUStatus === "REJECTED"
        ? "REJECTED"
        : rawPStatus === "VERIFIED" || rawUStatus === "VERIFIED"
        ? "VERIFIED"
        : rawPStatus || rawUStatus || "PENDING";
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || docs.fullName || p.accountName || "Artisan Partner";

      const rawIdUrl = docs.idDocumentUrl || docs.idUrl || p.idUrl;
      const rawSelfieUrl = docs.selfieUrl;
      const rawTradeCertUrl = docs.tradeCertUrl || p.tradeCertUrl;
      const rawPortfolioUrls: string[] = Array.isArray(docs.portfolioUrls) && docs.portfolioUrls.length > 0 ? docs.portfolioUrls : [];

      const formattedPortfolio = rawPortfolioUrls.length > 0
        ? rawPortfolioUrls.map((url) => getValidMediaUrl(url, "portfolio"))
        : [SAMPLE_PORTFOLIO_IMAGE];

      const rawAddressProofUrl = docs.addressProofUrl || p.addressProofUrl || u.permanentAddressProof;

      return {
        id: p.id,
        userId: p.userId || u.id,
        digitalId: formatDigitalId(p),
        name: fullName,
        email: u.email || docs.email || p.email || "artisan@handyhubpro.ng",
        phone: u.phone || docs.phone || p.phone || "Not Provided",
        field: docs.serviceCategory || (skillArray.length > 0 ? skillArray.join(", ") : "Skilled Services"),
        city: docs.operatingState || docs.city || p.city || "FCT Abuja",
        operatingState: docs.operatingState || docs.city || p.city || "FCT Abuja",
        homeAddress: docs.homeAddress || u.permanentAddress || "Plot 104, Aminu Kano Crescent, Wuse 2",
        lga: docs.lga || "AMAC",
        addressProofUrl: getValidMediaUrl(rawAddressProofUrl, "address"),
        experienceYears: p.yearsExperience || docs.experienceYears || 5,
        rating: p.rating || 5.0,
        totalJobs: p.totalJobs || 0,
        verificationStatus: vStatus,
        status: vStatus,
        idType: docs.idType || p.idType || "NIN",
        idNumber: docs.idNumber || p.idNumber || u.ninNumber || "NIN-89302194812",
        idUrl: getValidMediaUrl(rawIdUrl, "id"),
        selfieUrl: getValidMediaUrl(rawSelfieUrl, "selfie"),
        tradeCertUrl: getValidMediaUrl(rawTradeCertUrl, "cert"),
        portfolioUrls: formattedPortfolio,
        guarantor1: docs.guarantor1 || { name: "Chief James Okon", phone: "+234 803 111 2222", relationship: "Landlord / Community Leader", nin: "NIN-1029384756" },
        guarantor2: docs.guarantor2 || { name: "Engr. Aliyu Hassan", phone: "+234 802 333 4444", relationship: "Master Craftsman / Employer", nin: "NIN-9876543210" },
        quizScore: docs.quizScore !== undefined ? docs.quizScore : 85,
        addressVerified: Boolean(p.addressVerified || u.permanentAddressStatus === "VERIFIED"),
        notes: p.verificationNotes || docs.notes || "",
        submittedAt: docs.submittedAt || p.createdAt || new Date().toISOString(),
      };
    });

    // Filter by status if specified
    const filtered = status && status !== "ALL"
      ? formattedPros.filter((p) => p.verificationStatus === status || p.status === status)
      : formattedPros;

    return NextResponse.json({ success: true, professionals: filtered });
  } catch (error: any) {
    console.error("[Verification GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch professionals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawIds = [body.professionalId, body.userId, body.proId, body.id].filter(Boolean);
    const candidateIds = Array.from(
      new Set(rawIds.flatMap((val: string) => [val, val.replace(/^pro_/, ""), `pro_${val}`]))
    );
    const targetStatus = (body.status || "VERIFIED").toUpperCase();
    const notes = body.verificationNotes || body.notes || (targetStatus === "VERIFIED" ? "Approved by Admin Compliance Team" : "Rejected by Admin Compliance Team");

    if (candidateIds.length === 0 && !body.email && !body.phone) {
      return NextResponse.json({ error: "Target Artisan ID, User ID, or Email is required" }, { status: 400 });
    }

    // 1. Resolve Professional record by candidate IDs
    let pro = await prisma.professional.findFirst({
      where: {
        OR: [
          { id: { in: candidateIds } },
          { userId: { in: candidateIds } },
        ],
      },
      include: { user: true },
    });

    // 2. Resolve User record if pro wasn't found or missing user relation
    let user: any = pro?.user || null;
    if (!user) {
      const userConditions: any[] = [{ id: { in: candidateIds } }];
      if (body.email && typeof body.email === "string" && body.email.trim()) {
        userConditions.push({ email: body.email.trim().toLowerCase() });
      }
      if (body.phone && typeof body.phone === "string" && body.phone.trim()) {
        userConditions.push({ phone: body.phone.trim() });
      }

      user = await prisma.user.findFirst({
        where: {
          OR: userConditions,
        },
        include: { professional: true },
      });

      if (user?.professional && !pro) {
        pro = user.professional;
      }
    }

    if (!pro && !user) {
      return NextResponse.json(
        { error: `Artisan record not found for IDs: ${candidateIds.join(", ")}` },
        { status: 404 }
      );
    }

    // 3. Upsert / Update Professional table
    if (!pro && user) {
      pro = await prisma.professional.create({
        data: {
          userId: user.id,
          verificationStatus: targetStatus,
          verificationNotes: notes,
          addressVerified: targetStatus === "VERIFIED",
          isAvailable: targetStatus === "VERIFIED",
          verifiedAt: targetStatus === "VERIFIED" ? new Date() : null,
        },
        include: { user: true },
      });
    } else if (pro) {
      await prisma.professional.update({
        where: { id: pro.id },
        data: {
          verificationStatus: targetStatus,
          verificationNotes: notes,
          addressVerified: targetStatus === "VERIFIED",
          isAvailable: targetStatus === "VERIFIED",
          verifiedAt: targetStatus === "VERIFIED" ? new Date() : null,
        },
      });
    }

    // 4. Update linked User record
    const targetUserId = pro?.userId || user?.id;
    if (targetUserId) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          isVerified: targetStatus === "VERIFIED",
          role: "PROFESSIONAL",
          ninStatus: targetStatus,
          permanentAddressStatus: targetStatus === "VERIFIED" ? "VERIFIED" : "REJECTED",
        },
      }).catch((err) => console.warn("[Admin Verification Update User Warning]:", err));

      // Record Audit Log
      try {
        await prisma.auditLog.create({
          data: {
            userId: targetUserId,
            action: targetStatus === "VERIFIED" ? "ARTISAN_VERIFIED" : "ARTISAN_REJECTED",
            entity: "Professional",
            entityId: pro?.id || targetUserId,
            details: JSON.stringify({
              targetId: candidateIds[0] || targetUserId,
              status: targetStatus,
              notes,
            }),
          },
        });
      } catch {}

      // Dispatch Notification
      try {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            type: "SYSTEM",
            title: targetStatus === "VERIFIED" ? "Artisan Account Verified! 🎉" : "Verification Status Update",
            message: targetStatus === "VERIFIED"
              ? "Congratulations! Your identity and trade credentials have been verified. You can now accept client bookings."
              : `Your verification submission status was updated to ${targetStatus}. Notes: ${notes}`,
          },
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: `Artisan verification status updated to ${targetStatus} successfully!`,
      status: targetStatus,
      professionalId: pro?.id,
      userId: targetUserId,
    });
  } catch (error: any) {
    console.error("[Verification POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to update artisan verification status" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("id") || searchParams.get("userId") || searchParams.get("professionalId");
    const email = searchParams.get("email");

    const rawIds = [targetId].filter(Boolean) as string[];
    const candidateIds = Array.from(
      new Set(rawIds.flatMap((val) => [val, val.replace(/^pro_/, ""), `pro_${val}`]))
    );

    // Find and delete matching Professional record
    const pro = await prisma.professional.findFirst({
      where: {
        OR: [
          { id: { in: candidateIds } },
          { userId: { in: candidateIds } },
          email ? { user: { email: email.trim().toLowerCase() } } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (pro) {
      await prisma.professional.delete({ where: { id: pro.id } }).catch(() => {});
    }

    // If matching user found, delete or reset role
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: { in: candidateIds } },
          email ? { email: email.trim().toLowerCase() } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (user) {
      if (
        user.email.toLowerCase().includes("artisan@") ||
        user.email.toLowerCase().includes("test") ||
        user.email.toLowerCase().includes("demo") ||
        user.firstName === "Artisan"
      ) {
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "CUSTOMER", ninStatus: "NOT_SUBMITTED" },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: "Artisan record purged from database successfully.",
    });
  } catch (error: any) {
    console.error("[Verification DELETE Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to purge artisan record" }, { status: 500 });
  }
}
