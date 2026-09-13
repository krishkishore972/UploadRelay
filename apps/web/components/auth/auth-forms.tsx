"use client";

import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ds } from "@/lib/design-system";

function LoginFormInner({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push(searchParams.get("callbackUrl") ?? "/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md rounded-3xl p-1 sm:p-2">
      <CardHeader className="px-6 pt-6 sm:px-8 sm:pt-8">
        <CardTitle className="text-3xl font-bold tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription className="text-sm">
          Sign in to continue to your UploadRelay workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Label className="block">
            Email
            <Input
              name="email"
              type="email"
              required
              placeholder="you@studio.com"
              className="mt-2"
            />
          </Label>
          <Label className="block">
            Password
            <Input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="mt-2"
            />
          </Label>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-5 text-sm text-neutral-600">
          Need an account?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-semibold text-neutral-900 underline-offset-2 hover:underline"
          >
            Sign up
          </button>
        </p>
      </CardContent>
    </Card>
  );
}

export function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  return (
    <Suspense fallback={null}>
      <LoginFormInner onSwitch={onSwitch} />
    </Suspense>
  );
}

export function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "CREATOR");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Could not create account");
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      router.push("/auth");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md rounded-3xl p-1 sm:p-2">
      <CardHeader className="px-6 pt-6 sm:px-8 sm:pt-8">
        <CardTitle className="text-3xl font-bold tracking-tight">
          Create your account
        </CardTitle>
        <CardDescription className="text-sm">
          Join UploadRelay and start handing off master cuts.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Label className="block">
            Name
            <Input
              name="name"
              type="text"
              required
              minLength={2}
              placeholder="Alex Rivera"
              className="mt-2"
            />
          </Label>
          <Label className="block">
            Email
            <Input
              name="email"
              type="email"
              required
              placeholder="you@studio.com"
              className="mt-2"
            />
          </Label>
          <Label className="block">
            Password
            <Input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="mt-2"
            />
          </Label>
          <Label className="block">
            Role
            <select
              name="role"
              defaultValue="CREATOR"
              className={`${ds.input} mt-2`}
            >
              <option value="CREATOR">Creator</option>
              <option value="EDITOR">Editor</option>
            </select>
          </Label>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="mt-5 text-sm text-neutral-600">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-semibold text-neutral-900 underline-offset-2 hover:underline"
          >
            Sign in
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
