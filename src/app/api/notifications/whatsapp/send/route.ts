import { NextRequest, NextResponse } from "next/server";
import { sendNewOrderWhatsAppNotification } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    // Trigger WhatsApp notification asynchronously
    const result = await sendNewOrderWhatsAppNotification(orderId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Error sending WhatsApp order notification:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
