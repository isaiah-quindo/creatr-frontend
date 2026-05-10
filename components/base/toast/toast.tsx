"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  InfoCircle,
  XClose,
} from "@untitledui/icons";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx, sortCx } from "@/utils/cx";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  /**
   * The main message line. Shown bold.
   */
  title: string;
  /**
   * Optional supporting text shown under the title.
   */
  description?: ReactNode;
  /**
   * Visual variant — drives the icon and accent color.
   *
   * @default "info"
   */
  variant?: ToastVariant;
  /**
   * How long the toast stays on screen, in milliseconds.
   *
   * @default 3000
   */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "description">> {
  id: number;
  description?: ReactNode;
}

interface ToastContextValue {
  /**
   * Push a toast onto the queue.
   */
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles = sortCx({
  success: {
    bg: "bg-utility-green-50",
    border: "border-utility-green-200",
    text: "text-utility-green-700",
    iconBg: "bg-utility-green-100",
    iconFg: "text-utility-green-700",
  },
  error: {
    bg: "bg-utility-red-50",
    border: "border-utility-red-200",
    text: "text-utility-red-700",
    iconBg: "bg-utility-red-100",
    iconFg: "text-utility-red-700",
  },
  warning: {
    bg: "bg-utility-yellow-50",
    border: "border-utility-yellow-200",
    text: "text-utility-yellow-700",
    iconBg: "bg-utility-yellow-100",
    iconFg: "text-utility-yellow-700",
  },
  info: {
    bg: "bg-utility-blue-50",
    border: "border-utility-blue-200",
    text: "text-utility-blue-700",
    iconBg: "bg-utility-blue-100",
    iconFg: "text-utility-blue-700",
  },
});

const variantIcon: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: InfoCircle,
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      variant = "info",
      duration = 3000,
    }: ToastOptions) => {
      const id = ++counter.current;
      setItems((prev) => [
        ...prev,
        { id, title, description, variant, duration },
      ]);
    },
    [],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {items.map((item) => (
          <Toast key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
};

interface ToastProps {
  item: ToastItem;
  onDismiss: () => void;
}

const Toast = ({ item, onDismiss }: ToastProps) => {
  const Icon = variantIcon[item.variant];
  const styles = variantStyles[item.variant];
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setIsVisible(true));
    const exit = window.setTimeout(() => setIsVisible(false), item.duration);
    const remove = window.setTimeout(onDismiss, item.duration + 200);
    return () => {
      cancelAnimationFrame(enter);
      window.clearTimeout(exit);
      window.clearTimeout(remove);
    };
  }, [item.duration, onDismiss]);

  return (
    <div
      role="status"
      data-variant={item.variant}
      className={cx(
        "pointer-events-auto flex w-full max-w-sm gap-3 rounded-xl border p-3 shadow-lg",
        styles.bg,
        styles.border,
        "transition duration-200 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
      )}
    >
      <span
        className={cx(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          styles.iconBg,
        )}
      >
        <Icon className={cx("size-5", styles.iconFg)} aria-hidden="true" />
      </span>

      <div className="flex flex-1 flex-col gap-0.5 pt-1">
        <p className={cx("text-sm font-semibold", styles.text)}>{item.title}</p>
        {item.description && (
          <p className={cx("text-sm opacity-90", styles.text)}>{item.description}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className={cx(
          "-m-1 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md outline-brand transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2",
          styles.text,
          "opacity-70",
        )}
      >
        <XClose className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
};
