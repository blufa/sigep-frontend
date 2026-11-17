"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { changeMyPassword } from "@/lib/api/users";
import { extractErrorMessage } from "@/lib/api/client";

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      toast.success("Mot de passe mis à jour");
      setCurrentPassword("");
      setNewPassword("");
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec du changement de mot de passe"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
        Changer mon mot de passe
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">Mot de passe actuel</Label>
          <PasswordInput
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <PasswordInput
            id="newPassword"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
