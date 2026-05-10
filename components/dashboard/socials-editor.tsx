"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { useToast } from "@/components/base/toast/toast";
import {
  ApiError,
  fetchCsrf,
  socials as socialsApi,
  type SocialAccount,
  type SocialAccountInput,
  type SocialPlatform,
} from "@/lib/api";

const PLATFORMS: Array<{ value: SocialPlatform; label: string }> = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
];

function buildProfileUrl(platform: SocialPlatform, rawHandle: string): string {
  const handle = rawHandle.trim().replace(/^@/, "");
  if (!handle) return "";
  switch (platform) {
    case "tiktok":
      return `https://www.tiktok.com/@${handle}`;
    case "instagram":
      return `https://www.instagram.com/${handle}/`;
    case "youtube":
      return `https://www.youtube.com/@${handle}`;
    case "facebook":
      return `https://www.facebook.com/${handle}`;
  }
}

const EMPTY: SocialAccountInput = {
  platform: "tiktok",
  handle: "",
  profile_url: "",
  followers: 0,
  avg_views: 0,
  engagement_rate: "0",
};

export function SocialsEditor({
  onItemsChange,
}: {
  onItemsChange?: (items: SocialAccount[]) => void;
}) {
  const [items, setItems] = useState<SocialAccount[] | null>(null);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<SocialAccountInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    socialsApi
      .list()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (items !== null) onItemsChange?.(items);
  }, [items, onItemsChange]);

  function startAdd() {
    setEditingId("new");
    setDraft(EMPTY);
  }

  function startEdit(item: SocialAccount) {
    setEditingId(item.id);
    setDraft({
      platform: item.platform,
      handle: item.handle,
      profile_url: item.profile_url,
      followers: item.followers,
      avg_views: item.avg_views,
      engagement_rate: item.engagement_rate,
    });
  }

  function cancel() {
    setEditingId(null);
  }

  async function save() {
    if (!editingId) return;
    const payload: SocialAccountInput = {
      ...draft,
      handle: draft.handle.trim().replace(/^@/, ""),
      profile_url: buildProfileUrl(draft.platform, draft.handle),
    };
    setBusy(true);
    try {
      await fetchCsrf();
      if (editingId === "new") {
        const created = await socialsApi.create(payload);
        setItems((prev) => [...(prev ?? []), created]);
      } else {
        const updated = await socialsApi.update(editingId, payload);
        setItems((prev) =>
          (prev ?? []).map((s) => (s.id === updated.id ? updated : s)),
        );
      }
      setEditingId(null);
    } catch (err) {
      toast({ title: "Couldn't save social", description: extractError(err), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Remove this social account?")) return;
    setBusy(true);
    try {
      await fetchCsrf();
      await socialsApi.remove(id);
      setItems((prev) => (prev ?? []).filter((s) => s.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (err) {
      toast({ title: "Couldn't remove social", description: extractError(err), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function move(id: number, dir: "up" | "down") {
    if (busy || items === null) return;
    const idx = items.findIndex((i) => i.id === id);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swap < 0 || swap >= items.length) return;
    const reordered = [...items];
    [reordered[idx], reordered[swap]] = [reordered[swap], reordered[idx]];
    const previous = items;
    setItems(reordered);
    setBusy(true);
    try {
      await fetchCsrf();
      const persisted = await socialsApi.reorder(reordered.map((i) => i.id));
      setItems(persisted);
    } catch (err) {
      setItems(previous);
      toast({ title: "Couldn't reorder", description: extractError(err), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {editingId !== "new" && (
        <div className="flex justify-end">
          <Button color="secondary" size="sm" iconLeading={Plus} onClick={startAdd}>
            Add social
          </Button>
        </div>
      )}

      {items === null ? (
        <p className="text-sm text-tertiary">Loading…</p>
      ) : items.length === 0 && editingId !== "new" ? (
        <p className="text-sm text-tertiary">No socials yet — add one to get started.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, idx) =>
            editingId === item.id ? (
              <li key={item.id}>
                <SocialForm
                  draft={draft}
                  setDraft={setDraft}
                  onSave={save}
                  onCancel={cancel}
                  busy={busy}
                />
              </li>
            ) : (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-secondary px-4 py-3"
              >
                <div className="flex flex-col">
                  <Button
                    color="tertiary"
                    size="sm"
                    iconLeading={ChevronUp}
                    isDisabled={busy || idx === 0}
                    onClick={() => move(item.id, "up")}
                    aria-label="Move up"
                  >
                    {""}
                  </Button>
                  <Button
                    color="tertiary"
                    size="sm"
                    iconLeading={ChevronDown}
                    isDisabled={busy || idx === items.length - 1}
                    onClick={() => move(item.id, "down")}
                    aria-label="Move down"
                  >
                    {""}
                  </Button>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-xs uppercase tracking-wide text-tertiary">
                    {labelOf(item.platform)}
                  </span>
                  <span className="truncate text-sm font-medium">@{item.handle}</span>
                  <span className="text-xs text-tertiary">
                    {formatCount(item.followers)} followers ·{" "}
                    {formatCount(item.avg_views)} avg views
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button color="tertiary" size="sm" onClick={() => startEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    color="tertiary"
                    size="sm"
                    iconLeading={Trash01}
                    isDisabled={busy}
                    onClick={() => remove(item.id)}
                    aria-label="Remove"
                  >
                    {""}
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {editingId === "new" && (
        <SocialForm
          draft={draft}
          setDraft={setDraft}
          onSave={save}
          onCancel={cancel}
          busy={busy}
        />
      )}
    </div>
  );
}

function SocialForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  busy,
}: {
  draft: SocialAccountInput;
  setDraft: (next: SocialAccountInput) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className="flex flex-col gap-3 rounded-xl border border-secondary bg-secondary/30 p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <Select<SocialPlatform>
          label="Platform"
          items={PLATFORMS}
          value={draft.platform}
          onChange={(v) => setDraft({ ...draft, platform: v })}
        />
        <Input
          label="Handle"
          value={draft.handle}
          onChange={(v) => setDraft({ ...draft, handle: v.replace(/^@/, "") })}
          placeholder="yourhandle"
          hint={
            draft.handle
              ? `Public URL: ${buildProfileUrl(draft.platform, draft.handle)}`
              : "We'll build the profile URL from this."
          }
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Followers"
          type="number"
          value={String(draft.followers ?? 0)}
          onChange={(v) => setDraft({ ...draft, followers: clamp(parseInt(v) || 0) })}
        />
        <Input
          label="Avg views"
          type="number"
          value={String(draft.avg_views ?? 0)}
          onChange={(v) => setDraft({ ...draft, avg_views: clamp(parseInt(v) || 0) })}
        />
        <Input
          label="Engagement %"
          type="number"
          value={String(draft.engagement_rate ?? "0")}
          onChange={(v) => setDraft({ ...draft, engagement_rate: v })}
          hint="0–100"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" color="tertiary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" isLoading={busy}>
          Save
        </Button>
      </div>
    </form>
  );
}

function labelOf(p: SocialPlatform): string {
  return PLATFORMS.find((x) => x.value === p)?.label ?? p;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function clamp(n: number): number {
  return Math.max(0, n);
}

function extractError(err: unknown): string {
  if (err instanceof ApiError && typeof err.data === "object" && err.data) {
    const values = Object.values(err.data as Record<string, unknown>);
    const flat = values.flatMap((v) => (Array.isArray(v) ? v : [v]));
    const msg = flat.map((v) => String(v)).filter(Boolean).join(" ");
    if (msg) return msg;
  }
  return err instanceof Error ? err.message : "Couldn't save.";
}
