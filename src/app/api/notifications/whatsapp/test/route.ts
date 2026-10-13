import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage, formatWhatsAppPhone } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { targetPhone, token, tenantName } = body;

    if (!targetPhone) {
      return NextResponse.json(
        { success: false, error: "Nomor WhatsApp tujuan wajib diisi" },
        { status: 400 }
      );
    }

    const formatted = formatWhatsAppPhone(targetPhone);
    const testMessage = [
      `🤖 *Tes Notifikasi WhatsApp Berhasil!*`,
      `=============================`,
      `Halo! Ini adalah pesan uji coba dari platform *${tenantName || "Table Track / Nata"}*.`,
      ``,
      `✅ Nomor WhatsApp Anda (*${formatted}*) telah terhubung untuk menerima notifikasi otomatis ketika ada pesanan baru masuk dari meja pelanggan.`,
      ``,
      `⏰ _Waktu Tes:_ ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`,
      `=============================`,
    ].join("\n");

    const result = await sendWhatsAppMessage({
      target: formatted,
      message: testMessage,
      token: token || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.error ||
            "Gagal mengirim pesan uji coba WhatsApp. Pastikan token Fonnte valid dan kuota mencukupi.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Pesan uji coba berhasil dikirim ke ${formatted}!`,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error sending test WhatsApp message:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send test message" },
      { status: 500 }
    );
  }
}
