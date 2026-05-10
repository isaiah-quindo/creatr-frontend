"use client";

import { useState } from "react";
import { Check } from "@untitledui/icons";
import { useToast } from "@/components/base/toast/toast";
import { profile, type CreatorProfile, fetchCsrf, ApiError } from "@/lib/api";
import { THEMES, type ThemeName } from "@/lib/themes";
import { cx } from "@/utils/cx";

const THEME_LABELS: Record<ThemeName, string> = {
  clean: "Clean",
  bold: "Bold",
  warm: "Pastel",
  midnight: "Midnight",
  cover: "Cover",
  indigo: "Indigo",
  honey: "Honey",
  azure: "Azure",
};

export function ThemePicker({
  current,
  onChange,
}: {
  current: CreatorProfile["theme"];
  onChange: (theme: CreatorProfile["theme"]) => void;
}) {
  const [saving, setSaving] = useState<ThemeName | null>(null);
  const { toast } = useToast();

  async function pick(theme: ThemeName) {
    if (theme === current || saving) return;
    setSaving(theme);
    try {
      await fetchCsrf();
      const res = await profile.setTheme(theme);
      onChange(res.theme);
    } catch (err) {
      toast({
        title: "Couldn't save theme",
        description: err instanceof ApiError ? `Server returned ${err.status}.` : undefined,
        variant: "error",
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(THEMES) as ThemeName[]).map((name) => (
          <li key={name}>
            <ThemeSwatch
              name={name}
              isSelected={current === name}
              isSaving={saving === name}
              onClick={() => pick(name)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ThemeSwatch({
  name,
  isSelected,
  isSaving,
  onClick,
}: {
  name: ThemeName;
  isSelected: boolean;
  isSaving: boolean;
  onClick: () => void;
}) {
  const t = THEMES[name];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      className={cx(
        "group flex w-full flex-col items-stretch gap-2 rounded-xl border p-3 text-left transition",
        isSelected
          ? "border-brand ring-2 ring-brand/40"
          : "border-secondary hover:border-brand",
        isSaving && "cursor-progress opacity-60",
      )}
    >
      <div
        className="relative h-16 w-full overflow-hidden rounded-md"
        style={{ background: t.bg, border: `1px solid ${t.border}` }}
      >
        <span
          className="absolute left-2 top-2 inline-block h-2 w-12 rounded-full"
          style={{ background: t.accent }}
        />
        <span
          className="absolute left-2 top-6 inline-block h-1.5 w-8 rounded-full"
          style={{ background: t.textSecondary }}
        />
        <span
          className="absolute bottom-2 right-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ background: t.pillBg, color: t.pillText }}
        >
          tag
        </span>
        {isSelected && (
          <span
            className="absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded-full"
            style={{ background: t.accent, color: t.accentText }}
          >
            <Check className="size-3" />
          </span>
        )}
      </div>
      <span className="text-sm font-medium">{THEME_LABELS[name]}</span>
    </button>
  );
}
