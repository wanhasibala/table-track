import { NextResponse } from "next/server";
import { syncOrderToRtdb } from "@/utils/firebase-admin";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { orderId, status, paymentStatus } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Verify order exists
    const { data: order, error } = await supabase
      .from("order_table")
      .select("status")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Sync to Firebase Realtime Database
    const success = await syncOrderToRtdb(orderId, {
      status: status || order.status,
      paymentStatus: paymentStatus,
    });

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Failed to sync to Firebase Realtime Database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Synced successfully" });
  } catch (error: any) {
    console.error("Sync API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
