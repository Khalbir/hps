import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMultiChannelNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    // 1. Create a system notification record in DB so it shows in the Admin Dashboard Inbox
    const adminNotification = await prisma.notification.create({
      data: {
        userId: "SUPER_ADMIN",
        type: "SYSTEM",
        title: `📩 Inquiry from ${name}`,
        message: `Client Message: ${message}`,
        data: JSON.stringify({
          senderName: name,
          senderEmail: email,
          senderPhone: phone || "Not Provided",
          subject: subject || "Website Inquiry",
          submittedAt: new Date().toISOString(),
        }),
      },
    });

    // 2. Dispatch email notification to support/admin emails
    const recipientAdminEmails = ["info@handyhubpro.ng", "khaleid.kabir@gmail.com"];
    
    for (const adminEmail of recipientAdminEmails) {
      await sendMultiChannelNotification({
        userId: "ADMIN",
        recipientEmail: adminEmail,
        recipientName: "HandyHub Support Officer",
        type: "SYSTEM",
        title: `📩 New Client Inquiry: ${name}`,
        message: `You received a new client inquiry message on HandyHub Pro website:\n\nClient Name: ${name}\nEmail: ${email}\nPhone: ${phone || "Not Provided"}\nMessage:\n"${message}"`,
        metadata: {
          "Sender Name": name,
          "Sender Email": email,
          "Phone Number": phone || "Not Provided",
          "Subject": subject || "Website Inquiry",
        },
        channels: ["EMAIL"],
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully to HandyHub Pro support and dispatches!",
      id: adminNotification.id,
    });
  } catch (error: any) {
    console.error("[Contact API Error]:", error);
    return NextResponse.json({ error: "Failed to submit contact message", details: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const inquiries = await prisma.notification.findMany({
      where: {
        type: "SYSTEM",
        title: { startsWith: "📩 Inquiry" },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = inquiries.map((item) => {
      let meta: any = {};
      try {
        if (item.data) meta = JSON.parse(item.data);
      } catch {}

      return {
        id: item.id,
        title: item.title,
        message: item.message,
        senderName: meta.senderName || item.title.replace("📩 Inquiry from ", ""),
        senderEmail: meta.senderEmail || "Customer Email",
        senderPhone: meta.senderPhone || "Not Provided",
        subject: meta.subject || "Website Inquiry",
        createdAt: item.createdAt,
      };
    });

    return NextResponse.json({ success: true, inquiries: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}
