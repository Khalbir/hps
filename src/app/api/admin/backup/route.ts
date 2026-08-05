import { NextResponse } from "next/server";
import { generateDatabaseSnapshot } from "@/lib/backup";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId") || "SUPER_ADMIN";

    const snapshot = await generateDatabaseSnapshot(adminId);

    return new NextResponse(JSON.stringify(snapshot, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="handyhub_db_backup_${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("[Database Backup Export Error]:", error);
    return NextResponse.json({ error: "Failed to generate database backup" }, { status: 500 });
  }
}
