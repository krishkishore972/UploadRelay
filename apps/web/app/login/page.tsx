"use client";

import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ds } from "@/lib/design-system";
import { AuthShell } from "@/components/auth/auth-shell";

 function LoginForm() {
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

    router.push(searchParams.get("callbackUrl") ?? "/upload");
    router.refresh();
  }

  return (
    <AuthShell>
      <section className="w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Sign in to continue to your UploadRelay workspace.
        </p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-neutral-900">
            Email
            <input
              name="email"
              type="email"
              required
              placeholder="you@studio.com"
              className={`${ds.input} mt-2`}
            />
          </label>
          <label className="block text-sm font-medium text-neutral-900">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className={`${ds.input} mt-2`}
            />
          </label>
          {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${ds.primaryButton} w-full disabled:opacity-60`}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-5 text-sm text-neutral-600">
          Need an account?{" "}
          <Link href="/signup" className="font-semibold text-neutral-900 underline-offset-2 hover:underline">
            Sign up
          </Link>
        </p>
      </section>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
