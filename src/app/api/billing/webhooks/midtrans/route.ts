import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { order_id, transaction_status, status_code, gross_amount, signature_key } = payload;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serverKey || !supabaseUrl || !serviceRoleKey) {
      console.error("Webhook credentials missing. Webhook notification ignored.");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // 1. Verify Midtrans SHA-512 Signature Key
    const dataString = order_id + status_code + gross_amount + serverKey;
    const computedSignature = createHash("sha512").update(dataString).digest("hex");

    if (computedSignature !== signature_key) {
      console.error("Invalid Midtrans signature key verified.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 2. Parse tenantId from order_id (format: SUB-TENANT-[UUID]-[TIMESTAMP])
    const parts = order_id.split("-");
    const tenantId = parts.slice(2, 7).join("-");
    console.log(`Parsed tenantId ${tenantId} from order_id ${order_id}`);

    // Initialize Supabase Admin client to bypass RLS for background updates
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 3. Process Status Updates
    const isSuccess =
      transaction_status === "settlement" ||
      (transaction_status === "capture" && payload.fraud_status === "accept");

    if (isSuccess) {
      const { error } = await supabaseAdmin
        .from("tenant")
        .update({
          subscription_tier: "pro",
          subscription_status: "active",
          payment_customer_id: payload.payment_type || "midtrans",
          payment_subscription_id: order_id,
        })
        .eq("id", tenantId);

      if (error) {
        console.error("Failed to upgrade tenant on Midtrans settlement:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      console.log(`Successfully upgraded tenant ${tenantId} to Pro.`);
    } 
    else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      const { error } = await supabaseAdmin
        .from("tenant")
        .update({
          subscription_tier: "free",
          subscription_status: transaction_status,
        })
        .eq("id", tenantId);

      if (error) {
        console.error("Failed to downgrade tenant on Midtrans cancel/deny/expire:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      console.log(`Successfully downgraded tenant ${tenantId} to Free (status: ${transaction_status}).`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Midtrans webhook processing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
