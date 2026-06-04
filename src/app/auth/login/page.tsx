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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signinError } = await supabase.auth.signInWithPassword(
      { email, password },
    );
    setLoading(false);

    if (signinError) {
      setError(signinError.message ?? "Login failed");
      toast.error(signinError.message ?? "Login failed");
      return;
    }
    const { data: account, error: profileError } = await supabase
      .from("user_account")
      .select("tenant_id, role")
      .eq("id", data.user.id)
      .maybeSingle();

    setLoading(false);

    // Evaluate tenant workspace routing rules
    if (!account || !account.tenant_id) {
      toast.success("Account created! Let's set up your business.");
      router.push("/onboarding");
    } else {
      toast.success("Welcome back!");
      router.push("/d/dashboard");
    }
    // on successful login, navigate to dashboard or home
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
            <form onSubmit={handleSubmit} className="w-full">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <Field>
                  <Button type="submit">Login</Button>
                  <FieldDescription className="text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <a href="/auth/register">Sign up</a>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
