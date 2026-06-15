import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import fs from "fs";
import path from "path";

export const initFirebaseAdmin = () => {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  // 1. Try to load config from the local JSON file
  let credentials: any = null;
  try {
    const jsonPath = path.join(process.cwd(), "tabletrack-b8155-5316df108b91.json");
    if (fs.existsSync(jsonPath)) {
      credentials = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    }
  } catch (err) {
    console.error("Failed to load Firebase credentials from JSON file:", err);
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || credentials?.project_id;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || credentials?.client_email;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || credentials?.private_key)?.replace(/\\n/g, "\n");
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`;

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL,
      });
    } catch (e) {
      console.error("Failed to initialize Firebase Admin:", e);
    }
  }

  console.warn("Firebase Admin SDK credentials missing.");
  return null;
};

export const syncOrderToRtdb = async (
  orderId: string,
  updateData: { status?: string; paymentStatus?: string; amount?: number }
) => {
  try {
    const adminApp = initFirebaseAdmin();
    if (!adminApp) return false;

    const db = getDatabase(adminApp);
    const orderRef = db.ref(`orders/${orderId}`);

    // Filter out undefined values to avoid Firebase Admin SDK throwing an error
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );

    await orderRef.update({
      ...cleanData,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("Failed to sync order to RTDB:", err);
    return false;
  }
};
