import { NextResponse } from "next/server";

export async function GET() {
  const clean = (val: string) => val.replace(/^["']|["']$/g, "").trim();

  const apiKey = clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "");
  const authDomain = clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "");
  const projectId = clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "");
  const storageBucket = clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "");
  const messagingSenderId = clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "");
  const appId = clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "");

  const script = `
    importScripts('https://www.gstatic.com/firebasejs/9.24.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/9.24.0/firebase-messaging-compat.js');

    firebase.initializeApp({
      apiKey: "${apiKey}",
      authDomain: "${authDomain}",
      projectId: "${projectId}",
      storageBucket: "${storageBucket}",
      messagingSenderId: "${messagingSenderId}",
      appId: "${appId}"
    });

    if (firebase.messaging.isSupported()) {
      const messaging = firebase.messaging();

      messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        const notificationTitle = payload.notification?.title || 'TableTrack Update';
        const notificationOptions = {
          body: payload.notification?.body || 'Your order status has changed.',
          icon: '/icon.svg',
          data: payload.data
        };
        self.registration.showNotification(notificationTitle, notificationOptions);
      });
    } else {
      console.warn("Firebase Messaging is not supported in this service worker context.");
    }
  `;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
