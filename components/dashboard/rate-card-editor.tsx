"use client";

import { useState } from "react";
import { Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ConfirmModal } from "@/components/base/confirm-modal/confirm-modal";
import { Input } from "@/components/base/input/input";
import { useToast } from "@/components/base/toast/toast";
import {
  ApiError,
  fetchCsrf,
  profile as profileApi,
  type CreatorProfile,
} from "@/lib/api";

type Deliverable = { type: string; rate: string; notes?: string };

type RateCard = { deliverables?: Deliverable[] };

function readDeliverables(rc: CreatorProfile["rate_card"]): Deliverable[] {
  const card = rc as RateCard;
  if (!Array.isArray(card?.deliverables)) return [];
  return card.deliverables.map((d) => ({
    type: String(d?.type ?? ""),
    rate: String(d?.rate ?? ""),
    notes: d?.notes ? String(d.notes) : "",
  }));
}

export function RateCardEditor({
  creator,
  onCreatorChange,
}: {
  creator: CreatorProfile;
  onCreatorChange: (creator: CreatorProfile) => void;
}) {
  const [items, setItems] = useState<Deliverable[]>(() => readDeliverables(creator.rate_card));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const pendingItem =
    pendingRemoveIndex !== null ? items[pendingRemoveIndex] ?? null : null;

  function update(index: number, patch: Partial<Deliverable>) {
    setItems((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
    setStatus("idle");
  }

  function addRow() {
    setItems((prev) => [...prev, { type: "", rate: "", notes: "" }]);
    setStatus("idle");
  }

  function confirmRemoveRow() {
    if (pendingRemoveIndex === null) return;
    const index = pendingRemoveIndex;
    setItems((prev) => prev.filter((_, i) => i !== index));
    setStatus("idle");
    setPendingRemoveIndex(null);
  }

  async function save() {
    setBusy(true);
    try {
      await fetchCsrf();
      const cleaned = items
        .map((d) => ({ type: d.type.trim(), rate: d.rate.trim(), notes: d.notes?.trim() ?? "" }))
        .filter((d) => d.type && d.rate);
      const updated = await profileApi.update({
        rate_card: { deliverables: cleaned },
      });
      onCreatorChange(updated);
      setItems(readDeliverables(updated.rate_card));
      setStatus("saved");
      setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch (err) {
      toast({ title: "Couldn't save rates", description: extractError(err), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button color="secondary" size="sm" iconLeading={Plus} onClick={addRow}>
          Add row
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-tertiary">No rates yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((d, i) => (
            <li
              key={i}
              className="grid grid-cols-[1fr_120px_auto] items-end gap-2 rounded-xl border border-secondary p-3 sm:grid-cols-[1fr_1fr_120px_auto]"
            >
              <Input
                label={i === 0 ? "Deliverable" : undefined}
                value={d.type}
                onChange={(v) => update(i, { type: v })}
                placeholder="TikTok video (UGC)"
              />
              <Input
                label={i === 0 ? "Notes" : undefined}
                value={d.notes ?? ""}
                onChange={(v) => update(i, { notes: v })}
                placeholder="30–60s, 1 revision"
                wrapperClassName="hidden sm:block"
              />
              <Input
                label={i === 0 ? "Rate (₱)" : undefined}
                type="number"
                value={d.rate}
                onChange={(v) => update(i, { rate: v })}
                placeholder="8000"
              />
              <Button
                type="button"
                color="tertiary"
                size="sm"
                iconLeading={Trash01}
                onClick={() => setPendingRemoveIndex(i)}
                aria-label="Remove row"
              >
                {""}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <p
          className={
            status === "saved"
              ? "text-sm text-success-primary"
              : "text-sm text-tertiary"
          }
        >
          {status === "saved" ? "Saved." : " "}
        </p>
        <Button size="sm" isLoading={busy} onClick={save}>
          Save rates
        </Button>
      </div>

      <ConfirmModal
        isOpen={pendingRemoveIndex !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveIndex(null);
        }}
        title="Remove this rate?"
        description={
          pendingItem && pendingItem.type
            ? `"${pendingItem.type}" will be removed when you save rates.`
            : "This row will be removed when you save rates."
        }
        confirmLabel="Remove"
        variant="danger"
        onConfirm={confirmRemoveRow}
      />
    </div>
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
