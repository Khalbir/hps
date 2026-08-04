import { NextResponse } from "next/server";

const FLW_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH || "handyhub_flw_secret_hash_mock";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("verif-hash");

    if (signature !== FLW_SECRET_HASH && process.env.NODE_ENV === "production") {
      console.error("[Flutterwave Webhook] Invalid Secret Hash Signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = await request.json();

    if (payload.status === "successful" || payload.event === "charge.completed") {
      console.log(`[Flutterwave Webhook] Successful payment for ref: ${payload.data?.tx_ref}`);
    }

    return NextResponse.json({ status: "success", received: true });
  } catch (error) {
    console.error("[Flutterwave Webhook Error]:", error);
    return NextResponse.json({ error: "Webhook process failed" }, { status: 500 });
  }
}
