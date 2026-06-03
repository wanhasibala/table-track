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
import Image from "next/image";
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
  },
  { label: "Overview", url: "/d/overview" },
  { label: "Menu Management", url: "/d/menu-management" },
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
  // Start with the default menu to match SSR output
  const [items, setItems] = useState<MenuItem[]>(DEFAULT_MENU);

  return items;
}

export default function AppSidebar() {
  const pathname = usePathname();
  // Use undefined as initial state to avoid SSR/client mismatch
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const items = useSidebarItems();
  const { theme, setTheme } = useTheme();

  // Prevent rendering sidebar content until client has mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
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
      <SidebarTrigger
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "flex items-center absolute top-[50%] -right-4 z-[99] border rounded-full bg-background p-1 transition-transform w-fit ",
          isCollapsed ? "justify-center" : "justify-end",
        )}
      />
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

  // Close child menus when sidebar is collapsed
  useEffect(() => {
    if (isSidebarCollapsed) {
      setIsOpen(false);
      setOpenChildren(new Set());
    }
  }, [isSidebarCollapsed]);

  // Auto-open menu if current path matches a child or grandchild
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
          setOpenChildren(new Set([matchedChild.url]));
        }
      }
    }
  }, [pathname, hasChildren, item.child]);

  const renderIcon = () => {
    if (!item.icon) return null;
  };

  const handleItemClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
    onClick?.();
  };

  const handleChildClick = (childUrl: string, e: React.MouseEvent) => {
    const child = item.child?.find((c) => c.url === childUrl);
    if (child?.grandChild && child.grandChild.length > 0) {
      e.preventDefault();
      setOpenChildren((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(childUrl)) {
          newSet.delete(childUrl);
        } else {
          newSet.add(childUrl);
        }
        return newSet;
      });
    }
  };

  const isActive = (() => {
    // Check if parent URL matches
    if (pathname.startsWith(item.url) && item.url !== "#") return true;
    // Check if any child or grandchild matches
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

  const parentGroup = ["asset_operation", "maintenance_operation"].includes(
    item.label,
  );

  return (
    <SidebarMenuItem
      key={item.url}
      className={cn(parentGroup && "border-b mt-4")}
    >
      <div className="flex flex-col">
        <div className="flex items-center">
          <SidebarMenuButton
            asChild={!hasChildren}
            isActive={isActive}
            onClick={handleItemClick}
          >
            {hasChildren ? (
              <div className=" flex-1 flex items-center justify-center gap-3 relative w-full text-left">
                {renderIcon()}
                {!isSidebarCollapsed && (
                  <>
                    <span className="text-large flex-1">{`${item.label}`}</span>
                    {item.count && item.count > 0 && (
                      <div className="w-5 h-5d text-white flex items-center justify-center rounded-full text-xs min-w-5">
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
                className="flex-1 flex items-center gap-3 relative"
                onClick={onClick}
              >
                {renderIcon()}
                {!isSidebarCollapsed && (
                  <>
                    <span className="text-large flex-1">{`${item.label}`}</span>
                    {item.count && item.count > 0 && (
                      <div className="w-5 h-5 bg-orange-500 text-white flex items-center justify-center rounded-full text-xs min-w-5">
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
          <div className="pl-8 mt-1 space-y-1">
            {item.child?.map((childItem) => {
              const hasGrandChildren =
                childItem.grandChild && childItem.grandChild.length > 0;
              const isChildOpen = openChildren.has(childItem.url);
              const isChildActive =
                pathname.startsWith(childItem.url) && childItem.url !== "#";

              return (
                <div key={`${childItem.url}_${childItem.label}`}>
                  <SidebarMenuButton
                    asChild={!hasGrandChildren}
                    isActive={isChildActive}
                    onClick={(e) => handleChildClick(childItem.url, e)}
                  >
                    {hasGrandChildren ? (
                      <div className="flex-1 flex items-center gap-3 relative w-full text-left">
                        <span className="text-large flex-1">
                          {`${item?.label}.${childItem?.label}`}
                        </span>
                        {childItem.count && childItem.count > 0 && (
                          <div className="w-5 h-5 bg-orange-500 text-white flex items-center justify-center rounded-full text-xs min-w-5">
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
                          {`${item?.label}.${childItem.label}`}
                        </span>
                        {childItem.count && childItem.count > 0 && (
                          <div className="w-5 h-5 bg-orange-500 text-white flex items-center justify-center rounded-full text-xs min-w-5">
                            {childItem.count}
                          </div>
                        )}
                      </Link>
                    )}
                  </SidebarMenuButton>

                  {hasGrandChildren && isChildOpen && (
                    <div className="pl-8 mt-1 space-y-1">
                      {childItem.grandChild?.map((grandChildItem) => (
                        <SidebarMenuButton
                          key={`${grandChildItem.url}_${grandChildItem.label}`}
                          asChild
                          isActive={
                            pathname.startsWith(grandChildItem.url) &&
                            grandChildItem.url !== "#"
                          }
                          className="data-[active=true]:border-l-4 data-[active=true]:border-l-primary rounded-sm data-[active=true]:text-primary  hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <Link
                            href={grandChildItem.url}
                            className="flex items-center gap-3"
                          >
                            <span className="text-large flex-1">
                              {`${item?.label}.${childItem.label}.${grandChildItem.label}`}
                            </span>
                            {grandChildItem.count &&
                              grandChildItem.count > 0 && (
                                <div className="w-5 h-5  flex items-center justify-center rounded-full text-xs min-w-5">
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
