import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
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

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Find existing professional record or create one
    let pro = await prisma.professional.findUnique({
      where: { userId },
    });

    const verificationPayload = {
      idType: idType || "NIN",
      idNumber: idNumber || "",
      idDocumentUrl: idDocumentUrl || "",
      selfieUrl: selfieUrl || "",
      tradeCertUrl: tradeCertUrl || "",
      portfolioUrls: portfolioUrls || [],
      guarantor1: guarantor1 || {},
      guarantor2: guarantor2 || {},
      quizScore: quizScore || 0,
      submittedAt: new Date().toISOString(),
      serviceCategory: serviceCategory || "General",
    };

    if (!pro) {
      pro = await prisma.professional.create({
        data: {
          userId,
          verificationStatus: "PENDING",
          documents: JSON.stringify(verificationPayload),
        },
      });
    } else {
      pro = await prisma.professional.update({
        where: { id: pro.id },
        data: {
          verificationStatus: "PENDING",
          documents: JSON.stringify(verificationPayload),
        },
      });
    }

    // Also update user notification
    await prisma.notification.create({
      data: {
        userId,
        type: "SYSTEM",
        title: "Verification Documents Submitted 📄",
        message: "Your government ID, trade credentials, guarantor details, and skill assessment have been received. Our team will review your application within 24 hours.",
      },
    });

    return NextResponse.json({
      message: "Verification submitted successfully",
      professional: pro,
    });
  } catch (error) {
    console.error("[Verification Submission Error]:", error);
    return NextResponse.json(
      { error: "Internal server error submitting verification" },
      { status: 500 }
    );
  }
}
