import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClientHelper } from "@/utils/supabase/server";

const getSupabaseClient = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    return createSupabaseClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }
  const cookieStore = await cookies();
  return createServerClientHelper(cookieStore);
};

export async function POST(request: Request) {
  try {
    const { token, orderId, userId } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "FCM token is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();

    if (orderId) {
      // Register token for the customer order
      const { error } = await supabase
        .from("order_push_token")
        .upsert(
          { order_id: orderId, token },
          { onConflict: "token" }
        );

      if (error) {
        console.error("Error saving order push token:", error);
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 500 }
        );
      }
    } else if (userId) {
      // Register token for the admin/seller user account
      const { error } = await supabase
        .from("user_push_token")
        .upsert(
          { user_id: userId, token },
          { onConflict: "token" }
        );

      if (error) {
        console.error("Error saving user push token:", error);
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Either orderId or userId must be provided" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Token registered successfully" });
  } catch (error: any) {
    console.error("Push registration error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
