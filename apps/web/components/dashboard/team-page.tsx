"use client";

import { useCallback, useEffect, useState } from "react";

import { goApi } from "@/lib/go-api";
import { formatDate, initials } from "@/lib/dashboard/format";
import type { GetLinksResponse, LinkedCreator } from "@/lib/dashboard/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreatorInviteCard } from "./creator-invite-card";
import { LinkCreator } from "./link-creator";

export function TeamPage() {
  const [isCreator, setIsCreator] = useState(false);
  const [people, setPeople] = useState<LinkedCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = sessionRes.ok ? await sessionRes.json() : null;
      const creator = session?.user?.role === "CREATOR";
      setIsCreator(creator);

      const response = await goApi.get<GetLinksResponse>("/links");
      setPeople(
        creator
          ? (response.data.editors ?? [])
          : (response.data.creators ?? []),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="space-y-6">
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
          {isCreator ? "Creator Portal" : "Studio Portal"}
        </p>
        <h1 className="headline-display mt-2 text-3xl font-bold text-neutral-950 md:text-4xl">
          {isCreator ? "Invite editor" : "Link creator"}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
          {isCreator
            ? "Share your invite code so editors can stage masters for your channel."
            : "Paste a creator invite code to upload masters into their review queue."}
        </p>
      </section>

      {isCreator ? <CreatorInviteCard /> : <LinkCreator onLinked={load} />}

      <Card>
        <CardHeader>
          <CardTitle>{isCreator ? "Linked editors" : "Linked creators"}</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading…"
              : people.length === 0
                ? isCreator
                  ? "No editors linked yet."
                  : "No creators linked yet."
                : `${people.length} connected`}
          </CardDescription>
        </CardHeader>
        {people.length > 0 ? (
          <CardContent className="space-y-3 pt-0">
            {people.map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200/70 bg-neutral-50 px-3 py-2.5"
              >
                <Avatar>
                  <AvatarFallback>
                    {initials(person.name, person.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-950">
                    {person.name || person.email}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {person.email}
                  </p>
                </div>
                <p className="ml-auto shrink-0 font-mono text-[11px] text-neutral-400">
                  {formatDate(person.linkedAt)}
                </p>
              </div>
            ))}
          </CardContent>
        ) : null}
      </Card>
    </main>
  );
}
