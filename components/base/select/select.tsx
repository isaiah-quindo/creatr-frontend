"use client";

import type { ReactNode } from "react";
import { Check, ChevronDown } from "@untitledui/icons";
import {
  Button as AriaButton,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  Popover as AriaPopover,
  Select as AriaSelect,
  SelectValue as AriaSelectValue,
  type SelectProps as AriaSelectProps,
  type Key,
} from "react-aria-components";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { cx } from "@/utils/cx";

export type SelectOption<V extends Key = string> = {
  value: V;
  label: string;
  description?: string;
};

interface SelectFieldProps<V extends Key>
  extends Omit<
    AriaSelectProps<object>,
    "children" | "selectedKey" | "onSelectionChange" | "onChange" | "className"
  > {
  label?: string;
  hint?: ReactNode;
  placeholder?: string;
  items: ReadonlyArray<SelectOption<V>>;
  value: V;
  onChange: (value: V) => void;
  className?: string;
}

export function Select<V extends Key = string>({
  label,
  hint,
  placeholder,
  items,
  value,
  onChange,
  isDisabled,
  isInvalid,
  className,
  ...rest
}: SelectFieldProps<V>) {
  return (
    <AriaSelect
      {...rest}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as V)}
      className={cx("group flex flex-col gap-1.5", className)}
    >
      {label && <Label>{label}</Label>}

      <AriaButton
        className={({ isFocusVisible, isDisabled: btnDisabled }) =>
          cx(
            "flex w-full items-center justify-between gap-2 rounded-lg bg-primary px-3 py-2 text-md text-primary shadow-xs ring-1 ring-primary ring-inset transition-shadow",
            "outline-hidden",
            isFocusVisible && "ring-2 ring-brand",
            btnDisabled && "cursor-not-allowed opacity-50",
            isInvalid && "ring-error_subtle",
          )
        }
      >
        <AriaSelectValue className="truncate text-left data-placeholder:text-placeholder">
          {({ defaultChildren, isPlaceholder }) =>
            isPlaceholder ? placeholder ?? "Select…" : defaultChildren
          }
        </AriaSelectValue>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-tertiary transition-transform duration-150 group-data-open:rotate-180"
        />
      </AriaButton>

      {hint && <HintText>{hint}</HintText>}

      <AriaPopover
        className={cx(
          "w-(--trigger-width) overflow-auto rounded-lg border border-secondary bg-primary shadow-lg",
          "entering:animate-in entering:fade-in entering:zoom-in-95",
          "exiting:animate-out exiting:fade-out exiting:zoom-out-95",
        )}
        offset={4}
      >
        <AriaListBox className="max-h-72 outline-hidden">
          {items.map((item) => (
            <AriaListBoxItem
              key={String(item.value)}
              id={item.value}
              textValue={item.label}
              className={({ isFocused, isSelected, isDisabled: itemDisabled }) =>
                cx(
                  "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-md outline-hidden",
                  isFocused && "bg-secondary",
                  isSelected && "font-medium",
                  itemDisabled && "cursor-not-allowed opacity-50",
                )
              }
            >
              {({ isSelected }) => (
                <>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{item.label}</span>
                    {item.description && (
                      <span className="truncate text-xs text-tertiary">
                        {item.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check aria-hidden className="size-4 shrink-0 text-brand-secondary" />
                  )}
                </>
              )}
            </AriaListBoxItem>
          ))}
        </AriaListBox>
      </AriaPopover>
    </AriaSelect>
  );
}
