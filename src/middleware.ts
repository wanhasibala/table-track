import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // 1. Define your main production domains and local dev hosts
  const mainDomains = ["tabletrack.vercel.app", "tabletrack.com", "localhost:3000", "localhost"];
  
  // Clean up hostname by stripping the port
  let currentHost = hostname;
  if (currentHost.includes(":")) {
    currentHost = currentHost.split(":")[0];
  }

  // 2. Check if we are on a main domain or testing subdomains locally
  const isMainDomain = mainDomains.some(domain => 
    currentHost === domain || currentHost === `www.${domain}`
  ) && !currentHost.endsWith(".localhost");

  // 3. Extract the tenant slug/subdomain
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
        url.pathname = `/order/${subdomain}`;
        return NextResponse.rewrite(url);
      }
      
      if (pathParts.length > 0) {
        const tableId = pathParts[0];
        const subPage = pathParts[1] || "";
        
        if (subPage) {
          url.pathname = `/order/${subdomain}/${subPage}`;
        } else {
          url.pathname = `/order/${subdomain}`;
        }
        url.searchParams.set("tableId", tableId);
        
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
