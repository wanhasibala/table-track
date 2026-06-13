import { createClient } from "@/utils/supabase/client";
import { useState, useCallback } from "react";

const supabase = createClient();

interface UploadOptions {
  bucket?: string; // nama storage bucket (default: "assets")
  folder?: string; // subfolder dalam bucket, e.g. "avatars/user-123"
  upsert?: boolean; // overwrite jika file sudah ada (default: true)
  onProgress?: (progress: number) => void;
  onSuccess?: (response: UploadedFile | UploadedFile[]) => void;
  onError?: (error: any) => void;
}

interface UploadedFile {
  path: string;
  url: string;
  name: string;
}

interface UploadResult {
  data?: UploadedFile;
  error?: any;
}

/**
 * Upload satu file ke Supabase Storage dan kembalikan public URL-nya.
 */
async function uploadToSupabase(
  file: File,
  bucket: string,
  folder?: string,
  upsert = true,
): Promise<UploadResult> {
  let prefix = "";
  try {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        prefix = parsed.tenant_id || parsed.id || "";
      }
    }

    if (!prefix) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("user_account")
          .select("tenant_id")
          .eq("id", user.id)
          .maybeSingle();
        prefix = profile?.tenant_id || user.id;
      }
    }
  } catch (e) {
    console.error("Error resolving user/tenant prefix:", e);
  }

  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

  let filePath = fileName;
  if (prefix) {
    filePath = folder
      ? `${prefix}/${folder}/${fileName}`
      : `${prefix}/${fileName}`;
  } else {
    filePath = folder ? `${folder}/${fileName}` : fileName;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert });

  if (error) return { error };

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    data: {
      path: data.path,
      url: urlData.publicUrl,
      name: file.name,
    },
  };
}

export function useFileUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  /**
   * Upload satu file
   */
  const uploadFile = useCallback(
    async (file: File, options: UploadOptions = {}): Promise<string> => {
      const {
        bucket = "assets",
        folder,
        upsert = true,
        onSuccess,
        onError,
      } = options;

      setIsLoading(true);
      setProgress(0);

      try {
        const result = await uploadToSupabase(file, bucket, folder, upsert);

        if (result.error) {
          onError?.(result.error);
          throw result.error;
        }

        setProgress(100);
        onSuccess?.(result.data!);
        return result.data!.url;
      } catch (error) {
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Upload beberapa file sekaligus (paralel)
   */
  const uploadFiles = useCallback(
    async (
      files: File[],
      options: UploadOptions = {},
    ): Promise<UploadResult[]> => {
      const {
        bucket = "assets",
        folder,
        upsert = true,
        onSuccess,
        onError,
      } = options;

      setIsLoading(true);
      setProgress(0);

      try {
        const results = await Promise.all(
          files.map((file) => uploadToSupabase(file, bucket, folder, upsert)),
        );

        setProgress(100);

        const hasErrors = results.some((r) => r.error);
        if (hasErrors) {
          onError?.(results.filter((r) => r.error));
        } else {
          onSuccess?.(results.map((r) => r.data!));
        }

        return results;
      } catch (error) {
        onError?.(error);
        return [{ error }];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Upload beberapa file satu per satu (sequential)
   * Berguna kalau ingin progress per-file atau batasi concurrent request
   */
  const uploadFilesSequentially = useCallback(
    async (
      files: File[],
      options: UploadOptions = {},
    ): Promise<UploadResult[]> => {
      const {
        bucket = "assets",
        folder,
        upsert = true,
        onSuccess,
        onError,
      } = options;
      const results: UploadResult[] = [];
      const total = files.length;

      setIsLoading(true);
      setProgress(0);

      for (let i = 0; i < total; i++) {
        setProgress(Math.round((i / total) * 100));
        const result = await uploadToSupabase(files[i], bucket, folder, upsert);
        results.push(result);
      }

      setProgress(100);
      setIsLoading(false);

      const hasErrors = results.some((r) => r.error);
      if (hasErrors) {
        onError?.(results.filter((r) => r.error));
      } else {
        onSuccess?.(results.map((r) => r.data!));
      }

      return results;
    },
    [],
  );

  const resetProgress = useCallback(() => setProgress(0), []);

  return {
    uploadFile,
    uploadFiles,
    uploadFilesSequentially,
    isLoading,
    progress,
    resetProgress,
  };
}
