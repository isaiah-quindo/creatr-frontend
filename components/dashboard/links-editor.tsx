"use client";

import { useEffect, useState } from "react";
import { Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useToast } from "@/components/base/toast/toast";
import {
  ApiError,
  fetchCsrf,
  links as linksApi,
  type CustomLink,
  type CustomLinkInput,
} from "@/lib/api";

const EMPTY: CustomLinkInput = { title: "", url: "", icon: "" };

export function LinksEditor({
  onItemsChange,
}: {
  onItemsChange?: (items: CustomLink[]) => void;
}) {
  const [items, setItems] = useState<CustomLink[] | null>(null);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<CustomLinkInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    linksApi
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

  function startEdit(item: CustomLink) {
    setEditingId(item.id);
    setDraft({ title: item.title, url: item.url, icon: item.icon });
  }

  function cancel() {
    setEditingId(null);
  }

  async function save() {
    if (!editingId) return;
    setBusy(true);
    try {
      await fetchCsrf();
      if (editingId === "new") {
        const created = await linksApi.create(draft);
        setItems((prev) => [...(prev ?? []), created]);
      } else {
        const updated = await linksApi.update(editingId, draft);
        setItems((prev) =>
          (prev ?? []).map((s) => (s.id === updated.id ? updated : s)),
        );
      }
      setEditingId(null);
    } catch (err) {
      toast({ title: "Couldn't save link", description: extractError(err), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Remove this link?")) return;
    setBusy(true);
    try {
      await fetchCsrf();
      await linksApi.remove(id);
      setItems((prev) => (prev ?? []).filter((s) => s.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (err) {
      toast({ title: "Couldn't remove link", description: extractError(err), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {editingId !== "new" && (
        <div className="flex justify-end">
          <Button color="secondary" size="sm" iconLeading={Plus} onClick={startAdd}>
            Add link
          </Button>
        </div>
      )}

      {items === null ? (
        <p className="text-sm text-tertiary">Loading…</p>
      ) : items.length === 0 && editingId !== "new" ? (
        <p className="text-sm text-tertiary">No links yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) =>
            editingId === item.id ? (
              <li key={item.id}>
                <LinkForm
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
                className="flex items-center justify-between gap-3 rounded-xl border border-secondary px-4 py-3"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{item.title}</span>
                  <span className="truncate text-xs text-tertiary">{item.url}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button color="tertiary" size="sm" onClick={() => startEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    color="tertiary"
                    size="sm"
                    iconLeading={Trash01}
                    onClick={() => remove(item.id)}
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
        <LinkForm
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

function LinkForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  busy,
}: {
  draft: CustomLinkInput;
  setDraft: (next: CustomLinkInput) => void;
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
      <Input
        label="Title"
        value={draft.title}
        onChange={(v) => setDraft({ ...draft, title: v })}
        placeholder="My website"
      />
      <Input
        label="URL"
        value={draft.url}
        onChange={(v) => setDraft({ ...draft, url: v })}
        placeholder="https://yourlink.com"
      />
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

function extractError(err: unknown): string {
  if (err instanceof ApiError && typeof err.data === "object" && err.data) {
    const values = Object.values(err.data as Record<string, unknown>);
    const flat = values.flatMap((v) => (Array.isArray(v) ? v : [v]));
    const msg = flat.map((v) => String(v)).filter(Boolean).join(" ");
    if (msg) return msg;
  }
  return err instanceof Error ? err.message : "Couldn't save.";
}
