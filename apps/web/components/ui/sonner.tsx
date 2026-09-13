"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-neutral-200 bg-white text-neutral-950 shadow-lg",
        },
      }}
    />
  );
}
