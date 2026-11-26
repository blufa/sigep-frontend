"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Boîte de confirmation générique (remplace window.confirm) — utilisée pour les actions
 * destructrices ou irréversibles (ex. suppression d'un employé). */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} className="max-w-md p-6" showCloseButton={false}>
      <h2 className="mb-2 text-base font-semibold text-gray-800 dark:text-white/90">{title}</h2>
      {description ? <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{description}</p> : null}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={isLoading}>
          {isLoading ? "…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
