# Dynamic Subdomain Routing Guide (Next.js + Vercel)

This guide shows you how to automate dynamic tenant subdomains (e.g., mapping `misenary.tabletrack.com/table-1` internally to `/order/misenary/table-1` so the address bar displays `misenary.tabletrack.com/table-1`).

---

## Step 1: Add Wildcard Domain in Vercel
Vercel supports wildcards out-of-the-box. Instead of adding every client's subdomain manually in Vercel settings, you can define a wildcard domain.

1. Go to your project on the **Vercel Dashboard**.
2. Go to **Settings > Domains**.
3. Add `*.tabletrack.com` (or `*.tabletrack.vercel.app` if you are using the Vercel default domain).
4. **DNS Setup**: Go to your DNS provider (e.g., Cloudflare, GoDaddy, Namecheap) and add a **CNAME** record:
   - **Name**: `*`
   - **Target**: `cname.vercel-dns.com`
   - **TTL**: Auto / 3600

Now, any subdomain mapped to your domain (e.g. `clientA.tabletrack.com`) will automatically resolve to your Vercel deployment.

---

## Step 2: Implement Next.js Middleware for Internal Rewriting
Next.js Middleware intercepts all incoming requests. We can inspect the `host` header, extract the subdomain (`misenary`), and internally redirect/rewrite the request path.

Create a file named `src/middleware.ts` in your project containing this code:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // 1. Define your main domains and development hosts
  const mainDomains = ["tabletrack.vercel.app", "tabletrack.com", "localhost:3000"];

  let currentHost = hostname;
  // Remove port for local development environments
  if (currentHost.includes(":")) {
    currentHost = currentHost.split(":")[0];
  }

  // 2. Check if we are on the main root domain
  const isMainDomain = mainDomains.some(domain => 
    currentHost === domain || currentHost === `www.${domain}`
  );

  // 3. If it's a subdomain, perform the rewrite
  if (!isMainDomain) {
    const parts = currentHost.split(".");
    let subdomain = "";
    
    // E.g. misenary.tabletrack.com -> parts = ["misenary", "tabletrack", "com"]
    if (parts.length > 2) {
      subdomain = parts[0];
    }

    if (subdomain && subdomain !== "www") {
      const pathname = url.pathname;

      // Avoid rewriting API endpoints, static assets, and dev files
      if (
        !pathname.startsWith("/_next") &&
        !pathname.startsWith("/api") &&
        !pathname.includes(".")
      ) {
        const tableId = pathname.replace(/^\//, "");
        
        // Rewrite internally:
        // - From: misenary.tabletrack.com/table-1
        // - To: /order/misenary/table-1
        if (tableId) {
          url.pathname = `/order/${subdomain}/${tableId}`;
        } else {
          url.pathname = `/order/${subdomain}`;
        }

        return NextResponse.rewrite(url);
      }
    }
  }

  return NextResponse.next();
}

// Specify matcher to ignore static asset files
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/assets with extensions (png, jpg, svg, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
```

---

## Step 3: Local Testing
You can test this locally by modifying your local hosts file (`/etc/hosts` on Mac/Linux or `C:\Windows\System32\drivers\etc\hosts` on Windows) to point subdomains to localhost:

1. Open your hosts file in administrative/sudo mode.
2. Add the following lines:
   ```text
   127.0.0.1 misenary.localhost
   127.0.0.1 apple.localhost
   ```
3. Update `mainDomains` array in your `middleware.ts` to include `"localhost"` instead of `"localhost:3000"`.
4. Run `npm run dev` and navigate to `misenary.localhost:3000/table-1`. Next.js will serve the content of `/order/misenary/table-1` while displaying `misenary.localhost:3000/table-1` in the address bar.
