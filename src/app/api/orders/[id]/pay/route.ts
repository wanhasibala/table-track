import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toDynamicQris, generateQrisQrCodeDataUrl } from "@/lib/qris";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch order with items and tenant
    const order = await prisma.order_table.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        tenant: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Check current order status
    if (order.status === "completed" || order.payment_status === "paid") {
      return NextResponse.json(
        { success: false, error: "Order has already been paid" },
        { status: 400 }
      );
    }

    if (order.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "Order has been cancelled" },
        { status: 400 }
      );
    }

    // ALWAYS recalculate total on server (never trust client amounts)
    const itemsTotal = order.items.reduce(
      (acc, item) => acc + item.unit_price * item.qty,
      0
    );
    const totalAmount = Math.round(itemsTotal + (order.delivery_fee || 0));

    if (totalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Total order amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get static QRIS from tenant (or environment fallback for development)
    const staticQris =
      order.tenant.static_qris ||
      process.env.DEV_STATIC_QRIS ||
      process.env.STATIC_QRIS;

    if (!staticQris) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Merchant does not have a static QRIS configured. Please contact the store.",
        },
        { status: 400 }
      );
    }

    // Generate dynamic QRIS string
    const dynamicQris = toDynamicQris(staticQris, totalAmount);

    // Generate Base64 QR code image
    const qrImageUrl = await generateQrisQrCodeDataUrl(dynamicQris);

    // Calculate expiration timestamp (tenant configurable, default 15 minutes)
    const expiryMinutes = order.tenant.qris_expiry_minutes || 15;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Atomically update order & create/update payment record in DB
    await prisma.$transaction(async (tx) => {
      // 1. Update order
      await tx.order_table.update({
        where: { id: orderId },
        data: {
          total_amount: totalAmount,
          status: "awaiting_payment",
          payment_status: "awaiting_payment",
          dynamic_qris: dynamicQris,
          expires_at: expiresAt,
        },
      });

      // 2. Create or update payment record
      const existingPayment = await tx.payment.findFirst({
        where: {
          order_id: orderId,
          status: "pending",
        },
      });

      if (existingPayment) {
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount: totalAmount,
            method: "qris",
          },
        });
      } else {
        await tx.payment.create({
          data: {
            order_id: orderId,
            tenant_id: order.tenant_id,
            amount: totalAmount,
            method: "qris",
            status: "pending",
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        merchantName: order.tenant.name,
        amount: totalAmount,
        dynamicQris,
        qrImageUrl,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating dynamic QRIS payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate dynamic QRIS payment",
      },
      { status: 500 }
    );
  }
}
