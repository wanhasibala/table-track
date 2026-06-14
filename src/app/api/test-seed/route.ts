import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Get the current logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        message: "Authentication required. Please log in first at /auth/login",
      }, { status: 401 });
    }

    // 2. Fetch the tenant linked to the user account
    const { data: userAccount, error: accountError } = await supabase
      .from("user_account")
      .select("tenant_id, tenant(slug)")
      .eq("id", user.id)
      .single();

    if (accountError || !userAccount?.tenant_id) {
      return NextResponse.json({
        success: false,
        message: "No organization linked to this user. Please complete onboarding first at /onboarding",
      }, { status: 400 });
    }

    const tenantId = userAccount.tenant_id;
    const tenantSlug = (userAccount.tenant as any)?.slug || "misenary";

    console.log(`Seeding database for tenant: ${tenantSlug} (${tenantId})`);

    // 3. Create a Table Spot named "table-1" if it doesn't exist
    let tableSpotId = "";
    const { data: existingSpot } = await supabase
      .from("table_spot")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("name", "table-1")
      .maybeSingle();

    if (existingSpot) {
      tableSpotId = existingSpot.id;
      console.log(`Verified table-1 spot: ${tableSpotId}`);
    } else {
      const { data: newSpot, error: spotError } = await supabase
        .from("table_spot")
        .insert({
          name: "table-1",
          tenant_id: tenantId,
          is_active: true
        })
        .select()
        .single();

      if (spotError) throw spotError;
      tableSpotId = newSpot.id;
      console.log(`Created new table-1 spot: ${tableSpotId}`);
    }

    // 4. Create Category "Fresh Organic Fruits" if it doesn't exist
    let categoryId = "";
    const { data: existingCat } = await supabase
      .from("category")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("name", "Fresh Organic Fruits")
      .maybeSingle();

    if (existingCat) {
      categoryId = existingCat.id;
      console.log(`Verified category: ${categoryId}`);
    } else {
      const { data: newCat, error: catError } = await supabase
        .from("category")
        .insert({
          name: "Fresh Organic Fruits",
          tenant_id: tenantId,
          is_active: true,
          sort_order: 1
        })
        .select()
        .single();

      if (catError) throw catError;
      categoryId = newCat.id;
      console.log(`Created new category: ${categoryId}`);
    }

    // 5. Create Menu Item "Organic Strawberries" if it doesn't exist
    let strawberryId = "";
    const { data: existingStraw } = await supabase
      .from("menu_item")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("name", "Organic Strawberries")
      .maybeSingle();

    if (existingStraw) {
      strawberryId = existingStraw.id;
      console.log(`Verified Organic Strawberries: ${strawberryId}`);
    } else {
      const { data: newStraw, error: strawError } = await supabase
        .from("menu_item")
        .insert({
          name: "Organic Strawberries",
          price: 15000,
          stock: 50,
          tenant_id: tenantId,
          category_id: categoryId,
          is_available: true
        })
        .select()
        .single();

      if (strawError) throw strawError;
      strawberryId = newStraw.id;
      console.log(`Created new Organic Strawberries item: ${strawberryId}`);

      // Create variants & options for Strawberry
      const { data: sizeVar, error: v1Error } = await supabase
        .from("menu_variant")
        .insert({
          name: "Cup Size",
          is_required: true,
          menu_item_id: strawberryId,
          tenant_id: tenantId
        })
        .select()
        .single();

      if (v1Error) throw v1Error;

      await supabase.from("menu_variant_option").insert([
        { label: "Standard Cup", price_add: 0, variant_id: sizeVar.id, tenant_id: tenantId },
        { label: "Large Family Pack", price_add: 12000, variant_id: sizeVar.id, tenant_id: tenantId }
      ]);

      const { data: ripeVar, error: v2Error } = await supabase
        .from("menu_variant")
        .insert({
          name: "Ripeness Selection",
          is_required: false,
          menu_item_id: strawberryId,
          tenant_id: tenantId
        })
        .select()
        .single();

      if (v2Error) throw v2Error;

      await supabase.from("menu_variant_option").insert([
        { label: "Perfectly Ripe (Sweet)", price_add: 0, variant_id: ripeVar.id, tenant_id: tenantId },
        { label: "Slightly Sour (Crisp)", price_add: 0, variant_id: ripeVar.id, tenant_id: tenantId }
      ]);
      console.log("Seeded variants & options for strawberries.");
    }

    // 6. Create Menu Item "Harum Manis Mango" if it doesn't exist
    let mangoId = "";
    const { data: existingMango } = await supabase
      .from("menu_item")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("name", "Sweet Harum Manis Mango")
      .maybeSingle();

    if (existingMango) {
      mangoId = existingMango.id;
      console.log(`Verified Harum Manis Mango: ${mangoId}`);
    } else {
      const { data: newMango, error: mangoError } = await supabase
        .from("menu_item")
        .insert({
          name: "Sweet Harum Manis Mango",
          price: 18000,
          stock: 30,
          tenant_id: tenantId,
          category_id: categoryId,
          is_available: true
        })
        .select()
        .single();

      if (mangoError) throw mangoError;
      mangoId = newMango.id;
      console.log(`Created new Harum Manis Mango item: ${mangoId}`);
    }

    return NextResponse.json({
      success: true,
      message: `Database successfully seeded for tenant '${tenantSlug}'!`,
      data: {
        tenantId,
        tenantSlug,
        tableSpotName: "table-1",
        tableSpotId,
        categoryName: "Fresh Organic Fruits",
        categoryId,
        menuItems: [
          { name: "Organic Strawberries", id: strawberryId },
          { name: "Sweet Harum Manis Mango", id: mangoId }
        ]
      }
    });

  } catch (err: any) {
    console.error("Error seeding via API:", err);
    return NextResponse.json({
      success: false,
      message: err.message || "Failed to seed database.",
    }, { status: 500 });
  }
}
