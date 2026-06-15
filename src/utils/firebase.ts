import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client-side safely
export const getFirebaseApp = () => {
  if (typeof window === "undefined") return null;
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
};

export const getFirebaseMessaging = async () => {
  if (typeof window === "undefined") return null;
  const supported = await isSupported();
  if (!supported) {
    console.warn("FCM is not supported in this browser context.");
    return null;
  }
  const app = getFirebaseApp();
  if (!app) return null;
  return getMessaging(app);
};

export const getFcmToken = async (): Promise<string | null> => {
  try {
    if (typeof window === "undefined") return null;
    
    // Check browser notification support
    if (!("Notification" in window)) {
      console.warn("Notifications not supported in this browser.");
      return null;
    }

    // Request permission if not already granted
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.warn("Notification permission was denied.");
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // Retrieve FCM registration token using VAPID key
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error("Error getting FCM Token:", error);
    return null;
  }
};
