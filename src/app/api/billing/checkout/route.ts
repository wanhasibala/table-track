import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { tenantId, email } = await req.json();
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Verify user authentication session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";

    // 2. Mock upgrade fallback if Midtrans Server Key is not configured in .env
    if (!serverKey) {
      console.log("MIDTRANS_SERVER_KEY is missing. Processing mock upgrade to PRO for dev testing.");
      
      const { error: dbError } = await supabase
        .from("tenant")
        .update({
          subscription_tier: "pro",
          subscription_status: "active",
        })
        .eq("id", tenantId);

      if (dbError) {
        console.error("Mock upgrade database save error:", dbError);
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }

      return NextResponse.json({ url: "/d/billing?success=true" });
    }

    // 3. Live Midtrans Snap Checkout Session via REST API
    const snapUrl = isProd
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    // Build authorization header using Base64 encoded Server Key + ":"
    const authHeader = "Basic " + Buffer.from(serverKey + ":").toString("base64");

    const orderId = `SUB-TENANT-${tenantId}-${Date.now()}`;
    const amount = 290000; // Rp 290.000 (standard premium pricing)

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        email: email,
      },
      credit_card: {
        secure: true,
      },
    };

    const response = await fetch(snapUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Midtrans API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json({ url: data.redirect_url });

  } catch (err: any) {
    console.error("Midtrans checkout session failure:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
