"use client";

import type { ReactNode } from "react";
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from "react-aria-components";
import { cx } from "@/utils/cx";

interface ToggleProps extends Omit<AriaSwitchProps, "children"> {
    children?: ReactNode;
}

export function Toggle({ className, children, ...props }: ToggleProps) {
    return (
        <AriaSwitch
            {...props}
            className={(values) =>
                cx(
                    "group flex cursor-pointer items-center gap-2 text-sm",
                    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
                    typeof className === "function" ? className(values) : className,
                )
            }
        >
            <div
                className={cx(
                    "relative h-5 w-9 shrink-0 rounded-full bg-tertiary transition-colors duration-150",
                    "group-data-selected:bg-brand-solid",
                    "outline-brand group-data-focus-visible:outline-2 group-data-focus-visible:outline-offset-2",
                )}
            >
                <span
                    className={cx(
                        "absolute left-0.5 top-0.5 size-4 rounded-full bg-primary shadow-sm transition-transform duration-150",
                        "group-data-selected:translate-x-4",
                    )}
                />
            </div>
            {children && <span className="select-none">{children}</span>}
        </AriaSwitch>
    );
}
