import { useEffect, useState } from "react";
import { getFcmToken } from "@/utils/firebase";
import { toast } from "sonner";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  const registerToken = async (ids: { orderId?: string; userId?: string }) => {
    if (permission === "unsupported" || typeof window === "undefined") return null;

    setLoading(true);
    try {
      const fcmToken = await getFcmToken();
      if (fcmToken) {
        setToken(fcmToken);
        setPermission(Notification.permission);

        // Send token to our register API
        const response = await fetch("/api/push/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: fcmToken,
            orderId: ids.orderId,
            userId: ids.userId,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to register push token");
        }
        console.log("Push token registered successfully:", fcmToken);
        toast.success("Order alerts enabled successfully! 🔔");
        return fcmToken;
      } else {
        const isBrave = (navigator as any).brave !== undefined;
        if (isBrave) {
          toast.error(
            "Push alerts failed. On Brave, please go to brave://settings/privacy and enable 'Use Google services for push messaging', then refresh.",
            { duration: 8000 }
          );
        } else {
          toast.error("Could not enable push alerts. Please verify browser notification permissions.");
        }
      }
    } catch (error: any) {
      console.error("Failed to register for push notifications:", error);
      toast.error(`Push alert setup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
    return null;
  };

  return {
    permission,
    token,
    loading,
    registerToken,
  };
}
