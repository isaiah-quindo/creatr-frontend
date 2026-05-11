"use client";

import { useEffect, useState } from "react";
import { Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ConfirmModal } from "@/components/base/confirm-modal/confirm-modal";
import { Input } from "@/components/base/input/input";
import { useToast } from "@/components/base/toast/toast";
import {
  ApiError,
  fetchCsrf,
  links as linksApi,
  parseFieldErrors,
  type CustomLink,
  type CustomLinkInput,
} from "@/lib/api";

const EMPTY: CustomLinkInput = { title: "", url: "", icon: "" };
const LINK_FIELDS = ["title", "url", "icon", "sort_order"] as const;
type LinkFieldErrors = Partial<Record<(typeof LINK_FIELDS)[number], string>>;

export function LinksEditor({
  onItemsChange,
}: {
  onItemsChange?: (items: CustomLink[]) => void;
}) {
  const [items, setItems] = useState<CustomLink[] | null>(null);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<CustomLinkInput>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<LinkFieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const { toast } = useToast();

  const pendingItem =
    pendingRemoveId !== null
      ? (items ?? []).find((s) => s.id === pendingRemoveId) ?? null
      : null;

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
    setFieldErrors({});
  }

  function startEdit(item: CustomLink) {
    setEditingId(item.id);
    setDraft({ title: item.title, url: item.url, icon: item.icon });
    setFieldErrors({});
  }

  function cancel() {
    setEditingId(null);
    setFieldErrors({});
  }

  function updateDraft(patch: Partial<CustomLinkInput>) {
    setDraft({ ...draft, ...patch });
    if (Object.keys(fieldErrors).length === 0) return;
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(patch) as Array<keyof CustomLinkInput>) {
        if (k in next) delete next[k as keyof LinkFieldErrors];
      }
      return next;
    });
  }

  async function save() {
    if (!editingId) return;
    setBusy(true);
    setFieldErrors({});
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
      const parsed = parseFieldErrors(err, LINK_FIELDS);
      if (parsed && Object.keys(parsed.fields).length > 0) {
        setFieldErrors(parsed.fields);
        if (parsed.stray) {
          toast({ title: "Couldn't save link", description: parsed.stray, variant: "error" });
        }
      } else {
        toast({ title: "Couldn't save link", description: extractError(err), variant: "error" });
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (pendingRemoveId === null) return;
    const id = pendingRemoveId;
    setRemoving(true);
    try {
      await fetchCsrf();
      await linksApi.remove(id);
      setItems((prev) => (prev ?? []).filter((s) => s.id !== id));
      if (editingId === id) setEditingId(null);
      setPendingRemoveId(null);
    } catch (err) {
      toast({ title: "Couldn't remove link", description: extractError(err), variant: "error" });
    } finally {
      setRemoving(false);
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
                  updateDraft={updateDraft}
                  errors={fieldErrors}
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
                    onClick={() => setPendingRemoveId(item.id)}
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
        <LinkForm
          draft={draft}
          updateDraft={updateDraft}
          errors={fieldErrors}
          onSave={save}
          onCancel={cancel}
          busy={busy}
        />
      )}

      <ConfirmModal
        isOpen={pendingRemoveId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveId(null);
        }}
        title="Remove this link?"
        description={
          pendingItem
            ? `"${pendingItem.title}" will be removed from your profile.`
            : "This link will be removed from your profile."
        }
        confirmLabel="Remove"
        variant="danger"
        isConfirming={removing}
        onConfirm={confirmRemove}
      />
    </div>
  );
}

function LinkForm({
  draft,
  updateDraft,
  errors,
  onSave,
  onCancel,
  busy,
}: {
  draft: CustomLinkInput;
  updateDraft: (patch: Partial<CustomLinkInput>) => void;
  errors: LinkFieldErrors;
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
        onChange={(v) => updateDraft({ title: v })}
        placeholder="My website"
        isInvalid={!!errors.title}
        hint={errors.title}
      />
      <Input
        label="URL"
        value={draft.url}
        onChange={(v) => updateDraft({ url: v })}
        placeholder="https://yourlink.com"
        isInvalid={!!errors.url}
        hint={errors.url}
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
