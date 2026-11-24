"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { ChangePasswordModal } from "@/components/users/change-password-modal";
import { useAuth } from "@/providers/auth-provider";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  AGENT: "Agent",
};

export function UserDropdown() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  if (!user) return null;

  // Le poste réel de l'employé lié (ex. "Directeur Général") prime sur le rôle administratif
  // attribué à la création du compte (ex. "Administrateur") — demande explicite de l'utilisateur :
  // afficher ce que la personne est réellement, pas ce qu'on lui a techniquement attribué.
  const subtitle = user.positionTitle ?? ROLE_LABEL[user.role] ?? user.role;

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="dropdown-toggle flex items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-white/5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15">
          {user.fullName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:block">
          <span className="block text-sm font-medium text-gray-800 dark:text-white/90">{user.fullName}</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">{subtitle}</span>
        </span>
      </button>

      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-56 p-2">
        <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800 sm:hidden">
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user.fullName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <DropdownItem
          onItemClick={() => {
            setIsOpen(false);
            setShowPasswordModal(true);
          }}
          className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Changer mon mot de passe
        </DropdownItem>
        <DropdownItem
          onItemClick={handleLogout}
          className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
        >
          Déconnexion
        </DropdownItem>
      </Dropdown>

      <ChangePasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
}
