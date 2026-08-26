"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
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
      router.push("/login");
      return;
    }

    router.push("/upload");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background-50 px-5 py-12 text-text-950">
      <section className="w-full max-w-md rounded-lg border border-background-200 bg-background-100 p-6 shadow-xl shadow-primary-50/10">
        <Link href="/" className="text-sm font-semibold text-primary-800">
          UploadRelay
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Sign up</h1>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Name
            <input
              name="name"
              type="text"
              required
              minLength={2}
              className="mt-2 h-11 w-full rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-2 h-11 w-full rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-2 h-11 w-full rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
            />
          </label>
          <label className="block text-sm font-medium">
            Role
            <select
              name="role"
              defaultValue="CREATOR"
              className="mt-2 h-11 w-full rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
            >
              <option value="CREATOR">Creator</option>
              <option value="EDITOR">Editor</option>
            </select>
          </label>
          {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-md bg-primary-700 px-4 text-sm font-semibold text-text-50 transition hover:bg-primary-800 disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-5 text-sm text-text-800">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary-800">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
