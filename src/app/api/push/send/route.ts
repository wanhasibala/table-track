import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

import fs from "fs";
import path from "path";

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

const initFirebaseAdmin = () => {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  // 1. Try to load config from the local JSON file
  try {
    const jsonPath = path.join(process.cwd(), "tabletrack-b8155-5316df108b91.json");
    if (fs.existsSync(jsonPath)) {
      const credentials = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      return initializeApp({
        credential: cert(credentials),
      });
    }
  } catch (err) {
    console.error("Failed to load Firebase credentials from JSON file:", err);
  }

  // 2. Fallback to env variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (e) {
      console.error("Failed to initialize Firebase Admin from env:", e);
    }
  }

  console.warn("Firebase Admin SDK credentials missing. Push notifications will be printed to console.");
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
