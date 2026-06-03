"use client";

import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/date";
import {
  Bell,
  ChevronDown,
  Moon,
  RefreshCcw,
  Sun,
  UserCircle,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTranslation } from "@/lib/use-translation";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { useLazyGetResourceQuery } from "@/store/services/flexible-querry";
import { useRouter } from "next/navigation";

interface User {
  username?: string;
  name?: string;
}

interface Role {
  name?: string;
}

interface Notification {
  id: string;
  title?: string;
  message?: string;
  description?: string;
  type?: string;
  read?: boolean;
  created_at?: string;
}

const Header = () => {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User>({});
  const [role, setRole] = useState<Role>({});
  const [mounted, setMounted] = useState(false);
  const [currentLocale, setCurrentLocale] = useState("en"); // Default value
  const { t } = useTranslation();
//   const [fetchData] = useLazyGetResourceQuery();
  // Notification states
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(
    null,
  );
  const router = useRouter();

  const days = [
    t("header.sunday"), // Fixed: Sunday should be index 0
    t("header.monday"),
    t("header.tuesday"),
    t("header.wednesday"),
    t("header.thursday"),
    t("header.friday"),
    t("header.saturday"),
  ];

  const date = new Date();
  const today = days[date.getDay()]; // Fixed: getDay() returns 0-6
  const today_date = formatDay(date, "DD-MM-YYYY");

  // Initialize after component mounts
  useEffect(() => {
    setMounted(true);

    // Get locale from cookie
    const getInitialLocale = () => {
      const cookieLocale = Cookies.get("NEXT_LOCALE");
      if (cookieLocale === "id" || cookieLocale === "en") return cookieLocale;
      return "en";
    };

    setCurrentLocale(getInitialLocale());

    // Get user data from localStorage
    try {
      const storedUser = localStorage.getItem("user");
      const storedRole = localStorage.getItem("role");

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedRole) setRole(JSON.parse(storedRole));
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, []);

  const handleLocaleChange = (value: string) => {
    Cookies.set("NEXT_LOCALE", value);
    window.location.reload();
  };
  const handleClearCache = async () => {
    try {
      const token = Cookies.get("token");
      const res = await fetch("https://eam-api.avolut.com/cache/all", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const response = await res.json();
      if (response?.message === "Berhasil menghapus semua cache") {
        window.location.reload();
      } else {
        console.error("Failed to clear cache:", response);
      }
    } catch (error) {
      console.error("Clear cache failed:", error);
    }
  };

  // Fetch notifications when popover opens
//   const fetchNotifications = async () => {
//     setNotificationLoading(true);
//     setNotificationError(null);
//     try {
//     //   const res = await fetchData({
//     //     resource: "/notifications",
//     //     params: {},
//     //   }).unwrap();

//     } catch (error) {
//       setNotificationError(
//         (error as Error).message || "Failed to load notifications",
//       );
//       setNotifications([]);
//     } finally {
//       setNotificationLoading(false);
//     }
//   };

  const handleNotificationOpenChange = (open: boolean) => {
    setNotificationOpen(open);
    if (open) {
    //   fetchNotifications();
    }
  };

  // Show loading state until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="border h-20 bg-sidebar w-full flex justify-between items-end px-4 md:px-8 py-2 md:py-4 flex-shrink-0">
        <div className="self-end text-sm">
          <p className="font-bold">Loading...</p>
          <p>Loading...</p>
        </div>
        <div className="flex gap-4 items-center">
          {/* Simplified loading state */}
          <div className="w-10 h-10 bg-muted rounded-md animate-pulse"></div>
          <div className="w-20 h-10 bg-muted rounded-md animate-pulse"></div>
          <div className="w-32 h-10 bg-muted rounded-md animate-pulse"></div>
          <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border h-20 bg-sidebar w-full flex justify-between items-center px-4 md:px-8 py-2 md:py-4 relative flex-shrink-0">
      {/* Sidebar Trigger */}

      {/* TODAY */}
      <div className="flex gap-2 items-center">
        {/* <div className="left-4">
          <SidebarTrigger />
        </div> */}
        <div>
          <p className="font-bold text-primary">{today}</p>
          <p className="text-sm">{today_date}</p>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <div className="flex items-center justify-center w-fit">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={cn(
              "p-2 rounded-md w-full flex justify-center hover:bg-muted mx-auto",
              theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/10",
            )}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </div>

        <Select value={currentLocale} onValueChange={handleLocaleChange}>
          <SelectTrigger className="w-fit rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">
              <div className="flex items-center gap-2">
                <Image
                  src={"/Flag_of_Indonesia.svg.png"}
                  width={20}
                  height={20}
                  alt="Indonesian Flag"
                />
                ID
              </div>
            </SelectItem>
            <SelectItem value="en">
              <div className="flex items-center gap-2">
                <Image
                  src={"/Flag_of_the_United_Kingdom_(3-5).svg.png"}
                  width={20}
                  height={20}
                  alt="UK Flag"
                />
                EN
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-all text-left outline-none group">
              {/* Avatar Placeholder */}
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-500 to-teal-200 flex items-center justify-center text-white font-medium shadow-sm">
                {user?.name?.charAt(0) || "G"}
              </div>

              <div className="flex flex-col">
                <h3 className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">
                  {user?.name || "Guest"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                  {role?.name || "User"}
                </p>
              </div>

              {/* Icon panah kecil penanda dropdown */}
              <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="w-56 p-2 shadow-xl border-muted/50"
            align="start"
          >
            <div className="px-2 py-1.5 mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                {t("header.account_actions")}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                onClick={() => {
                  // Implement logout logic here
                  router.push("/auth/change-password");
                }}
                className="justify-start font-normal hover:bg-primary/10 hover:text-primary h-9"
              >
                <LockKeyhole />
                {t("header.change_password")}
              </Button>
              <Button
                variant="ghost"
                className="justify-start font-normal hover:bg-primary/10 hover:text-primary h-9"
              >
                <UserCircle className="mr-2 h-4 w-4" />
                {t("header.change_role")}
              </Button>

              <Button
                variant="ghost"
                onClick={handleClearCache}
                className="justify-start font-normal text-destructive hover:bg-destructive/10 hover:text-destructive h-9"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t("header.clear_cache")}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-full">
          <Popover
            open={notificationOpen}
            onOpenChange={handleNotificationOpenChange}
          >
            <PopoverTrigger asChild>
              <Button className="rounded-full h-full aspect-square">
                <Bell />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 mr-4 p-0 shadow-xl border-muted/50">
              <div className="p-4">
                <p className="text-sm font-medium">Notification</p>
              </div>
              <div className="border-t">
                {notificationLoading ? (
                  <div className="p-4 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : notificationError ? (
                  <p className="text-sm text-destructive p-4">
                    {notificationError}
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">
                    No notifications
                  </p>
                ) : (
                  <ScrollArea className="h-80">
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <p className="text-sm font-medium">
                            {notification.title || notification.message}
                          </p>
                          {notification.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.description}
                            </p>
                          )}
                          {notification.created_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDay(
                                new Date(notification.created_at),
                                "DD-MM-YYYY HH:mm",
                              )}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default Header;
