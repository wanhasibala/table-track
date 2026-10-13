import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
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

    const order = await prisma.order_table.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        tenant: {
          select: {
            name: true,
            slug: true,
            logo_url: true,
          },
        },
        payments: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Auto check expiration if awaiting payment and past expires_at
    const now = new Date();
    let isExpired = false;
    let paymentStatus = order.payment_status;
    let orderStatus = order.status;

    if (
      paymentStatus === "awaiting_payment" &&
      order.expires_at &&
      now > new Date(order.expires_at)
    ) {
      isExpired = true;
      paymentStatus = "expired";
      orderStatus = "expired";

      // Mark as expired in DB
      await prisma.order_table.update({
        where: { id: orderId },
        data: {
          status: "expired",
          payment_status: "expired",
        },
      });
    }

    const latestPayment = order.payments[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        merchantName: order.tenant.name,
        tableName: order.table?.name || null,
        status: orderStatus,
        paymentStatus,
        totalAmount: order.total_amount,
        expiresAt: order.expires_at ? order.expires_at.toISOString() : null,
        isExpired,
        paidAt: latestPayment?.paid_at ? latestPayment.paid_at.toISOString() : null,
      },
    });
  } catch (error: any) {
    console.error("Error checking order status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve order status",
      },
      { status: 500 }
    );
  }
}
