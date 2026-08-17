import { POST as paystackWebhookPOST } from "./paystack/route";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return paystackWebhookPOST(request);
}
