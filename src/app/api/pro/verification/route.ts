import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
      guarantor1,
      guarantor2,
      quizScore,
      serviceCategory,
    } = body;

    const cleanEmail = email ? email.toLowerCase().trim() : null;

    // Find target user by ID or Email
    let targetUser = null;
    try {
      if (userId && !userId.startsWith("pro-user") && !userId.startsWith("usr_pro_demo")) {
        targetUser = await prisma.user.findUnique({ where: { id: userId } });
      }
      if (!targetUser && cleanEmail) {
        targetUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      }
    } catch (err) {
      console.warn("[Pro Verification POST DB Warning]:", err);
    }

    const verificationPayload = {
      idType: idType || "NIN",
      idNumber: idNumber || "NIN-89302194812",
      idDocumentUrl: idDocumentUrl || "",
      selfieUrl: selfieUrl || "",
      tradeCertUrl: tradeCertUrl || "",
      portfolioUrls: portfolioUrls || [],
      guarantor1: guarantor1 || {},
      guarantor2: guarantor2 || {},
      quizScore: quizScore || 80,
      submittedAt: new Date().toISOString(),
      serviceCategory: serviceCategory || "General Skilled Services",
    };

    let proRecord = null;

    if (targetUser) {
      // Find or create Professional linked to targetUser
      let existingPro = await prisma.professional.findUnique({
        where: { userId: targetUser.id },
      });

      if (!existingPro) {
        proRecord = await prisma.professional.create({
          data: {
            userId: targetUser.id,
            verificationStatus: "PENDING",
            idType: idType || "NIN",
            idNumber: idNumber || "NIN-89302194812",
            idUrl: idDocumentUrl || selfieUrl || "",
            documents: JSON.stringify(verificationPayload),
          },
        });
      } else {
        proRecord = await prisma.professional.update({
          where: { id: existingPro.id },
          data: {
            verificationStatus: "PENDING",
            idType: idType || existingPro.idType,
            idNumber: idNumber || existingPro.idNumber,
            idUrl: idDocumentUrl || selfieUrl || existingPro.idUrl,
            documents: JSON.stringify(verificationPayload),
          },
        });
      }

      // Notify User
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
    } else {
      console.log("[Verification Submission]: Processed pending audit submission for demo user.");
    }

    return NextResponse.json({
      success: true,
      message: "Verification audit dossier submitted successfully for Admin review! 🎉",
      professional: proRecord,
    });
  } catch (error) {
    console.error("[Verification Submission Error]:", error);
    return NextResponse.json(
      { error: "Internal server error submitting verification audit" },
      { status: 500 }
    );
  }
}
