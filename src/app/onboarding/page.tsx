"use client";
import { Card } from "@/components/ui/card";
import { DataForm, FieldConfig } from "@/components/ui/data-form/data-form";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

const OnboardingPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const fieldsOnboarding: FieldConfig[] = [
    {
      label: "Business Name",
      name: "name",
      type: "text",
      validation: { required: true },
    },
    {
      label: "Address",
      name: "address",
      type: "textarea",
    },
    { 
      label: "Business Logo", 
      name: "logo", 
      type: "file" 
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {

    if (!data.name?.trim()) {
      toast.error("Business name is required.");
      return;
    }

    setLoading(true);

    try {
      // 1. Fetch current active authenticated user session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User session missing. Please log in again.");
        router.push("/auth/login");
        return;
      }

      let finalLogoUrl: string | null = null;

      // 2. Handle File Upload if a logo file is present
      // Note: DataForm file inputs usually return either a File object or a FileList
      const fileField = data.logo;
      const fileToUpload = fileField instanceof FileList ? fileField[0] : fileField;

      if (fileToUpload instanceof File) {
        // Generate a clean, unique file name to avoid collisions (e.g., user_id/timestamp-filename)
        const fileExt = fileToUpload.name.split('.').pop();
        const cleanFileName = `${user.id}/${Date.now()}.${fileExt}`;

        toast.loading("Uploading business logo...", { id: "upload-toast" });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("logos")
          .upload(cleanFileName, fileToUpload, {
            cacheControl: "3600",
            upsert: true, // Overwrite if the exact same path exists
          });

        if (uploadError) {
          console.error("Storage upload failure:", uploadError);
          toast.error(`Logo upload failed: ${uploadError.message}`, { id: "upload-toast" });
          setLoading(false);
          return;
        }

        // Get the public asset URL from the uploaded path destination
        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from("logos")
            .getPublicUrl(cleanFileName);
            
          finalLogoUrl = publicUrl;
          toast.success("Logo uploaded successfully!", { id: "upload-toast" });
        }
      }

      // 3. Fire the RPC function passing profile info and the public asset URL
      const { data: tenantId, error: onboardingError } = await supabase.rpc(
        "initialize_new_organization",
        {
          p_org_name: data.name.trim(),
          p_address: data.address?.trim() || null,
          p_logo_url: finalLogoUrl, // Injected public URL string
          p_user_id: user.id,
        },
      );

      if (onboardingError) {
        console.error("Database connection fault:", onboardingError);
        toast.error(
          onboardingError.message ?? "Failed to initialize organization.",
        );
        setLoading(false);
        return;
      }

      if (tenantId) {
        toast.success("Store setup complete! Welcome to your dashboard.");
        router.push("/d/dashboard");
      }
    } catch (error) {
      console.error("Runtime error during onboarding submission:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto py-10 h-full flex items-center justify-center">
      <Card className="w-[400px] p-4">
        <DataForm fields={fieldsOnboarding} onSubmit={handleSubmit}  />
      </Card>
    </div>
  );
};

export default OnboardingPage;