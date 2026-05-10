"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { useToast } from "@/components/base/toast/toast";
import { SocialIcon } from "@/components/public-profile/social-icons";
import {
  ApiError,
  embed as embedApi,
  fetchCsrf,
  portfolio as portfolioApi,
  type EmbedPreview,
  type PortfolioItem,
} from "@/lib/api";

export function PortfolioEditor({
  onItemsChange,
}: {
  onItemsChange?: (items: PortfolioItem[]) => void;
}) {
  const [items, setItems] = useState<PortfolioItem[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    portfolioApi
      .list()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (items !== null) onItemsChange?.(items);
  }, [items, onItemsChange]);

  async function remove(id: number) {
    if (!confirm("Remove this portfolio item?")) return;
    setBusy(true);
    try {
      await fetchCsrf();
      await portfolioApi.remove(id);
      setItems((prev) => (prev ?? []).filter((s) => s.id !== id));
    } catch (err) {
      toast({ title: "Couldn't remove video", description: extractError(err), variant: "error" });
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
      const persisted = await portfolioApi.reorder(reordered.map((i) => i.id));
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
      {!adding && (
        <div className="flex justify-end">
          <Button
            color="secondary"
            size="sm"
            iconLeading={Plus}
            onClick={() => setAdding(true)}
          >
            Add video
          </Button>
        </div>
      )}

      {items === null ? (
        <p className="text-sm text-tertiary">Loading…</p>
      ) : items.length === 0 && !adding ? (
        <p className="text-sm text-tertiary">No samples yet — add a video to get started.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, idx) =>
            editingId === item.id ? (
              <li key={item.id}>
                <EditItemForm
                  item={item}
                  onCancel={() => setEditingId(null)}
                  onSaved={(updated) => {
                    setItems((prev) =>
                      (prev ?? []).map((p) => (p.id === updated.id ? updated : p)),
                    );
                    setEditingId(null);
                  }}
                />
              </li>
            ) : (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-secondary p-3"
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
                <Thumb src={item.thumbnail_url} platform={item.platform_source} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-xs uppercase tracking-wide text-tertiary">
                    {item.platform_source || item.media_type}
                  </span>
                  <span className="truncate text-sm font-medium">{item.title}</span>
                  {item.description && (
                    <span className="truncate text-xs text-tertiary">{item.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    color="tertiary"
                    size="sm"
                    onClick={() => setEditingId(item.id)}
                  >
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

      {adding && (
        <AddVideoForm
          onCancel={() => setAdding(false)}
          onCreated={(created) => {
            setItems((prev) => [...(prev ?? []), created]);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

function AddVideoForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (item: PortfolioItem) => void;
}) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<EmbedPreview | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function fetchPreview() {
    if (!url) return;
    setPreviewing(true);
    try {
      await fetchCsrf();
      const result = await embedApi.preview(url);
      setPreview(result);
      setTitle(result.video_title || "");
    } catch (err) {
      toast({ title: "Couldn't fetch preview", description: extractError(err), variant: "error" });
    } finally {
      setPreviewing(false);
    }
  }

  async function save() {
    if (!preview) return;
    setSaving(true);
    try {
      await fetchCsrf();
      const created = await portfolioApi.create({
        title: title || preview.video_title || preview.original_url,
        description,
        media_type: "video_embed",
        original_url: preview.original_url,
      });
      onCreated(created);
    } catch (err) {
      toast({ title: "Couldn't save video", description: extractError(err), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!preview) fetchPreview();
        else save();
      }}
      className="flex flex-col gap-3 rounded-xl border border-secondary bg-secondary/30 p-4"
    >
      <Input
        label="Video URL"
        value={url}
        onChange={(v) => {
          setUrl(v);
          setPreview(null);
        }}
        placeholder="https://www.tiktok.com/@you/video/..."
        hint="TikTok, YouTube, or Instagram link."
      />

      {preview && (
        <div className="flex gap-3 rounded-lg border border-secondary bg-primary p-3">
          <Thumb src={preview.thumbnail_url} platform={preview.platform} />
          <div className="flex min-w-0 flex-col">
            <span className="text-xs uppercase tracking-wide text-tertiary">
              {preview.platform}
            </span>
            <span className="truncate text-sm font-medium">
              {preview.video_title || "Untitled video"}
            </span>
          </div>
        </div>
      )}

      {preview && (
        <>
          <Input
            label="Title"
            value={title}
            onChange={setTitle}
            placeholder="Override the auto-detected title"
          />
          <div className="flex flex-col gap-1.5">
            <Label>Description (optional)</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="A note for brands."
              className="w-full rounded-lg bg-primary px-3 py-2 text-md shadow-xs ring-1 ring-primary ring-inset focus:ring-2 focus:ring-brand"
            />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" color="tertiary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        {preview ? (
          <Button type="submit" size="sm" isLoading={saving}>
            Save
          </Button>
        ) : (
          <Button type="submit" size="sm" isLoading={previewing} isDisabled={!url}>
            Fetch preview
          </Button>
        )}
      </div>
    </form>
  );
}

function EditItemForm({
  item,
  onCancel,
  onSaved,
}: {
  item: PortfolioItem;
  onCancel: () => void;
  onSaved: (updated: PortfolioItem) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function save() {
    setBusy(true);
    try {
      await fetchCsrf();
      const updated = await portfolioApi.update(item.id, { title, description });
      onSaved(updated);
    } catch (err) {
      toast({ title: "Couldn't save video", description: extractError(err), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-3 rounded-xl border border-secondary bg-secondary/30 p-4"
    >
      <div className="flex gap-3">
        <Thumb src={item.thumbnail_url} platform={item.platform_source} />
        <div className="flex min-w-0 flex-col">
          <span className="text-xs uppercase tracking-wide text-tertiary">
            {item.platform_source || item.media_type}
          </span>
          <span className="truncate text-xs text-tertiary">{item.original_url}</span>
        </div>
      </div>
      <Input label="Title" value={title} onChange={setTitle} />
      <div className="flex flex-col gap-1.5">
        <Label>Description</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg bg-primary px-3 py-2 text-md shadow-xs ring-1 ring-primary ring-inset focus:ring-2 focus:ring-brand"
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

function Thumb({ src, platform }: { src: string; platform?: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="size-14 shrink-0 rounded-lg border border-secondary object-cover"
      />
    );
  }
  if (platform === "instagram") {
    return (
      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-secondary bg-[linear-gradient(135deg,#F58529_0%,#DD2A7B_50%,#515BD4_100%)] text-white">
        <SocialIcon platform="instagram" className="size-6" />
      </div>
    );
  }
  return (
    <div className="size-14 shrink-0 rounded-lg border border-secondary bg-secondary" />
  );
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
