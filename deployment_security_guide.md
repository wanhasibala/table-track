# Vercel Deployment & Security Checklist

This document outlines the security audits and checks required before deploying this project to production on Vercel for public users.

---

## 1. Enable Supabase Row Level Security (RLS)
Supabase executes database requests client-side directly from the browser. Without **Row Level Security (RLS)**, users can execute arbitrary commands on your tables.

### Action Items
1. Navigate to the **Supabase Dashboard > Database > Table Editor** (or Authentication/Policies).
2. Ensure RLS is **Enabled** for every table in the `public` schema:
   - `tenant`
   - `category`
   - `menu_item`
   - `menu_variant`
   - `menu_variant_option`
   - `order_table`
   - `order_item`
   - `payment`
   - `table_spot`
   - `user_account`
3. Configure the following rules/policies:
   - **Public Customer Policies**:
     - `SELECT` on `tenant`, `category`, `menu_item`, `menu_variant`, and `menu_variant_option` (to read the menu).
     - `INSERT` on `order_table` and `order_item` (to place orders).
   - **Admin/Staff Policies**:
     - Allow reads and writes only where the row's `tenant_id` matches the authenticated user's tenant ID. Use postgrest database helper functions like `get_user_tenant_id()` or `fn_my_tenant_id()`.
     - *Example rule:* `tenant_id = (select get_user_tenant_id())`

---

## 2. Guard Admin Dashboard Routes (`/d/...`)
Currently, dashboard layouts and sidebar elements are rendered without server-side verification. You must protect admin pages from being viewed by anonymous visitors.

### Action Items
Update your dashboard layout in `src/app/d/layout.tsx` to check user sessions before returning the layout:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if user session doesn't exist
  if (!user) {
    redirect("/auth/login");
  }

  return (
    // ... Sidebar and Header elements
  );
};
export default Layout;
```

---

## 3. Secure Environment Variables on Vercel
Local configurations in `.env` contain database passwords and connection strings that should never be pushed to public git repositories.

### Action Items
1. Double-check that `.env` is listed in `.gitignore` (which is standard behavior).
2. Go to **Vercel Dashboard > Settings > Environment Variables** and add the following keys manually:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_DB_PASSWORD`
3. **Never** prefix any secret keys (such as `SUPABASE_SERVICE_ROLE_KEY`) with `NEXT_PUBLIC_`, otherwise they will be packaged into the client-side JavaScript bundle.

---

## 4. Restrict CORS (Cross-Origin Resource Sharing)
Restrict incoming requests to your Supabase API to your production URL, preventing external domains from interacting with your endpoints.

### Action Items
1. Open your **Supabase Dashboard > Settings > API**.
2. Locate the **CORS URI** section.
3. Replace the default wildcard `*` with your specific production Vercel domain (e.g., `https://your-project.vercel.app`).
