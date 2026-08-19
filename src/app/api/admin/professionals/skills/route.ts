import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function getRequestingUser() {
  try {
    const cookieStore = await cookies();
    const userDataStr = cookieStore.get("handyhub_user_data")?.value;
    if (userDataStr) {
      return JSON.parse(userDataStr);
    }
  } catch (e) {
    console.warn("Failed to get requesting user from cookies:", e);
  }
  return null;
}

export async function PUT(request: Request) {
  try {
    const requester = await getRequestingUser();
    const requesterRole = requester?.role || "ADMIN";

    const body = await request.json();
    const { proId, userId, email, skills, primaryField } = body;

    if (!proId && !userId && !email) {
      return NextResponse.json(
        { error: "proId, userId, or email is required to identify the artisan." },
        { status: 400 }
      );
    }

    // Parse and normalize skills array
    let skillsArray: string[] = [];
    if (Array.isArray(skills)) {
      skillsArray = skills.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof skills === "string") {
      skillsArray = skills
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const resolvedPrimaryField = primaryField?.trim() || skillsArray[0] || "Skilled Services";
    if (skillsArray.length === 0) {
      skillsArray = [resolvedPrimaryField];
    } else if (!skillsArray.includes(resolvedPrimaryField)) {
      skillsArray.unshift(resolvedPrimaryField);
    }

    const candidateIds = [proId, userId].filter(Boolean) as string[];
    const allSearchIds = Array.from(
      new Set(candidateIds.flatMap((val) => [val, val.replace(/^pro_/, ""), `pro_${val}`]))
    );

    // 1. Find the Professional record
    let pro: any = await prisma.professional.findFirst({
      where: {
        OR: [
          { id: { in: allSearchIds } },
          { userId: { in: allSearchIds } },
          email ? { user: { email: email.toLowerCase().trim() } } : undefined,
        ].filter(Boolean) as any,
      },
      include: { user: true },
    });

    // 2. If not found, check User record
    let user: any = pro?.user || null;
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: { in: allSearchIds } },
            email ? { email: email.toLowerCase().trim() } : undefined,
          ].filter(Boolean) as any,
        },
        include: { professional: true },
      });
      if (user?.professional && !pro) {
        pro = user.professional;
      }
    }

    if (!pro && !user) {
      return NextResponse.json(
        { error: "Artisan / Professional record not found." },
        { status: 404 }
      );
    }

    // 3. Parse existing documents JSON to preserve metadata
    let docs: any = {};
    try {
      if (typeof pro?.documents === "string" && pro.documents.trim()) {
        let parsed = JSON.parse(pro.documents);
        if (typeof parsed === "string") parsed = JSON.parse(parsed);
        docs = parsed || {};
      } else if (pro?.documents && typeof pro.documents === "object") {
        docs = pro.documents;
      }
    } catch {}

    docs.serviceCategory = resolvedPrimaryField;
    docs.skills = skillsArray;

    // 4. Update / Upsert Professional table
    let updatedPro = null;
    if (pro) {
      updatedPro = await prisma.professional.update({
        where: { id: pro.id },
        data: {
          skills: JSON.stringify(skillsArray),
          documents: JSON.stringify(docs),
        },
      });
    } else if (user) {
      updatedPro = await prisma.professional.create({
        data: {
          userId: user.id,
          skills: JSON.stringify(skillsArray),
          documents: JSON.stringify(docs),
          verificationStatus: "VERIFIED",
          bio: `Verified Artisan in ${resolvedPrimaryField}`,
        },
      });
    }

    // 5. Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: requester?.id || "SYSTEM_ADMIN",
          action: "UPDATE_ARTISAN_SKILLS",
          entity: "Professional",
          entityId: updatedPro?.id || proId || "UNKNOWN",
          details: JSON.stringify({
            artisanName: user ? `${user.firstName} ${user.lastName}` : "Artisan",
            email: user?.email || email,
            primaryField: resolvedPrimaryField,
            skills: skillsArray,
          }),
        },
      });
    } catch {}

    // 6. In-App Notification to Artisan
    const targetUserId = user?.id || pro?.userId;
    if (targetUserId) {
      try {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            type: "SYSTEM",
            title: "Skill Specialization Updated 🛠️",
            message: `HandyHub administration has updated your verified trade skill specialization to: ${resolvedPrimaryField} (${skillsArray.join(", ")}).`,
          },
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: `Artisan trade field successfully updated to "${resolvedPrimaryField}" with ${skillsArray.length} skills.`,
      skills: skillsArray,
      primaryField: resolvedPrimaryField,
      proId: updatedPro?.id,
      userId: targetUserId,
    });
  } catch (error: any) {
    console.error("[Admin Update Skills Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update professional skills" },
      { status: 500 }
    );
  }
}
