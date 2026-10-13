import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

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

    // Optional cashier auth verification via Supabase session
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    // Or check request body for POS PIN / cashier user info if passed
    let cashierUserId = user?.id || null;
    let cashierName = user?.email || "Cashier";

    try {
      const body = await request.json().catch(() => ({}));
      if (body.cashierId) cashierUserId = body.cashierId;
      if (body.cashierName) cashierName = body.cashierName;
    } catch {
      // Body may be empty, proceed with available session
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order_table.findUnique({
        where: { id: orderId },
        include: { tenant: true },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      // Idempotency check: If already paid, return existing state safely
      if (order.payment_status === "paid" || order.status === "completed") {
        return {
          orderId,
          alreadyPaid: true,
          status: order.status,
          paymentStatus: "paid",
          message: "Order has already been confirmed as paid",
        };
      }

      if (order.status === "cancelled") {
        throw new Error("ORDER_CANCELLED");
      }

      const now = new Date();

      // Update order status
      const updatedOrder = await tx.order_table.update({
        where: { id: orderId },
        data: {
          status: "confirmed",
          payment_status: "paid",
          handled_by: cashierUserId,
        },
      });

      // Find and update pending payment or create new paid record
      const paymentRecord = await tx.payment.findFirst({
        where: { order_id: orderId },
        orderBy: { created_at: "desc" },
      });

      if (paymentRecord) {
        await tx.payment.update({
          where: { id: paymentRecord.id },
          data: {
            status: "paid",
            paid_at: now,
            confirmed_by: cashierUserId,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            order_id: orderId,
            tenant_id: order.tenant_id,
            amount: order.total_amount,
            method: "qris",
            status: "paid",
            paid_at: now,
            confirmed_by: cashierUserId,
          },
        });
      }

      return {
        orderId,
        alreadyPaid: false,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.payment_status,
        confirmedBy: cashierName,
        paidAt: now.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === "ORDER_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }
    if (error.message === "ORDER_CANCELLED") {
      return NextResponse.json(
        { success: false, error: "Cannot confirm a cancelled order" },
        { status: 400 }
      );
    }

    console.error("Error confirming order payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to confirm payment",
      },
      { status: 500 }
    );
  }
}
