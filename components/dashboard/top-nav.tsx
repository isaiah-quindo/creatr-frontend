"use client";

import Link from "next/link";
import { LogOut01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import type { User } from "@/lib/api";

export function TopNav({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const displayName =
    fullName || (user.username ? `@${user.username}` : user.email);

  return (
    <nav className="sticky top-0 z-30 border-b border-secondary bg-primary/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-6 md:px-12">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-2xl font-bold tracking-tight"
        >
          Creatr
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end leading-tight sm:flex">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-quaternary">{user.email}</span>
          </div>
          <Avatar user={user} />
          <Button
            color="secondary"
            size="sm"
            iconLeading={LogOut01}
            onClick={onLogout}
          >
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  );
}

function Avatar({ user }: { user: User }) {
  const initial = (
    user.first_name?.[0] ??
    user.username?.[0] ??
    user.email[0] ??
    "?"
  ).toUpperCase();
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt=""
        className="size-9 rounded-full border border-secondary object-cover"
      />
    );
  }
  return (
    <div className="grid size-9 place-items-center rounded-full border border-secondary bg-secondary text-sm font-semibold text-secondary">
      {initial}
    </div>
  );
}
