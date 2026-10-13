import { prisma } from "@/lib/db";

/**
 * Normalizes phone numbers to international standard format (628xxx for Indonesia).
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return "";
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.substring(1);
  } else if (clean.startsWith("8")) {
    clean = "62" + clean;
  }
  return clean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Sends a WhatsApp message via Fonnte or HTTP WA Gateway.
 */
export async function sendWhatsAppMessage({
  target,
  message,
  token,
}: {
  target: string;
  message: string;
  token?: string;
}): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const formattedPhone = formatWhatsAppPhone(target);
    if (!formattedPhone) {
      return { success: false, error: "Invalid target WhatsApp phone number" };
    }

    const waToken =
      token ||
      process.env.FONNTE_TOKEN ||
      process.env.WA_GATEWAY_TOKEN ||
      process.env.WHATSAPP_TOKEN;

    if (!waToken) {
      console.warn(
        "WhatsApp Notification: No Fonnte / WhatsApp token configured in tenant or environment variables."
      );
      return {
        success: false,
        error: "WhatsApp gateway token is not configured.",
      };
    }

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: waToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message,
        countryCode: "62",
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || (result && result.status === false)) {
      const rawReason = (result?.reason || result?.message || `HTTP error ${response.status}`).toLowerCase();
      let friendlyError = result?.reason || result?.message || `HTTP error ${response.status}`;

      if (rawReason.includes("unknown token") || rawReason.includes("token invalid")) {
        friendlyError = "Token Fonnte tidak valid atau belum terdaftar ('unknown token'). Pastikan token disalin dari dashboard fonnte.com > Device.";
      } else if (rawReason.includes("device disconnected") || rawReason.includes("not connected")) {
        friendlyError = "Perangkat WhatsApp di Fonnte sedang terputus (Disconnected). Silakan hubungkan / scan QR kembali di fonnte.com.";
      } else if (rawReason.includes("quota") || rawReason.includes("insufficient")) {
        friendlyError = "Kuota pengiriman pesan di akun Fonnte telah habis.";
      } else if (rawReason.includes("invalid target") || rawReason.includes("invalid number")) {
        friendlyError = "Nomor tujuan tidak terdaftar di WhatsApp atau format tidak valid.";
      }

      console.error("Fonnte WA API error:", friendlyError, result);
      return { success: false, error: friendlyError, data: result };
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Failed to send WhatsApp message:", error);
    return { success: false, error: error.message || "Failed to send WhatsApp message" };
  }
}

/**
 * Builds and dispatches a New Order WhatsApp notification to the tenant owner.
 */
export async function sendNewOrderWhatsAppNotification(
  orderId: string
): Promise<{ sent: boolean; reason?: string }> {
  try {
    const order = await prisma.order_table.findUnique({
      where: { id: orderId },
      include: {
        tenant: true,
        table: true,
        items: true,
      },
    });

    if (!order) {
      return { sent: false, reason: "Order not found" };
    }

    const tenant = order.tenant;
    if (!tenant) {
      return { sent: false, reason: "Tenant not found" };
    }

    // Check if owner phone is set
    const ownerPhone = tenant.owner_whatsapp;
    if (!ownerPhone) {
      return { sent: false, reason: "Tenant owner WhatsApp number is not configured" };
    }

    // Check if new order notification is enabled
    if (tenant.wa_notify_new_order === false) {
      return { sent: false, reason: "WhatsApp notifications for new orders are disabled by tenant" };
    }

    // Format item lines
    const itemLines = order.items.map((item, idx) => {
      const notes = item.notes ? `\n   _Catatan: ${item.notes}_` : "";
      return `${idx + 1}. *${item.qty}x* Item (${formatCurrency(item.unit_price * item.qty)})${notes}`;
    });

    const tableName = order.table?.name || "Non-Meja";
    const customerInfo = order.customer_name
      ? `${order.customer_name}${order.customer_phone ? ` (${order.customer_phone})` : ""}`
      : "Tamu / Pelanggan";

    const formattedDate = new Date(order.created_at).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://nata.app";
    const posUrl = `${origin}/pos/${tenant.slug}`;

    const message = [
      `🔔 *PESANAN BARU MASUK!*`,
      `=============================`,
      `🏪 *Restoran:* ${tenant.name}`,
      `🧾 *No. Pesanan:* #TT-${order.order_number}`,
      `🪑 *Meja / Lokasi:* ${tableName}`,
      `👤 *Pelanggan:* ${customerInfo}`,
      `📦 *Tipe Pesanan:* ${order.type.replace("_", " ").toUpperCase()}`,
      ``,
      `📋 *Rincian Pesanan:*`,
      itemLines.length > 0 ? itemLines.join("\n") : "- (Tidak ada rincian item)",
      ``,
      order.delivery_fee ? `🚚 *Ongkir:* ${formatCurrency(order.delivery_fee)}` : null,
      `💰 *Total Tagihan:* *${formatCurrency(order.total_amount)}*`,
      `⏰ *Waktu:* ${formattedDate} WIB`,
      `=============================`,
      `👉 _Buka Terminal POS Kasir:_ ${posUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    const result = await sendWhatsAppMessage({
      target: ownerPhone,
      message,
      token: tenant.wa_gateway_token || undefined,
    });

    if (result.success) {
      console.log(`WhatsApp notification for order #${order.order_number} sent to ${ownerPhone}`);
      return { sent: true };
    } else {
      console.warn(`WhatsApp notification failed for order #${order.order_number}: ${result.error}`);
      return { sent: false, reason: result.error };
    }
  } catch (error: any) {
    console.error("Error in sendNewOrderWhatsAppNotification:", error);
    return { sent: false, reason: error.message };
  }
}
