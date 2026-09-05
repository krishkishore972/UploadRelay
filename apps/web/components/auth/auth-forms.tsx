"use client";

import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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

    router.push(searchParams.get("callbackUrl") ?? "/upload");
    router.refresh();
  }

  return (
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
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold text-neutral-900 underline-offset-2 hover:underline"
        >
          Sign up
        </button>
      </p>
    </section>
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

    router.push("/upload");
    router.refresh();
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-neutral-600">
        Join UploadRelay and start handing off master cuts.
      </p>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-neutral-900">
          Name
          <input
            name="name"
            type="text"
            required
            minLength={2}
            placeholder="Alex Rivera"
            className={`${ds.input} mt-2`}
          />
        </label>
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
        <label className="block text-sm font-medium text-neutral-900">
          Role
          <select name="role" defaultValue="CREATOR" className={`${ds.input} mt-2`}>
            <option value="CREATOR">Creator</option>
            <option value="EDITOR">Editor</option>
          </select>
        </label>
        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${ds.primaryButton} w-full disabled:opacity-60`}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
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
    </section>
  );
}