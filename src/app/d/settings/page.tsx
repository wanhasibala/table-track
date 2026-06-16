"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { 
  Building, 
  MapPin, 
  CreditCard, 
  Save, 
  Navigation,
  Globe,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "payments">("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<any>(null);

  // Form Fields State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | "">("");
  const [longitude, setLongitude] = useState<number | "">("");
  
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [qrisImageUrl, setQrisImageUrl] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");

  const [detectingGps, setDetectingGps] = useState(false);

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Unauthenticated. Please log in again.");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("user_account")
          .select("tenant_id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.tenant_id) {
          throw new Error("Could not fetch user tenant details.");
        }

        const { data: tenantData, error: tenantError } = await supabase
          .from("tenant")
          .select("*")
          .eq("id", profile.tenant_id)
          .single();

        if (tenantError || !tenantData) {
          throw new Error("Could not load tenant settings.");
        }

        setTenant(tenantData);
        
        // Populate profile form fields
        setName(tenantData.name || "");
        setSlug(tenantData.slug || "");
        setLogoUrl(tenantData.logo_url || "");
        setAddress(tenantData.address || "");
        setLatitude(tenantData.latitude !== null && tenantData.latitude !== undefined ? tenantData.latitude : "");
        setLongitude(tenantData.longitude !== null && tenantData.longitude !== undefined ? tenantData.longitude : "");
        
        // Populate payments form fields
        setBankName(tenantData.bank_name || "");
        setBankAccountNumber(tenantData.bank_account_number || "");
        setBankAccountName(tenantData.bank_account_name || "");
        setQrisImageUrl(tenantData.qris_image_url || "");
        setPaymentInstructions(tenantData.payment_instructions || "");
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, []);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setDetectingGps(true);
    toast.info("Requesting location access...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setDetectingGps(false);
        toast.success("Location coordinates detected successfully!");
      },
      (error) => {
        console.error("GPS detection error:", error);
        setDetectingGps(false);
        toast.error("Failed to acquire GPS location. Please input coordinates manually.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const updatedFields = {
        name: name.trim(),
        logo_url: logoUrl.trim() || null,
        address: address.trim() || null,
        latitude: latitude === "" ? null : Number(latitude),
        longitude: longitude === "" ? null : Number(longitude),
        bank_name: bankName.trim() || null,
        bank_account_number: bankAccountNumber.trim() || null,
        bank_account_name: bankAccountName.trim() || null,
        qris_image_url: qrisImageUrl.trim() || null,
        payment_instructions: paymentInstructions.trim() || null,
      };

      const { error } = await supabase
        .from("tenant")
        .update(updatedFields)
        .eq("id", tenant.id);

      if (error) throw error;
      
      toast.success("Settings updated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] h-full">
        <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl">
      <div>
        <h3 className="text-xl font-bold text-foreground">Store Settings</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure your business profile, delivery coordinates, and customer payment methods.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border gap-1">
        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all",
            activeTab === "profile"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Building className="h-4 w-4" />
          <span>Store Profile</span>
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all",
            activeTab === "payments"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <CreditCard className="h-4 w-4" />
          <span>Payment Methods</span>
        </button>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSaveSettings} className="space-y-6 bg-card border border-border/60 rounded-xl p-5 shadow-xs">
        {activeTab === "profile" && (
          <div className="space-y-4 animate-fade-in">
            {/* General Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Store Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">URL Slug (Subdomain) *</label>
                <div className="flex items-center">
                  <span className="bg-muted border border-r-0 border-border px-3 py-2 text-sm rounded-l-lg text-muted-foreground font-mono">
                    http://
                  </span>
                  <input
                    type="text"
                    disabled
                    value={slug}
                    className="w-full px-3 py-2 text-sm rounded-r-lg border border-border bg-muted cursor-not-allowed font-mono text-muted-foreground"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Store URL slugs are permanent to keep active QR links working.</p>
              </div>
            </div>

            {/* Logo Image */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> Logo Image URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="e.g. https://yourhost.com/logo.png"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {/* Store Address */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Business Address (For Delivery Calculations)
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Complete store location details..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
              />
            </div>

            {/* GPS Coordinates */}
            <div className="space-y-1.5 p-3.5 bg-muted/20 border border-border/40 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <div>
                  <span className="text-xs font-bold text-foreground">GPS Location Coordinates</span>
                  <p className="text-[10px] text-muted-foreground">Required for calculating automated customer delivery distances.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingGps}
                  className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 text-orange-500 rounded-lg text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  {detectingGps ? (
                    <>
                      <div className="h-3 w-3 border border-orange-500 border-t-transparent rounded-full animate-spin" />
                      Locating...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-3 w-3" />
                      Auto-Detect GPS
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="e.g. -7.3146"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="e.g. 112.7405"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-4 animate-fade-in">
            {/* Bank Transfer Details */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-foreground block uppercase tracking-wider">Manual Bank Transfer Details</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. BCA, Mandiri, BRI"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Account Number</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="e.g. 1400012345678"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Account Name</label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    placeholder="e.g. PT. Kuliner Mandiri"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>

            {/* QRIS URL / Payload */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> QRIS Code Image URL
              </label>
              <input
                type="url"
                value={qrisImageUrl}
                onChange={(e) => setQrisImageUrl(e.target.value)}
                placeholder="e.g. https://yourhost.com/qris.jpg"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <p className="text-[10px] text-muted-foreground">Upload your QRIS static code image and paste the URL here to display it to customers on checkout.</p>
            </div>

            {/* Payment Instructions */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Payment Instructions</label>
              <textarea
                rows={3}
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="e.g. Please transfer the exact invoice amount, upload your payment receipt screenshot, and await merchant confirmation."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
              />
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex justify-end pt-2 border-t border-border/60">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
