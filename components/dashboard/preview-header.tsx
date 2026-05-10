"use client";

import { useState } from "react";
import { Check, Copy01, LinkExternal01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Toggle } from "@/components/base/toggle/toggle";
import { useToast } from "@/components/base/toast/toast";
import {
  ApiError,
  fetchCsrf,
  profile as profileApi,
  type CreatorProfile,
  type User,
} from "@/lib/api";

export function PreviewHeader({
  user,
  creator,
  onCreatorChange,
}: {
  user: User;
  creator: CreatorProfile;
  onCreatorChange: (creator: CreatorProfile) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const hasHandle = Boolean(user.username);
  const publicUrl = hasHandle
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/@${user.username}`
    : "";
  const displayUrl = hasHandle
    ? publicUrl.replace(/^https?:\/\//, "")
    : "Set a handle to get a public URL";

  async function onTogglePublic(next: boolean) {
    if (next && !hasHandle) {
      toast({
        title: "Set a handle first",
        description: "You need a handle before you can publish your page.",
        variant: "error",
      });
      return;
    }
    setSaving(true);
    const previous = creator.is_public;
    onCreatorChange({ ...creator, is_public: next });
    try {
      await fetchCsrf();
      const updated = await profileApi.update({ is_public: next });
      onCreatorChange(updated);
    } catch (err) {
      onCreatorChange({ ...creator, is_public: previous });
      toast({
        title: "Couldn't update",
        description: extractError(err),
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function onCopy() {
    if (!hasHandle) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Some browsers block clipboard without a secure context — silently no-op.
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-secondary bg-primary p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-secondary px-3 py-2">
          <span
            className={
              hasHandle
                ? "truncate font-mono text-sm"
                : "truncate font-mono text-sm text-tertiary"
            }
          >
            {displayUrl}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            color="secondary"
            size="sm"
            iconLeading={copied ? Check : Copy01}
            isDisabled={!hasHandle}
            onClick={onCopy}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            type="button"
            color="tertiary"
            size="sm"
            iconLeading={LinkExternal01}
            isDisabled={!hasHandle || !creator.is_public}
            href={hasHandle ? publicUrl : undefined}
            target="_blank"
            rel="noreferrer"
          >
            Open
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex flex-col">
          <Toggle
            isSelected={creator.is_public}
            isDisabled={saving}
            onChange={onTogglePublic}
          >
            <span className="font-medium">
              {creator.is_public ? "Public" : "Private"}
            </span>
          </Toggle>
          <p className="text-xs text-tertiary mt-2">
            {creator.is_public
              ? "Anyone with the link can view your profile."
              : "Only you can see this page until you publish."}
          </p>
        </div>
      </div>
    </div>
  );
}

function extractError(err: unknown): string {
  if (err instanceof ApiError && typeof err.data === "object" && err.data) {
    const values = Object.values(err.data as Record<string, unknown>);
    const flat = values.flatMap((v) => (Array.isArray(v) ? v : [v]));
    const msg = flat
      .map((v) => String(v))
      .filter(Boolean)
      .join(" ");
    if (msg) return msg;
  }
  return err instanceof Error ? err.message : "Couldn't update.";
}
