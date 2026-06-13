"use client";

import {
  Building,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  LogOut,
  LucideIcon,
  SquareActivity,
  User,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLogoutMutation } from "@/store/services/authApi";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface MenuItem {
  label: string;
  url: string;
  icon?: LucideIcon | string;
  permissions?: string[];
  child?: MenuItem[];
  grandChild?: MenuItem[];
  requireAll?: boolean;
  isOpen?: boolean;
  count?: number;
}

// Default fallback menu shown on both server and initial client render
const DEFAULT_MENU: MenuItem[] = [
  {
    label: "Dashboard",
    url: "/d/dashboard",
    icon: SquareActivity,
  },
  { label: "Overview", url: "/d/overview" },
  { label: "Category", url: "/d/category" },
  { label: "Menu Management", url: "/d/menu-management" },
  { label: "Order Management", url: "/d/order-management" },
  { label: "Table Management", url: "/d/table-management" },
  { label: "Reports", url: "/d/reports" },
  { label: "Settings", url: "/d/settings" },
];

const SUPER_ADMIN_MENU: MenuItem[] = [
  { label: "dashboard", url: "/d/dashboard", icon: SquareActivity },
  { label: "menu", url: "/d/master_user/menu", icon: LayoutGrid },
  { label: "client", url: "/d/master_user/client", icon: Building },
  { label: "role", url: "/d/master_user/role", icon: Users },
  { label: "users", url: "/d/master_user/users", icon: User },
  { label: "reset_password", url: "/d/master_user/reset-password", icon: User },
];

export function useSidebarItems(): MenuItem[] {
  const [items, setItems] = useState<MenuItem[]>(DEFAULT_MENU);

  return items;
}

export default function AppSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const items = useSidebarItems();
  const [logout] = useLogoutMutation();
  const { theme, setTheme } = useTheme();

  // Prevent rendering sidebar content until client has mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    try {
      const response = await supabase.auth.signOut();
      if (response.error) {
        console.error("Logout failed:", response.error);
        return;
      }
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="dark:bg-gray-900 relative max-h-[100vh] "
    >
      {/* <SidebarTrigger
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "flex items-center absolute top-[50%] -right-4 z-[99] border rounded-full bg-background p-1 transition-transform w-fit ",
          isCollapsed ? "justify-center" : "justify-end",
        )}
      /> */}
      <SidebarContent>
        <SidebarGroup className="flex flex-col w-full gap-0 items-center ">
          <SidebarGroupContent>
            <SidebarMenu className="p-2">
              {/* Only render menu items after client mount to avoid hydration mismatch */}
              {isMounted &&
                items.map((item) => (
                  <SidebarTreeItem
                    key={`${item.url}_${item.label}`}
                    item={item}
                    pathname={pathname}
                    isSidebarCollapsed={isCollapsed}
                  />
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout button at bottom */}
        <SidebarGroup className="mt-auto pb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                className="[&>div]:!size-5  flex-1 flex items-center gap-3 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
              >
                <LogOut className="size-5" />
                {!isCollapsed && <span className="text-large">Logout</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function SidebarTreeItem({
  item,
  pathname,
  isSidebarCollapsed,
  onClick,
}: {
  item: MenuItem;
  pathname: string;
  isSidebarCollapsed: boolean;
  onClick?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(item.isOpen || false);
  const [openChildren, setOpenChildren] = useState<Set<string>>(new Set());
  const hasChildren = item.child && item.child.length > 0;

  useEffect(() => {
    if (isSidebarCollapsed) {
      setIsOpen(false);
      setOpenChildren(new Set());
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (hasChildren) {
      const matchedChild = item.child?.find(
        (child) =>
          pathname.startsWith(child.url) ||
          child.grandChild?.some((gc) => pathname.startsWith(gc.url)),
      );

      if (matchedChild) {
        setIsOpen(true);
        if (matchedChild.grandChild?.length) {
          setOpenChildren(new Set([matchedChild.label]));
        }
      }
    }
  }, [pathname, hasChildren, item.child]);

  // const renderIcon = () => {
  //   if (!item.icon) return null;

  //   if (typeof item.icon === "string") {
  //     const IconComponent = icons[item.icon];
  //     if (IconComponent) {
  //       return <IconComponent className="size-5" />;
  //     }
  //   } else {
  //     const IconComponent = item.icon;
  //     return <IconComponent className="size-5" />;
  //   }
  // };

  const handleItemClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
    onClick?.();
  };

  const handleChildClick = (childLabel: string, e: React.MouseEvent) => {
    const child = item.child?.find((c) => c.label === childLabel);
    if (child?.grandChild && child.grandChild.length > 0) {
      e.preventDefault();
      setOpenChildren((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(childLabel)) {
          newSet.delete(childLabel);
        } else {
          newSet.add(childLabel);
        }
        return newSet;
      });
    }
  };

  const isActive = (() => {
    if (pathname.startsWith(item.url) && item.url !== "#") return true;
    return (
      item.child?.some(
        (child) =>
          (pathname.startsWith(child.url) && child.url !== "#") ||
          child.grandChild?.some(
            (gc) => pathname.startsWith(gc.url) && gc.url !== "#",
          ),
      ) ?? false
    );
  })();

  const parentGroup = [
    "asset_operation",
    "maintenance_operation",
    "reports_operation",
  ].includes(item.label);

  return (
    <SidebarMenuItem
      key={item.url}
      className={cn(parentGroup && "mt-4 border-b")}
    >
      <div className="flex flex-col">
        <div className="flex items-center">
          <SidebarMenuButton
            asChild={!hasChildren}
            isActive={isActive}
            onClick={handleItemClick}
            className={cn(
              "rounded-sm transition-colors hover:bg-orange-400/10 hover:text-accent-foreground ",
            )}
          >
            {hasChildren ? (
              <div className="relative flex flex-1 items-center justify-center gap-3 text-left w-full">
                {/* {renderIcon()} */}
                {!isSidebarCollapsed && (
                  <>
                    <span className="text-large flex-1">{item.label}</span>
                    {item.count && item.count > 0 && (
                      <div className="flex h-5 w-5 min-w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                        {item.count}
                      </div>
                    )}
                    <span className="ml-auto transition-transform duration-200">
                      {isOpen ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <Link
                href={item.url}
                className="relative flex flex-1 items-center gap-3"
                onClick={onClick}
              >
                {/* {renderIcon()} */}
                {!isSidebarCollapsed && (
                  <>
                    <span className="text-large flex-1">{item.label}</span>
                    {item.count && item.count > 0 && (
                      <div className="flex h-5 w-5 min-w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                        {item.count}
                      </div>
                    )}
                  </>
                )}
              </Link>
            )}
          </SidebarMenuButton>
        </div>

        {hasChildren && isOpen && !isSidebarCollapsed && (
          <div className="mt-1 space-y-1 pl-8">
            {item.child?.map((childItem) => {
              const hasGrandChildren =
                childItem.grandChild && childItem.grandChild.length > 0;
              const isChildOpen = openChildren.has(childItem.label);
              const isChildActive =
                pathname.startsWith(childItem.url) && childItem.url !== "#";

              return (
                <div key={`${childItem.url}_${childItem.label}`}>
                  <SidebarMenuButton
                    asChild={!hasGrandChildren}
                    isActive={isChildActive}
                    onClick={(e) => handleChildClick(childItem.label, e)}
                    className="rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground "
                  >
                    {hasGrandChildren ? (
                      <div className="relative flex flex-1 items-center gap-3 text-left w-full">
                        <span className="text-large flex-1">
                          {childItem.label}
                        </span>
                        {childItem.count && childItem.count > 0 && (
                          <div className="flex h-5 w-5 min-w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                            {childItem.count}
                          </div>
                        )}
                        <span className="ml-auto transition-transform duration-200">
                          {isChildOpen ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={childItem.url}
                        className="flex items-center gap-3"
                      >
                        <span className="text-large flex-1">
                          {childItem.label}
                        </span>
                        {childItem.count && childItem.count > 0 && (
                          <div className="flex h-5 w-5 min-w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                            {childItem.count}
                          </div>
                        )}
                      </Link>
                    )}
                  </SidebarMenuButton>

                  {hasGrandChildren && isChildOpen && (
                    <div className="mt-1 space-y-1 pl-8">
                      {childItem.grandChild?.map((grandChildItem) => (
                        <SidebarMenuButton
                          key={`${grandChildItem.url}_${grandChildItem.label}`}
                          asChild
                          isActive={
                            pathname.startsWith(grandChildItem.url) &&
                            grandChildItem.url !== "#"
                          }
                          className="rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground "
                        >
                          <Link
                            href={grandChildItem.url}
                            className="flex items-center gap-3"
                          >
                            <span className="text-large flex-1">
                              {grandChildItem.label}
                            </span>
                            {grandChildItem.count &&
                              grandChildItem.count > 0 && (
                                <div className="flex h-5 w-5 min-w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                                  {grandChildItem.count}
                                </div>
                              )}
                          </Link>
                        </SidebarMenuButton>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SidebarMenuItem>
  );
}
