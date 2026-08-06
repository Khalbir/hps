import { NextResponse } from "next/server";
import { sendConfirmationEmail } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "khaleid.kabir@gmail.com";

    const testCode = Math.floor(100000 + Math.random() * 900000).toString();

    const envCheck = {
      SMTP_HOST: process.env.SMTP_HOST || "not set (default: smtp.gmail.com)",
      SMTP_PORT: process.env.SMTP_PORT || "not set (default: 465)",
      SMTP_USER: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***@***` : "NOT SET ❌",
      SMTP_PASS_SET: Boolean(process.env.SMTP_PASS),
      RESEND_API_KEY_SET: Boolean(process.env.RESEND_API_KEY),
    };

    const result = await sendConfirmationEmail({
      email,
      name: "Test User",
      role: "CUSTOMER",
      token: testCode,
    });

    return NextResponse.json({
      success: result.success,
      targetEmail: email,
      testCode,
      envCheck,
      result,
      instruction: !envCheck.SMTP_PASS_SET && !envCheck.RESEND_API_KEY_SET
        ? "SMTP_PASS or RESEND_API_KEY is not set in .env. Add your Gmail App Password to SMTP_PASS in .env to deliver real emails to inbox."
        : "Email request processed. If delivery failed, check Gmail App Password settings.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
