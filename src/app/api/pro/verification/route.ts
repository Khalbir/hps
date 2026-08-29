import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { generateDigitalIdFromSeed } from "@/lib/digitalId";
import { stateStore } from "@/lib/states/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    let targetUser: any = null;
    if (userId && !userId.startsWith("pro-user")) {
      targetUser = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!targetUser && email) {
      targetUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    }
    if (!targetUser) {
      targetUser = await prisma.user.findFirst({ where: { role: "PROFESSIONAL" } });
    }

    if (!targetUser) {
      return NextResponse.json({ success: true, docs: {} });
    }

    const pro = await prisma.professional.findUnique({
      where: { userId: targetUser.id },
      include: {
        tradeVerifications: true,
      },
    });

    let docs: any = {};
    if (pro?.documents) {
      try {
        docs = typeof pro.documents === "string" ? JSON.parse(pro.documents) : pro.documents;
        if (typeof docs === "string") docs = JSON.parse(docs);
      } catch {}
    }

    const isVerified = pro?.verificationStatus === "VERIFIED" || targetUser.role === "SUPER_ADMIN" || targetUser.role === "ADMIN";
    const verificationStatus = isVerified ? "VERIFIED" : (pro?.verificationStatus || "UNVERIFIED");

    // Auto-seed primary trade if pro has no tradeVerifications yet
    let activeTrades: any[] = pro?.tradeVerifications || [];
    if (pro && activeTrades.length === 0) {
      let skills: string[] = [];
      try {
        if (pro.skills) skills = JSON.parse(pro.skills);
      } catch {}
      const primaryCat = (docs?.serviceCategory || skills[0] || "general").toLowerCase();
      try {
        const seeded = await prisma.tradeVerification.create({
          data: {
            professionalId: pro.id,
            tradeCategory: primaryCat,
            tradeName: primaryCat.charAt(0).toUpperCase() + primaryCat.slice(1),
            isPrimary: true,
            status: pro.verificationStatus === "VERIFIED" ? "VERIFIED" : pro.verificationStatus === "PENDING" ? "PENDING" : "NOT_SUBMITTED",
            yearsExperience: pro.yearsExperience || 2,
            certUrl: docs?.tradeCertUrl || null,
            portfolioUrls: JSON.stringify(docs?.portfolioUrls || []),
            toolsProofUrl: docs?.addressProofUrl || null,
            quizScore: docs?.quizScore !== undefined ? docs.quizScore : null,
            verifiedAt: pro.verificationStatus === "VERIFIED" ? new Date() : null,
          },
        });
        activeTrades = [seeded];
      } catch {}
    }

    return NextResponse.json({
      success: true,
      isVerified,
      verificationStatus,
      isLocked: isVerified,
      digitalId: pro?.digitalId || (isVerified ? "HHP-PRO-00001" : "HHP-PRO-UNASSIGNED"),
      user: {
        id: targetUser.id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        phone: targetUser.phone,
        permanentAddress: targetUser.permanentAddress,
        permanentAddressProof: targetUser.permanentAddressProof,
        ninNumber: targetUser.ninNumber,
      },
      pro: pro
        ? {
            id: pro.id,
            verificationStatus,
            idType: pro.idType,
            idNumber: pro.idNumber,
            idUrl: pro.idUrl,
            addressProofUrl: pro.addressProofUrl,
            skills: pro.skills,
            digitalId: pro.digitalId,
          }
        : null,
      tradeVerifications: activeTrades,
      docs,
    });
  } catch (error: any) {
    console.error("[Verification GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch verification draft" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      email,
      idType,
      idNumber,
      idDocumentUrl,
      selfieUrl,
      tradeCertUrl,
      portfolioUrls,
      operatingState,
      homeAddress,
      lga,
      addressProofUrl,
      guarantor1,
      guarantor2,
      quizScore,
      serviceCategory,
      secondaryCategory,
      isDraft,
      currentStep,
    } = body;

    // Strict Validation: When submitting for official audit (!isDraft), require ALL mandatory documents and information
    if (!isDraft) {
      const missingFields: string[] = [];
      const cleanNin = (idNumber || "").replace(/\D/g, "");
      if (!idNumber || (idType === "NIN" && cleanNin.length !== 11) || (idType !== "NIN" && (idNumber || "").trim().length < 4)) {
        missingFields.push(idType === "NIN" ? "Valid 11-digit NIN" : "Valid Government ID Number");
      }
      if (!idDocumentUrl || !idDocumentUrl.trim() || idDocumentUrl === "#") {
        missingFields.push("Government ID Document Upload");
      }
      if (!selfieUrl || !selfieUrl.trim() || selfieUrl === "#") {
        missingFields.push("Live Facial Verification Selfie");
      }
      if (!tradeCertUrl || !tradeCertUrl.trim() || tradeCertUrl === "#") {
        missingFields.push("Trade Competency Certificate Upload");
      }
      if (!addressProofUrl || !addressProofUrl.trim() || addressProofUrl === "#") {
        missingFields.push("Proof of Address Document Upload");
      }
      if (!Array.isArray(portfolioUrls) || portfolioUrls.filter((u: string) => Boolean(u) && u !== "#").length === 0) {
        missingFields.push("At least 1 Work Portfolio Photo");
      }
      if (!homeAddress || homeAddress.trim().length < 5) {
        missingFields.push("Residential / Workshop Street Address");
      }
      if (!operatingState || !operatingState.trim()) {
        missingFields.push("Operating State");
      } else {
        const isStateActive = await stateStore.isStateActive(operatingState);
        if (!isStateActive) {
          return NextResponse.json(
            {
              error: `Verification submissions in ${operatingState} are temporarily paused as this region is currently inactive. Please contact support or join the regional waitlist.`,
              stateInactive: true,
              stateName: operatingState,
            },
            { status: 400 }
          );
        }
      }

      const g1Phone = (guarantor1?.phone || "").replace(/\D/g, "");
      const g1Nin = (guarantor1?.nin || "").replace(/\D/g, "");
      if (!guarantor1?.name?.trim() || guarantor1.name.trim().length < 3 || g1Phone.length !== 11 || g1Nin.length !== 11) {
        missingFields.push("Guarantor 1 Details (Full Legal Name, 11-digit Phone, 11-digit NIN)");
      }

      const g2Phone = (guarantor2?.phone || "").replace(/\D/g, "");
      const g2Nin = (guarantor2?.nin || "").replace(/\D/g, "");
      if (!guarantor2?.name?.trim() || guarantor2.name.trim().length < 3 || g2Phone.length !== 11 || g2Nin.length !== 11) {
        missingFields.push("Guarantor 2 Details (Full Legal Name, 11-digit Phone, 11-digit NIN)");
      }

      if (g1Phone && g2Phone && (g1Phone === g2Phone || g1Nin === g2Nin)) {
        missingFields.push("Guarantor 1 and Guarantor 2 must be two distinct individuals with unique Phone Numbers and NINs");
      }

      if (quizScore === undefined || quizScore === null) {
        missingFields.push("Category Trade Competency Assessment (Quiz)");
      }

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: `Incomplete submission: Mandatory verification documents and required fields missing: ${missingFields.join(", ")}. Please upload and complete all items before submitting for compliance audit.`,
            missingFields,
          },
          { status: 400 }
        );
      }
    }

    const cleanEmail = email ? email.toLowerCase().trim() : "artisan@handyhubpro.ng";

    // Find target user by ID or Email
    let targetUser: any = null;
    try {
      if (userId && !userId.startsWith("pro-user")) {
        targetUser = await prisma.user.findUnique({ where: { id: userId } });
      }
      if (!targetUser && cleanEmail) {
        targetUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      }
    } catch (err) {
      console.warn("[Pro Verification POST DB Warning]:", err);
    }

    // Auto-create user if missing in PostgreSQL DB so submission is never lost
    if (!targetUser) {
      try {
        const tempHash = await hash("ProPass123!", 10);
        targetUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            firstName: "Artisan",
            lastName: "Partner",
            phone: "+2348030001122",
            password: tempHash,
            role: "PROFESSIONAL",
            isVerified: false,
          },
        });
      } catch {
        targetUser = await prisma.user.findFirst({ where: { role: "PROFESSIONAL" } });
      }
    }

    const verificationPayload = {
      idType: idType || "NIN",
      idNumber: idNumber || "",
      idDocumentUrl: idDocumentUrl || "",
      selfieUrl: selfieUrl || "",
      tradeCertUrl: tradeCertUrl || "",
      portfolioUrls: portfolioUrls || [],
      operatingState: operatingState || "FCT Abuja",
      homeAddress: homeAddress || "",
      lga: lga || "AMAC",
      addressProofUrl: addressProofUrl || "",
      guarantor1: guarantor1 || {},
      guarantor2: guarantor2 || {},
      quizScore: quizScore !== undefined ? quizScore : null,
      submittedAt: new Date().toISOString(),
      serviceCategory: serviceCategory || "General Skilled Services",
      secondaryCategory: secondaryCategory || "",
      city: operatingState || "FCT Abuja",
      isDraft: Boolean(isDraft),
      lastSavedStep: currentStep || 1,
    };

    const combinedSkillList = [serviceCategory, secondaryCategory].filter(Boolean);

    let proRecord = null;

    if (targetUser) {
      // 1. Upgrade User role to PROFESSIONAL & sync address/NIN fields
      await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          role: "PROFESSIONAL",
          permanentAddress: homeAddress || targetUser.permanentAddress,
          permanentAddressProof: addressProofUrl || targetUser.permanentAddressProof,
          permanentAddressStatus: isDraft ? targetUser.permanentAddressStatus || "PENDING" : "PENDING",
          ninNumber: idNumber || targetUser.ninNumber,
          ninStatus: isDraft ? targetUser.ninStatus || "PENDING" : "PENDING",
        },
      }).catch((uErr) => console.warn("[User Pro Role Update Warn]:", uErr));

      // 2. Find or create Professional linked to targetUser
      let existingPro = await prisma.professional.findUnique({
        where: { userId: targetUser.id },
      });

      const nextStatus = isDraft
        ? existingPro?.verificationStatus || "UNVERIFIED"
        : existingPro?.verificationStatus === "VERIFIED"
        ? "VERIFIED"
        : "PENDING";

      if (!existingPro) {
        proRecord = await prisma.professional.create({
          data: {
            userId: targetUser.id,
            digitalId: generateDigitalIdFromSeed(targetUser.id),
            verificationStatus: nextStatus,
            idType: idType || "NIN",
            idNumber: idNumber || "",
            idUrl: idDocumentUrl || selfieUrl || "",
            addressProofUrl: addressProofUrl || "",
            documents: JSON.stringify(verificationPayload),
            skills: JSON.stringify(combinedSkillList.length > 0 ? combinedSkillList : ["Skilled Services"]),
            bio: `${serviceCategory || "Skilled"}${secondaryCategory ? ` & ${secondaryCategory}` : ""} Artisan Partner based in ${operatingState || "FCT Abuja"}`,
          },
        });
      } else {
        let currentSkills: string[] = [];
        try {
          if (existingPro.skills) currentSkills = JSON.parse(existingPro.skills);
        } catch {}
        combinedSkillList.forEach((sk: string) => {
          if (sk && !currentSkills.includes(sk)) currentSkills.push(sk);
        });

        proRecord = await prisma.professional.update({
          where: { id: existingPro.id },
          data: {
            digitalId: existingPro.digitalId || generateDigitalIdFromSeed(existingPro.id),
            verificationStatus: nextStatus,
            idType: idType || existingPro.idType,
            idNumber: idNumber || existingPro.idNumber,
            idUrl: idDocumentUrl || selfieUrl || existingPro.idUrl,
            addressProofUrl: addressProofUrl || existingPro.addressProofUrl,
            documents: JSON.stringify(verificationPayload),
            skills: JSON.stringify(currentSkills.length > 0 ? currentSkills : [serviceCategory || "Skilled Services"]),
            bio: serviceCategory ? `Verified ${serviceCategory}${secondaryCategory ? ` & ${secondaryCategory}` : ""} artisan based in ${operatingState || "FCT Abuja"}` : existingPro.bio,
          },
        });
      }

      // 3. Upsert Granular TradeVerification Record for This Specific Profession
      const resolvedTrade = (serviceCategory || "general").toLowerCase().trim();
      const tradeName = resolvedTrade.charAt(0).toUpperCase() + resolvedTrade.slice(1);

      await prisma.tradeVerification.upsert({
        where: {
          professionalId_tradeCategory: {
            professionalId: proRecord.id,
            tradeCategory: resolvedTrade,
          },
        },
        create: {
          professionalId: proRecord.id,
          tradeCategory: resolvedTrade,
          tradeName,
          isPrimary: !existingPro,
          status: isDraft ? "NOT_SUBMITTED" : "PENDING",
          yearsExperience: 2,
          certUrl: tradeCertUrl || "",
          portfolioUrls: JSON.stringify(portfolioUrls || []),
          toolsProofUrl: addressProofUrl || idDocumentUrl || "",
          quizScore: quizScore !== undefined ? quizScore : null,
        },
        update: {
          tradeName,
          status: isDraft ? undefined : "PENDING",
          certUrl: tradeCertUrl || undefined,
          portfolioUrls: portfolioUrls ? JSON.stringify(portfolioUrls) : undefined,
          toolsProofUrl: addressProofUrl || idDocumentUrl || undefined,
          quizScore: quizScore !== undefined ? quizScore : undefined,
        },
      });

      if (!isDraft) {
        // 3. Record Audit Log for Admin Dashboard
        try {
          await prisma.auditLog.create({
            data: {
              userId: targetUser.id,
              action: "ARTISAN_VERIFICATION_SUBMITTED",
              entity: "Professional",
              entityId: proRecord.id,
              details: JSON.stringify({
                email: targetUser.email,
                name: `${targetUser.firstName} ${targetUser.lastName}`,
                idType: idType || "NIN",
                operatingState: operatingState || "FCT Abuja",
                notes: "Dossier uploaded and queued for admin review",
              }),
            },
          });
        } catch {}

        // 4. Notify User
        try {
          await prisma.notification.create({
            data: {
              userId: targetUser.id,
              type: "SYSTEM",
              title: "Verification Dossier Under Admin Review 📄",
              message: "Your 4-step verification audit (Govt ID, Selfie, Trade Certificate, Guarantors, Trade Quiz) is currently being reviewed by the compliance team.",
            },
          });
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      verificationStatus: isDraft ? "DRAFT_SAVED" : "PENDING",
      isDraft: Boolean(isDraft),
      message: isDraft
        ? "Verification progress auto-saved successfully! You can pick up where you left off at any time."
        : "Verification audit dossier submitted successfully for Admin review! 🎉",
      proRecord,
    });
  } catch (error: any) {
    console.error("[Verification POST Error]:", error);
    return NextResponse.json({ error: "Failed to submit verification audit" }, { status: 500 });
  }
}
