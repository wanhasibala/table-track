"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DataForm } from "@/components/ui/data-form/data-form";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createClient();

  async function handleSubmit(data: Record<string, any>) {
    const { email, password } = data;

    const { data: signinData, error: signinError } =
      await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signinError) {
      setError(signinError.message ?? "Login failed");
      toast.error(signinError.message ?? "Login failed");
      return;
    }
    const { data: account, error: profileError } = await supabase
      .from("user_account")
      .select("tenant_id, role, name, email")
      .eq("id", signinData.user.id)
      .maybeSingle();

    setLoading(false);

    if (signinData?.user) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: signinData.user.id,
          email: account?.email || signinData.user.email,
          name: account?.name || account?.email || signinData.user.email,
          tenant_id: account?.tenant_id,
        }),
      );
      localStorage.setItem(
        "role",
        JSON.stringify({
          name: account?.role || "User",
        }),
      );
    }

    // Evaluate tenant workspace routing rules
    if (!account || !account.tenant_id) {
      toast.success("Account created! Let's set up your business.");
      router.push("/onboarding");
    } else {
      toast.success("Welcome back!");
      router.push("/d/dashboard");
    }
  }

  return (
    <div className={cn("flex min-h-screen items-center justify-center", "p-4")}>
      <div className={"flex flex-col gap-6 max-w-[400px] w-full"}>
        <Card>
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataForm
              fields={[
                { label: "Email", name: "email", type: "text" },
                { label: "Password", name: "password", type: "password" },
              ]}
              onSubmit={handleSubmit}
              submitButtonPosition="bottom"
              submitClassname="w-full"
            />
            <FieldDescription className="text-center text-sm mt-2">
              Don't have an account?{" "}
              <Link href="/auth/register" className="underline hover:text-primary">
                Register
              </Link>
            </FieldDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
