"use client";

import { type ReactNode } from "react";
import { AlertTriangle, InfoCircle } from "@untitledui/icons";
import {
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

export interface ConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  isConfirming?: boolean;
  onConfirm: () => void;
}

export function ConfirmModal({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isConfirming,
  onConfirm,
}: ConfirmModalProps) {
  const Icon = variant === "danger" ? AlertTriangle : InfoCircle;
  const iconWrap =
    variant === "danger"
      ? "bg-error-secondary text-error-primary"
      : "bg-utility-blue-100 text-utility-blue-700";

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (isConfirming) return;
        onOpenChange(open);
      }}
      isDismissable={!isConfirming}
      className={({ isEntering, isExiting }) =>
        cx(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm",
          isEntering && "animate-in fade-in duration-150 ease-out",
          isExiting && "animate-out fade-out duration-100 ease-in",
        )
      }
    >
      <Modal
        className={({ isEntering, isExiting }) =>
          cx(
            "w-full max-w-md rounded-2xl bg-primary p-6 shadow-xl outline-hidden",
            isEntering && "animate-in zoom-in-95 fade-in duration-150 ease-out",
            isExiting && "animate-out zoom-out-95 fade-out duration-100 ease-in",
          )
        }
      >
        <Dialog role="alertdialog" className="flex flex-col gap-4 outline-hidden">
          {({ close }) => (
            <>
              <div className="flex items-start gap-4">
                <span
                  className={cx(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    iconWrap,
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Heading slot="title" className="text-md font-semibold text-primary">
                    {title}
                  </Heading>
                  {description && (
                    <p className="text-sm text-tertiary">{description}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  color="secondary"
                  size="sm"
                  isDisabled={isConfirming}
                  onClick={close}
                >
                  {cancelLabel}
                </Button>
                <Button
                  type="button"
                  color={variant === "danger" ? "primary-destructive" : "primary"}
                  size="sm"
                  isLoading={isConfirming}
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
