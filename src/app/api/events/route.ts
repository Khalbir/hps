import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const customStream = new ReadableStream({
    start(controller) {
      // Send initial connection payload
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ event: "CONNECTED", timestamp: new Date().toISOString() })}\n\n`)
      );

      // Keepalive heartbeat every 15 seconds
      const timer = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ event: "HEARTBEAT", timestamp: new Date().toISOString() })}\n\n`)
          );
        } catch {
          clearInterval(timer);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(timer);
        controller.close();
      });
    },
  });

  return new NextResponse(customStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
