import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { initFirebaseAdmin } from "@/utils/firebase-admin";
import { getMessaging } from "firebase-admin/messaging";

const getAdminSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    return createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }
  return null;
};

export async function POST(request: Request) {
  try {
    const { orderId, title, body, data } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId is required" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();
    if (!supabase) {
      console.warn("Supabase Admin key not configured, cannot fetch push tokens.");
      return NextResponse.json({ success: true, message: "Mocked (No Supabase Admin client)" });
    }

    // 1. Fetch all FCM tokens registered for this order
    const { data: tokenRecords, error: dbError } = await supabase
      .from("order_push_token")
      .select("token")
      .eq("order_id", orderId);

    if (dbError) {
      console.error("Failed to query order push tokens:", dbError);
      return NextResponse.json(
        { success: false, message: dbError.message },
        { status: 500 }
      );
    }

    const tokens = tokenRecords?.map((r: any) => r.token) || [];
    if (tokens.length === 0) {
      return NextResponse.json({ success: true, message: "No tokens registered for this order" });
    }

    // 2. Initialize Firebase Admin SDK
    const adminApp = initFirebaseAdmin();

    if (!adminApp) {
      console.log(`[PUSH NOTIFICATION MOCK] Send to order ${orderId}: "${title}" - "${body}"`);
      return NextResponse.json({
        success: true,
        message: `Push notification printed to server console (Credentials not set). Tokens: ${tokens.length}`,
      });
    }

    // 3. Send multicast message via FCM
    const message = {
      notification: { title, body },
      data: data || {},
      tokens: tokens,
    };

    const response = await getMessaging(adminApp).sendEachForMulticast(message);
    
    // Clean up failed/expired tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            failedTokens.push(tokens[idx]);
          }
        }
      });

      if (failedTokens.length > 0) {
        await supabase
          .from("order_push_token")
          .delete()
          .in("token", failedTokens);
        console.log(`Cleaned up ${failedTokens.length} expired FCM tokens.`);
      }
    }

    return NextResponse.json({
      success: true,
      sentCount: response.successCount,
      failedCount: response.failureCount,
    });
  } catch (error: any) {
    console.error("Push dispatch error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
