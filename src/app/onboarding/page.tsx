"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, Globe, MapPin, UploadCloud, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  // Onboarding Steps: 1 = Business Details, 2 = Customize Domain/Slug
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [slug, setSlug] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Slug checking state
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");

  // Authentication check
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in first.");
        router.push("/auth/login");
      } else {
        setUser(user);
      }
    }
    checkUser();
  }, [router, supabase]);

  // Handle auto-generating slug from business name
  useEffect(() => {
    if (step === 1 && businessName) {
      const generatedSlug = businessName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric except spaces/dashes
        .replace(/\s+/g, "-") // Replace spaces with dashes
        .replace(/-+/g, "-") // Collapse consecutive dashes
        .trim();
      setSlug(generatedSlug);
    }
  }, [businessName, step]);

  // Debounced slug uniqueness validation
  useEffect(() => {
    if (step !== 2 || !slug) {
      setSlugStatus("idle");
      return;
    }

    const cleanSlug = slug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("tenant")
          .select("id")
          .eq("slug", cleanSlug)
          .maybeSingle();

        if (error) {
          console.error(error);
          setSlugStatus("idle");
          return;
        }

        if (data) {
          setSlugStatus("taken");
        } else {
          setSlugStatus("available");
        }
      } catch (err) {
        console.error(err);
        setSlugStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, step, supabase]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = () => {
    if (!businessName.trim()) {
      toast.error("Business name is required.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (slugStatus !== "available") {
      toast.error("Please enter a valid, available URL slug.");
      return;
    }

    setLoading(true);
    let logoUrl: string | null = null;

    try {
      // 1. Upload Logo if selected
      if (logoFile) {
        toast.loading("Uploading business logo...", { id: "upload-toast" });
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("logos")
          .upload(fileName, logoFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Logo upload error:", uploadError);
          toast.error("Failed to upload logo: " + uploadError.message, { id: "upload-toast" });
          setLoading(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("logos")
          .getPublicUrl(fileName);
        logoUrl = publicUrl;
        toast.success("Logo uploaded successfully!", { id: "upload-toast" });
      }

      // 2. Call RPC to initialize organization
      toast.loading("Setting up your workspace...", { id: "setup-toast" });
      const { data: tenantId, error: onboardingError } = await supabase.rpc(
        "initialize_new_organization",
        {
          p_org_name: businessName.trim(),
          p_address: address.trim() || null,
          p_logo_url: logoUrl,
          p_user_id: user.id,
        }
      );

      if (onboardingError) {
        console.error("Onboarding RPC failure:", onboardingError);
        toast.error("Onboarding failed: " + onboardingError.message, { id: "setup-toast" });
        setLoading(false);
        return;
      }

      if (tenantId) {
        // 3. Update the tenant record with custom slug
        const cleanSlug = slug.trim().toLowerCase();
        const { error: slugError } = await supabase
          .from("tenant")
          .update({ slug: cleanSlug, address: address.trim() || null, logo_url: logoUrl })
          .eq("id", tenantId);

        if (slugError) {
          console.error("Failed to update tenant slug:", slugError);
          // If the unique constraint was violated just now
          if (slugError.code === "23505") {
            toast.error("Subdomain slug was taken by someone else in the last second.", { id: "setup-toast" });
            setLoading(false);
            return;
          }
        }



        // 6. Update user's profile state in localStorage to prevent reload lag
        const localUserStr = localStorage.getItem("user");
        if (localUserStr) {
          const localUser = JSON.parse(localUserStr);
          localUser.tenant_id = tenantId;
          localStorage.setItem("user", JSON.stringify(localUser));
        } else {
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: user.id,
              email: user.email,
              name: businessName,
              tenant_id: tenantId,
            })
          );
        }
        localStorage.setItem("role", JSON.stringify({ name: "admin" }));

        toast.success("Welcome aboard! Store setup complete.", { id: "setup-toast" });
        router.push("/d/dashboard");
      }
    } catch (err: any) {
      console.error("Unexpected onboarding error:", err);
      toast.error("An unexpected error occurred: " + err.message, { id: "setup-toast" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/15 via-slate-950/40 to-slate-950 -z-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl -z-10 animate-pulse" />

      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            TableTrack
          </h1>
          <p className="text-slate-400 mt-2">Set up your digital restaurant workspace in seconds</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
              step === 1 ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-orange-500/30 text-orange-200"
            }`}>
              1
            </span>
            <span className={`text-sm font-medium ${step === 1 ? "text-slate-200" : "text-slate-500"}`}>Business Info</span>
          </div>
          <div className="w-8 h-[2px] bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
              step === 2 ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-slate-800 text-slate-500"
            }`}>
              2
            </span>
            <span className={`text-sm font-medium ${step === 2 ? "text-slate-200" : "text-slate-500"}`}>Store Slug</span>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl text-slate-100 overflow-hidden">
          <CardHeader className="border-b border-slate-800/80 bg-slate-900/50 pb-5">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              {step === 1 ? (
                <>
                  <Building2 className="text-orange-500 size-5" /> Tell us about your business
                </>
              ) : (
                <>
                  <Globe className="text-orange-500 size-5" /> Customize your URL slug
                </>
              )}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step === 1
                ? "Enter your restaurant name, address and upload a logo."
                : "Choose a slug for your online menu. Customers will scan QR codes leading here."}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="business-name" className="text-slate-300">Business Name</Label>
                  <Input
                    id="business-name"
                    placeholder="e.g. Bella Italia, Coffee House"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="bg-slate-950/60 border-slate-800 focus-visible:ring-orange-500 focus-visible:ring-offset-slate-950 text-slate-100 placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-slate-300">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="e.g. 123 Gourmet Ave, New York"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-slate-950/60 border-slate-800 focus-visible:ring-orange-500 focus-visible:ring-offset-slate-950 text-slate-100 placeholder:text-slate-600 min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Business Logo</Label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-lg p-6 bg-slate-950/30 hover:bg-slate-950/50 hover:border-orange-500/50 transition-all cursor-pointer relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {logoPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-orange-500/30 shadow-md"
                        />
                        <span className="text-xs text-orange-400 font-medium">Click to change logo</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <UploadCloud className="size-8 text-slate-500 group-hover:text-orange-500 transition-colors" />
                        <span className="text-sm text-slate-400 font-medium">Drag & drop or click to upload</span>
                        <span className="text-xs text-slate-600">Supports PNG, JPG, WEBP (Max 2MB)</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-slate-300">Store URL Slug</Label>
                  <div className="relative">
                    <Input
                      id="slug"
                      placeholder="e.g. bella-italia"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase())}
                      className="bg-slate-950/60 border-slate-800 focus-visible:ring-orange-500 focus-visible:ring-offset-slate-950 text-slate-100 placeholder:text-slate-600 pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      {slugStatus === "checking" && (
                        <Loader2 className="size-5 text-orange-500 animate-spin" />
                      )}
                      {slugStatus === "available" && (
                        <CheckCircle2 className="size-5 text-emerald-500" />
                      )}
                      {slugStatus === "taken" && (
                        <XCircle className="size-5 text-red-500" />
                      )}
                      {slugStatus === "invalid" && (
                        <AlertCircle className="size-5 text-amber-500" />
                      )}
                    </div>
                  </div>

                  {/* Validation message helper */}
                  <div className="text-xs mt-1 min-h-[16px]">
                    {slugStatus === "checking" && <span className="text-slate-500">Checking availability...</span>}
                    {slugStatus === "available" && <span className="text-emerald-400 font-medium">✓ That slug is available!</span>}
                    {slugStatus === "taken" && <span className="text-red-400 font-medium">✗ This slug is already taken. Please choose another.</span>}
                    {slugStatus === "invalid" && <span className="text-amber-400 font-medium">Slug must be lowercase letters, numbers, and dashes only.</span>}
                  </div>
                </div>

                {/* Gorgeous Live Preview */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono tracking-wider uppercase ml-2">Store Link Preview</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 select-none overflow-x-auto">
                    <Globe className="size-4 text-orange-500 shrink-0" />
                    <span className="text-xs font-mono text-slate-300 whitespace-nowrap">
                      https://
                      <strong className="text-orange-400 bg-orange-500/10 px-1 rounded font-semibold">
                        {slug ? slug.trim().toLowerCase() : "your-slug"}
                      </strong>
                      .localhost:3000
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    This is the address your customers will visit. On the Pro Plan, you can also link your custom domain (e.g. <code className="text-slate-400">menu.myrestaurant.com</code>).
                  </p>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="border-t border-slate-800/80 bg-slate-900/50 p-4 flex justify-between gap-3">
            {step === 2 && (
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={loading}
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              >
                Back
              </Button>
            )}
            <Button
              onClick={step === 1 ? handleNextStep : handleSubmit}
              disabled={loading || (step === 2 && slugStatus !== "available")}
              className={`ml-auto font-bold px-6 py-2 transition-all ${
                step === 2 && slugStatus !== "available"
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Customizing...
                </span>
              ) : step === 1 ? (
                "Continue to URL"
              ) : (
                "Launch Workspace"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}