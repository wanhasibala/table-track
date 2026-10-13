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
  Image as ImageIcon,
  Upload,
  X,
  Check,
  QrCode,
  Loader2,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Lock,
  RefreshCw,
  Info,
  Sparkles,
  Smartphone,
  Clock,
  MessageSquare,
  Send,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileUpload } from "@/hooks/use-file-upload";
import { decodeQrisFromImageData, validateQris } from "@/lib/qris";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "payments" | "notifications" | "security">("profile");
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
  const [staticQris, setStaticQris] = useState("");
  const [qrisExpiryMinutes, setQrisExpiryMinutes] = useState(15);
  const [paymentInstructions, setPaymentInstructions] = useState("");

  // WhatsApp Notification Settings
  const [ownerWhatsapp, setOwnerWhatsapp] = useState("");
  const [waGatewayToken, setWaGatewayToken] = useState("");
  const [waNotifyNewOrder, setWaNotifyNewOrder] = useState(true);
  const [testingWa, setTestingWa] = useState(false);

  // Security & POS PIN State
  const [posPin, setPosPin] = useState("1234");
  const [posPinEnabled, setPosPinEnabled] = useState(true);
  const [showPin, setShowPin] = useState(false);

  const [detectingGps, setDetectingGps] = useState(false);
  const [uploadingQris, setUploadingQris] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { uploadFile } = useFileUpload();

  // Check URL query param for default tab (e.g. /d/settings?tab=notifications)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "security" || tabParam === "payments" || tabParam === "profile" || tabParam === "notifications") {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size exceeds 5MB limit.");
      return;
    }

    setUploadingQris(true);
    const toastId = toast.loading("Membaca & Mengunggah gambar QRIS...");

    // Try client-side QR code decoding
    try {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (event) => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, img.width, img.height);
            const decoded = decodeQrisFromImageData(imgData.data, img.width, img.height);
            if (decoded) {
              const validation = validateQris(decoded);
              if (validation.valid) {
                setStaticQris(decoded);
                toast.success("✅ String QRIS otomatis terbaca & valid EMVCo!", { id: toastId });
              } else {
                setStaticQris(decoded);
                toast.warning(`QRIS terbaca namun ada peringatan: ${validation.error}`, { id: toastId });
              }
            } else {
              toast.info("Gambar QRIS diunggah. Jika QR sulit terbaca otomatis, Anda juga bisa menyalin teks QRIS secara manual.", { id: toastId });
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.warn("QR auto-decode error:", e);
    }

    try {
      const url = await uploadFile(file, {
        bucket: "assets",
        folder: "qris",
      });
      setQrisImageUrl(url);
    } catch (err: any) {
      console.error("QRIS upload error:", err);
      toast.error(err.message || "Failed to upload QRIS image.", { id: toastId });
    } finally {
      setUploadingQris(false);
      e.target.value = "";
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo file size exceeds 5MB limit.");
      return;
    }

    setUploadingLogo(true);
    const toastId = toast.loading("Uploading business logo...");
    try {
      const url = await uploadFile(file, {
        bucket: "assets",
        folder: "logos",
      });
      setLogoUrl(url);
      toast.success("Logo uploaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Logo upload error:", err);
      toast.error(err.message || "Failed to upload logo.", { id: toastId });
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

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
        setStaticQris(tenantData.static_qris || "");
        setQrisExpiryMinutes(tenantData.qris_expiry_minutes || 15);
        setPaymentInstructions(tenantData.payment_instructions || "");

        // Populate WhatsApp Notification settings
        setOwnerWhatsapp(tenantData.owner_whatsapp || "");
        setWaGatewayToken(tenantData.wa_gateway_token || "");
        setWaNotifyNewOrder(tenantData.wa_notify_new_order !== false);

        // Populate Security & PIN form fields (with local storage fallback)
        const localPin = typeof window !== "undefined" && tenantData.slug 
          ? localStorage.getItem(`pos_pin_${tenantData.slug}`) 
          : null;
        const localEnabled = typeof window !== "undefined" && tenantData.slug 
          ? localStorage.getItem(`pos_pin_enabled_${tenantData.slug}`) 
          : null;

        setPosPin(tenantData.pos_pin || localPin || "1234");
        setPosPinEnabled(
          tenantData.pos_pin_enabled !== undefined && tenantData.pos_pin_enabled !== null
            ? Boolean(tenantData.pos_pin_enabled)
            : localEnabled !== null
              ? localEnabled === "true"
              : true
        );
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, []);

  const handleTestWhatsApp = async () => {
    if (!ownerWhatsapp.trim()) {
      toast.error("Silakan masukkan nomor WhatsApp Owner terlebih dahulu.");
      return;
    }
    setTestingWa(true);
    const toastId = toast.loading("Mengirim pesan uji coba WhatsApp...");
    try {
      const res = await fetch("/api/notifications/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPhone: ownerWhatsapp,
          token: waGatewayToken.trim() || undefined,
          tenantName: name || tenant?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengirim pesan uji coba WhatsApp");
      }
      toast.success(data.message || "Pesan uji coba WhatsApp berhasil dikirim!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim pesan uji coba", { id: toastId });
    } finally {
      setTestingWa(false);
    }
  };

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

  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPosPin(randomPin);
    toast.success(`PIN Acak dibuat: ${randomPin}`);
  };

  const handleResetDefaultPin = () => {
    setPosPin("1234");
    toast.info("PIN direset ke default: 1234");
  };

  const handleCopyPosUrl = () => {
    if (typeof window !== "undefined" && slug) {
      const url = `${window.location.origin}/pos/${slug}`;
      navigator.clipboard.writeText(url);
      toast.success("URL POS Kasir berhasil disalin!");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    const cleanPin = posPin.trim();

    // Validation for PIN
    if (posPinEnabled) {
      if (!cleanPin || !/^\d{4,6}$/.test(cleanPin)) {
        toast.error("PIN Kasir harus berupa 4 hingga 6 digit angka (contoh: 1234).");
        setActiveTab("security");
        return;
      }
    }

    setSaving(true);
    try {
      const supabase = createClient();

      const updatedFields: any = {
        name: name.trim(),
        logo_url: logoUrl.trim() || null,
        address: address.trim() || null,
        latitude: latitude === "" ? null : Number(latitude),
        longitude: longitude === "" ? null : Number(longitude),
        bank_name: bankName.trim() || null,
        bank_account_number: bankAccountNumber.trim() || null,
        bank_account_name: bankAccountName.trim() || null,
        qris_image_url: qrisImageUrl.trim() || null,
        static_qris: staticQris.trim() || null,
        qris_expiry_minutes: Number(qrisExpiryMinutes) || 15,
        payment_instructions: paymentInstructions.trim() || null,
        owner_whatsapp: ownerWhatsapp.trim() || null,
        wa_gateway_token: waGatewayToken.trim() || null,
        wa_notify_new_order: waNotifyNewOrder,
        pos_pin: cleanPin || "1234",
        pos_pin_enabled: posPinEnabled,
      };

      // Sync with localStorage for instant kiosk & client access
      if (typeof window !== "undefined" && slug) {
        localStorage.setItem(`pos_pin_${slug}`, cleanPin || "1234");
        localStorage.setItem(`pos_pin_enabled_${slug}`, String(posPinEnabled));
      }

      let { error } = await supabase
        .from("tenant")
        .update(updatedFields)
        .eq("id", tenant.id);

      if (error) {
        // Fallback gracefully if database columns pos_pin / pos_pin_enabled are being added
        if (error.message?.includes("pos_pin") || error.code === "PGRST204") {
          delete updatedFields.pos_pin;
          delete updatedFields.pos_pin_enabled;
          const retry = await supabase.from("tenant").update(updatedFields).eq("id", tenant.id);
          if (retry.error) throw retry.error;
          toast.success("Pengaturan & PIN POS berhasil disimpan!");
          return;
        }
        throw error;
      }
      
      toast.success("Pengaturan & PIN POS berhasil disimpan!");
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

  const posUrl = typeof window !== "undefined" && slug ? `${window.location.origin}/pos/${slug}` : `/pos/${slug}`;

  return (
    <div className="p-4 space-y-6 max-w-4xl">
      <div>
        <h3 className="text-xl font-bold text-foreground">Pengaturan Restoran</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kelola profil bisnis, metode pembayaran pelanggan, notifikasi WhatsApp, serta PIN keamanan kasir POS.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap border-b border-border gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all",
            activeTab === "profile"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Building className="h-4 w-4" />
          <span>Profil Resto</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all",
            activeTab === "payments"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <CreditCard className="h-4 w-4" />
          <span>Pembayaran & QRIS</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all",
            activeTab === "notifications"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          <div className="flex items-center gap-1.5">
            <span>Notifikasi WhatsApp</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
              waNotifyNewOrder && ownerWhatsapp
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                : "bg-muted text-muted-foreground"
            )}>
              {waNotifyNewOrder && ownerWhatsapp ? "Aktif" : "Off"}
            </span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all",
            activeTab === "security"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <KeyRound className="h-4 w-4" />
          <div className="flex items-center gap-1.5">
            <span>Keamanan & PIN POS</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
              posPinEnabled 
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                : "bg-muted text-muted-foreground"
            )}>
              {posPinEnabled ? "Aktif" : "Off"}
            </span>
          </div>
        </button>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSaveSettings} className="space-y-6 bg-card border border-border/60 rounded-xl p-5 shadow-xs">
        {/* TAB 1: PROFIL RESTO */}
        {activeTab === "profile" && (
          <div className="space-y-4 animate-fade-in">
            {/* General Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Nama Restoran / Usaha *</label>
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
                <p className="text-[10px] text-muted-foreground">Slug bersifat permanen agar tautan QR meja tetap aktif.</p>
              </div>
            </div>

            {/* Logo Image */}
            <div className="space-y-2 p-3.5 bg-muted/20 border border-border/40 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-orange-500" /> Logo Usaha
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="text-[11px] font-semibold text-destructive hover:underline flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Hapus
                  </button>
                )}
              </div>

              {logoUrl ? (
                <div className="flex items-center gap-4 bg-card p-3 rounded-lg border border-border/60">
                  <div className="w-16 h-16 rounded-xl border border-border/80 bg-background overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                    <img
                      src={logoUrl}
                      alt="Logo Usaha"
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-muted-foreground font-mono truncate"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors">
                      <Upload className="h-3.5 w-3.5" />
                      <span>{uploadingLogo ? "Mengunggah..." : "Ganti Logo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label
                  className={cn(
                    "flex flex-col items-center justify-center p-4 border-2 border-dashed border-border/80 hover:border-orange-500/50 rounded-xl bg-card hover:bg-muted/10 cursor-pointer transition-all text-center",
                    uploadingLogo && "opacity-50 pointer-events-none"
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                  {uploadingLogo ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
                      <span className="text-xs font-semibold text-foreground">Mengunggah Logo...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-1 text-muted-foreground">
                      <Upload className="h-4 w-4 text-orange-500" />
                      <span className="text-xs font-semibold text-foreground">Klik untuk upload logo restoran</span>
                      <span className="text-[10px] text-muted-foreground">(PNG, JPG, WEBP)</span>
                    </div>
                  )}
                </label>
              )}
            </div>

            {/* Store Address */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Alamat Fisik Restoran (Untuk Kalkulasi Pengiriman)
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Detail alamat lengkap outlet / restoran..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
              />
            </div>

            {/* GPS Coordinates */}
            <div className="space-y-1.5 p-3.5 bg-muted/20 border border-border/40 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <div>
                  <span className="text-xs font-bold text-foreground">Titik Koordinat GPS</span>
                  <p className="text-[10px] text-muted-foreground">Diperlukan untuk penghitungan ongkos kirim otomatis ke pelanggan.</p>
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
                      Mendeteksi...
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
                    placeholder="Contoh: -7.3146"
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
                    placeholder="Contoh: 112.7405"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: METODE PEMBAYARAN */}
        {activeTab === "payments" && (
          <div className="space-y-4 animate-fade-in">
            {/* Bank Transfer Details */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-foreground block uppercase tracking-wider">Detail Rekening Bank Transfer</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Nama Bank</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Contoh: BCA, Mandiri, BRI"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Nomor Rekening</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="Contoh: 1400012345678"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    placeholder="Contoh: PT Kuliner Mandiri"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>

            {/* QRIS Code Image Upload */}
            <div className="space-y-4 p-4 bg-muted/20 border border-border/40 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <QrCode className="h-4 w-4 text-orange-500" /> QRIS Merchant (Dinamis & Statis)
                  </label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Upload gambar barcode atau masukkan teks QRIS statis (`000201...`). Sistem akan otomatis mengonversinya menjadi QRIS Dinamis dengan nominal terkunci saat pelanggan memesan.
                  </p>
                </div>
                {qrisImageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setQrisImageUrl("");
                      setStaticQris("");
                    }}
                    className="text-[11px] font-semibold text-destructive hover:underline flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Hapus
                  </button>
                )}
              </div>

              {qrisImageUrl ? (
                <div className="flex flex-col sm:flex-row gap-4 items-start bg-card p-3.5 rounded-xl border border-border/60">
                  <div className="relative w-32 h-32 rounded-xl border border-border/80 bg-background overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                    <img
                      src={qrisImageUrl}
                      alt="QRIS Preview"
                      className="w-full h-full object-contain p-1.5"
                    />
                  </div>
                  <div className="space-y-2.5 flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <Check className="h-4 w-4" />
                      <span>Gambar QRIS Tersimpan</span>
                    </div>
                    <input
                      type="url"
                      value={qrisImageUrl}
                      onChange={(e) => setQrisImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-muted-foreground font-mono truncate"
                    />
                    <div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{uploadingQris ? "Mengunggah & Mendeteksi..." : "Ganti Gambar QRIS"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleQrisUpload}
                          disabled={uploadingQris}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <label
                  className={cn(
                    "flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/80 hover:border-orange-500/50 rounded-xl bg-card hover:bg-muted/10 cursor-pointer transition-all text-center",
                    uploadingQris && "opacity-50 pointer-events-none"
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQrisUpload}
                    disabled={uploadingQris}
                  />
                  {uploadingQris ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                      <span className="text-xs font-semibold text-foreground">
                        Membaca QR & Mengunggah...
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mb-1">
                        <Upload className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        Klik untuk upload gambar QRIS
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Sistem otomatis mengekstrak string `000201...` dari barcode gambar
                      </span>
                    </div>
                  )}
                </label>
              )}

              {/* Static QRIS Raw String Input */}
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>String Teks QRIS Statis</span>
                    <span className="text-[10px] text-muted-foreground">(EMVCo Payload)</span>
                  </label>
                  {staticQris && (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md",
                        validateQris(staticQris).valid
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      {validateQris(staticQris).valid ? "✓ EMVCo Valid" : "⚠️ Format / CRC Tidak Cocok"}
                    </span>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={staticQris}
                  onChange={(e) => setStaticQris(e.target.value)}
                  placeholder="00020101021126..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none break-all"
                />
                <p className="text-[10px] text-muted-foreground">
                  Jika upload gambar gagal mendeteksi kode, salin teks mentah hasil scan QRIS Anda dan tempel di sini.
                </p>
              </div>

              {/* Dynamic QRIS Expiration Setting */}
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                  <span>Durasi Masa Berlaku QRIS Dinamis (Menit)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={3}
                    max={120}
                    value={qrisExpiryMinutes}
                    onChange={(e) => setQrisExpiryMinutes(Math.max(1, Number(e.target.value)))}
                    className="w-32 px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <span className="text-xs text-muted-foreground">
                    Menit (Default: 15 menit). Pesanan yang tidak dibayar dalam durasi ini akan kedaluwarsa otomatis.
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Instruksi Pembayaran Pelanggan</label>
              <textarea
                rows={3}
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="Contoh: Silakan scan QRIS atau transfer sesuai nominal total dan konfirmasi pembayaran Anda di kasir."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
              />
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFIKASI WHATSAPP */}
        {activeTab === "notifications" && (
          <div className="space-y-5 animate-fade-in">
            {/* Header / Info Banner */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Notifikasi WhatsApp Otomatis (Fonnte / Multi-Provider)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                    Kirim pemberitahuan instan ke nomor WhatsApp Owner setiap kali pesanan baru dibuat oleh pelanggan di meja.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5",
                  waNotifyNewOrder && ownerWhatsapp 
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" 
                    : "bg-muted text-muted-foreground border border-border"
                )}>
                  {waNotifyNewOrder && ownerWhatsapp ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Notifikasi Aktif</span>
                    </>
                  ) : (
                    <>
                      <Info className="w-3.5 h-3.5" />
                      <span>Belum Aktif</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Kirim Notifikasi saat Pesanan Baru Masuk
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Setiap ada pelanggan yang checkout pesanan dari meja, notifikasi WhatsApp akan langsung dikirimkan.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={waNotifyNewOrder}
                  onChange={(e) => setWaNotifyNewOrder(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Form Inputs & Settings */}
            <div className="space-y-4 p-4 border border-border/60 rounded-xl bg-card">
              {/* WhatsApp Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Nomor WhatsApp Owner / Pengelola Toko</span>
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={ownerWhatsapp}
                  onChange={(e) => setOwnerWhatsapp(e.target.value)}
                  placeholder="Contoh: 081234567890 atau 6281234567890"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[11px] text-muted-foreground">
                  Format dapat diawali <code>08...</code>, <code>+628...</code>, atau <code>628...</code>. Sistem akan otomatis memformat ke standar internasional.
                </p>
              </div>

              {/* Fonnte Gateway Token */}
              <div className="space-y-1.5 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Token WhatsApp Gateway / Fonnte (Opsional)</span>
                  </label>
                  <a
                    href="https://fonnte.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <span>Daftar Fonnte Gratis</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="text"
                  value={waGatewayToken}
                  onChange={(e) => setWaGatewayToken(e.target.value)}
                  placeholder="Masukkan Token Fonnte (Kosongkan jika memakai token server default)"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[11px] text-muted-foreground">
                  Gunakan token Anda sendiri dari dashboard Fonnte untuk menghubungkan nomor bot WhatsApp toko Anda secara mandiri.
                </p>
              </div>

              {/* Test WhatsApp Button */}
              <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Uji Coba Pengiriman Pesan
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Kirim pesan tes ke nomor di atas untuk memastikan integrasi berjalan lancar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestWhatsApp}
                  disabled={testingWa || !ownerWhatsapp.trim()}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {testingWa ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim Tes...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Uji Coba Kirim WA</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Message Preview Mockup */}
            <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-border/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Pratinjau Pesan yang Akan Diterima:</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#d9fdd3] dark:bg-[#005c4b]/30 text-gray-800 dark:text-gray-200 border border-emerald-500/20 font-sans text-xs space-y-1.5 shadow-xs">
                <div className="font-bold text-emerald-800 dark:text-emerald-300">
                  🔔 *PESANAN BARU MASUK!* 🔔
                </div>
                <div className="text-[11px] space-y-0.5 leading-relaxed">
                  <p>📍 <strong>Resto:</strong> {name || "TableTrack Resto"}</p>
                  <p>🏷️ <strong>Meja:</strong> Meja 02</p>
                  <p>👤 <strong>Pelanggan:</strong> Rian</p>
                  <p>💳 <strong>Pembayaran:</strong> QRIS</p>
                  <p className="pt-1">📦 <strong>Daftar Item:</strong></p>
                  <p className="pl-3">· 2x Nasi Goreng Spesial - Rp 50.000</p>
                  <p className="pl-3">· 2x Es Teh Manis - Rp 14.000</p>
                  <p className="pt-1">💰 <strong>Total Tagihan:</strong> Rp 64.000</p>
                  <p className="pt-1 text-[10px] text-muted-foreground italic">
                    Segera proses pesanan ini melalui dashboard kasir POS!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: KEAMANAN & PIN POS KASIR */}
        {activeTab === "security" && (
          <div className="space-y-5 animate-fade-in">
            {/* Header Description */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Sistem PIN Keamanan POS Kasir (Kiosk Mode)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                    Staf kasir dapat mengoperasikan POS di tablet/PC kasir tanpa perlu mengetahui username dan password akun Owner. Cukup masukkan PIN 4–6 digit ini.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5",
                  posPinEnabled 
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                    : "bg-muted text-muted-foreground border border-border"
                )}>
                  {posPinEnabled ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>PIN Aktif</span>
                    </>
                  ) : (
                    <>
                      <Info className="w-3.5 h-3.5" />
                      <span>PIN Nonaktif</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Toggle Enable PIN */}
            <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Wajibkan PIN Kasir saat Membuka Terminal POS
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Jika dinonaktifkan, terminal POS Kasir pada route publik langsung terbuka tanpa verifikasi PIN.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={posPinEnabled}
                  onChange={(e) => setPosPinEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {/* PIN Configuration Box */}
            <div className={cn(
              "space-y-4 p-4 border rounded-xl bg-card transition-all",
              !posPinEnabled && "opacity-50 pointer-events-none"
            )}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-orange-500" />
                  <span>Atur 4–6 Digit PIN Kasir</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetDefaultPin}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-md border border-border hover:bg-muted/40 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset 1234</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPin}
                    className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Acak PIN</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* PIN Input field */}
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      maxLength={6}
                      value={posPin}
                      onChange={(e) => {
                        // Numeric only
                        const val = e.target.value.replace(/\D/g, "");
                        setPosPin(val);
                      }}
                      placeholder="Contoh: 1234"
                      className="w-full pl-4 pr-10 py-2.5 text-base font-mono tracking-widest rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Gunakan 4 hingga 6 digit angka yang mudah diingat oleh staf kasir.
                  </p>
                </div>

                {/* Visual PIN Preview */}
                <div className="p-3 bg-muted/20 border border-border/50 rounded-xl flex flex-col items-center justify-center gap-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
                    Preview Tampilan PIN
                  </span>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.max(4, posPin.length) }).map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-3.5 h-3.5 rounded-full border-2 transition-all",
                          idx < posPin.length
                            ? "bg-orange-500 border-orange-500 scale-105"
                            : "border-muted-foreground/30 bg-transparent"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground mt-0.5">
                    {showPin ? posPin || "-" : "••••".slice(0, posPin.length || 4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct POS Link Box */}
            <div className="p-4 bg-muted/20 border border-border/60 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-foreground">
                    Link Terminal POS Kasir Publik
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-md font-semibold">
                  Kiosk Mode
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={posUrl}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-muted-foreground select-all"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyPosUrl}
                    className="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link</span>
                  </button>
                  <a
                    href={posUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka POS</span>
                  </a>
                </div>
              </div>
            </div>

            {/* How it works info card */}
            <div className="p-3.5 rounded-xl bg-card border border-border text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Info className="w-3.5 h-3.5 text-primary" />
                <span>Cara Kerja Sistem PIN:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] pl-1">
                <li>Buka tautan POS pada tablet atau perangkat kasir outlet.</li>
                <li>Staf kasir memilih nama staf dan mengetikkan <strong>PIN di atas</strong> untuk membuka kasir.</li>
                <li>Staf dapat menekan tombol <strong>Kunci Terminal</strong> kapan saja saat pergantian shift atau istirahat.</li>
                <li>PIN dapat diganti kapan saja oleh Owner melalui halaman pengaturan ini.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex justify-end pt-2 border-t border-border/60">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
