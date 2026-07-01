import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // 1. Define your main production domains and local dev hosts
  const mainDomains = ["table-track-id.vercel.app", "table-track-id.vercel.app", "localhost:3000", "localhost"];
  
  // Clean up hostname by stripping the port
  let currentHost = hostname;
  if (currentHost.includes(":")) {
    currentHost = currentHost.split(":")[0];
  }

  // 2. Check if we are on a main domain or testing subdomains locally
  const isMainDomain = mainDomains.some(domain => 
    currentHost === domain || currentHost === `www.${domain}`
  ) && !currentHost.endsWith(".localhost");

  const pathname = url.pathname;

  // 3. Handle path-based /order/[slug] without tableId (redirect to /order/[slug]/new-order)
  if (pathname === "/order" || pathname.startsWith("/order/")) {
    const pathParts = pathname.split("/").filter(Boolean);
    // pathParts: ["order", "slug"]
    if (pathParts.length === 2) {
      const slug = pathParts[1];
      url.pathname = `/order/${slug}/new-order`;
      return NextResponse.redirect(url);
    }
  }

  // 4. Extract the tenant slug/subdomain
  let subdomain = "";
  if (!isMainDomain) {
    const parts = currentHost.split(".");
    if (parts.length > 2) {
      subdomain = parts[0];
    } else if (currentHost.endsWith(".localhost") && parts.length > 1) {
      // Local testing: misenary.localhost -> parts = ["misenary", "localhost"]
      subdomain = parts[0];
    }
  }

  // 4. Perform rewrite if a valid subdomain is resolved
  if (subdomain && subdomain !== "www") {
    const pathname = url.pathname;
    
    // Prevent rewriting Next.js assets, API routes, or physical static files
    if (
      !pathname.startsWith("/_next") &&
      !pathname.startsWith("/api") &&
      !pathname.includes(".")
    ) {
      // Initialize Supabase Client to check subscription status
      const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      });

      const { data: tenant } = await supabase
        .from("tenant")
        .select("subscription_tier")
        .eq("slug", subdomain)
        .maybeSingle();

      // If the tenant is on Free tier, redirect to path-based URL instead of custom subdomain
      if (tenant && tenant.subscription_tier !== "pro") {
        let baseHost = currentHost;
        if (currentHost.startsWith(subdomain + ".")) {
          baseHost = currentHost.replace(subdomain + ".", "");
        }

        const port = request.nextUrl.port ? `:${request.nextUrl.port}` : "";
        
        let redirectPath = pathname;
        if (!redirectPath.startsWith(`/order/${subdomain}`)) {
          const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
          redirectPath = `/order/${subdomain}${cleanPath}`;
        }

        const redirectUrl = new URL(
          `${request.nextUrl.protocol}//${baseHost}${port}${redirectPath}`
        );

        // Copy query search parameters (like tableId)
        request.nextUrl.searchParams.forEach((val, key) => {
          redirectUrl.searchParams.set(key, val);
        });

        return NextResponse.redirect(redirectUrl);
      }

      // Pro tier subdomain:
      // If the pathname already starts with /order, bypass the rewrite logic and let Next.js handle it
      if (pathname === "/order" || pathname.startsWith("/order/")) {
        return NextResponse.next();
      }

      // Direct rewrite for payment and status under subdomain
      if (pathname === "/payment" || pathname === "/payment/") {
        url.pathname = "/order/payment";
        return NextResponse.rewrite(url);
      }
      if (pathname === "/status" || pathname === "/status/") {
        url.pathname = "/order/status";
        return NextResponse.rewrite(url);
      }

      // Split pathname: e.g. "/table-1/cart" -> ["table-1", "cart"]
      const pathParts = pathname.split("/").filter(Boolean);
      
      if (pathParts.length === 0) {
        url.pathname = `/order/${subdomain}/new-order`;
        return NextResponse.rewrite(url);
      }
      
      if (pathParts.length > 0) {
        const tableId = pathParts[0];
        const subPage = pathParts[1] || "";
        
        if (subPage === "cart") {
          url.pathname = `/order/${subdomain}/cart`;
          url.searchParams.set("tableId", tableId);
        } else {
          url.pathname = `/order/${subdomain}/${tableId}`;
        }
        
        return NextResponse.rewrite(url);
      }
    }
  }

  return NextResponse.next();
}

// Ignore static asset files in middleware mapping
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
