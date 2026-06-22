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

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    // 1. Sign up user inside Supabase Auth with metadata
    const { data: authData, error: registerError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
          phone_number: phone.trim(),
        }
      }
    });

    if (registerError) {
      setError(registerError.message ?? "Register failed");
      toast.error(registerError.message ?? "Register failed");
      setLoading(false);
      return;
    }

    const user = authData?.user;
    const session = authData?.session;

    if (user) {
      // Direct update to user_account name column to guarantee profile name sync
      await supabase
        .from("user_account")
        .update({ name: name.trim() })
        .eq("id", user.id);

      // CASE A: Email confirmation is ON (User is not logged in yet)
      if (!session) {
        toast.success("Registration successful! Please check your inbox to confirm your email.");
        setLoading(false);
        router.push("/auth/login"); // Send them to login to wait for verification
        return;
      }

      // CASE B: Email confirmation is OFF (User is instantly logged in)
      const { data: account, error: profileError } = await supabase
        .from("user_account")
        .select("tenant_id, role, name, email")
        .eq("id", user.id)
        .maybeSingle();

      setLoading(false);

      if (user) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: user.id,
            email: account?.email || user.email,
            name: account?.name || name || user.email,
            phone_number: phone,
            tenant_id: account?.tenant_id,
          })
        );
        localStorage.setItem(
          "role",
          JSON.stringify({
            name: account?.role || "User",
          })
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
    } else {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex min-h-screen items-center justify-center", "p-4")}>
      <div className={"flex flex-col gap-6 max-w-[400px] w-full"}>
        <Card>
          <CardHeader>
            <CardTitle>Register to an account</CardTitle>
            <CardDescription>
              Enter your registration details below to create an account
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-2">
            <form onSubmit={handleSubmit} className="w-full">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">Phone Number (WhatsApp)</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. +6281234567890"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="confirmPassword">
                      Confirm Password
                    </FieldLabel>
                  </div>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </Field>
                <Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                  </Button>
                  <FieldDescription className="text-center text-sm mt-2">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="underline hover:text-primary">
                      Sign in
                    </Link>
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