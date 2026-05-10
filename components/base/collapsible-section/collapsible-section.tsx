"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "@untitledui/icons";

export function CollapsibleSection({
  title,
  description,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group anim-details rounded-2xl border border-secondary bg-primary shadow-md"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            {typeof count === "number" && (
              <span className="rounded-full border border-secondary bg-secondary px-2 py-0.5 text-xs font-medium text-quaternary">
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-quaternary">{description}</p>
          )}
        </div>
        <ChevronDown className="size-5 shrink-0 text-quaternary transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-secondary px-6 py-5">{children}</div>
    </details>
  );
}
