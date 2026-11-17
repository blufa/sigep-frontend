"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronDown } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useAuth } from "@/providers/auth-provider";
import { listTenants } from "@/lib/api/tenants";

/**
 * Réservé au SUPER_ADMIN : choisir un service pour "opérer en tant que" son administrateur
 * (support/vérification), reflété côté API par l'en-tête X-Tenant-Id. "Plateforme" revient à la
 * vue de gestion des services.
 */
export function TenantImpersonation() {
  const { isSuperAdmin, impersonatedTenantId, setImpersonatedTenant } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const { data: tenants } = useQuery({
    queryKey: ["super-admin", "tenants"],
    queryFn: listTenants,
    enabled: isSuperAdmin,
  });

  if (!isSuperAdmin) return null;

  const current = tenants?.find((t) => t.id === impersonatedTenantId);

  function choose(id: number | null) {
    setImpersonatedTenant(id);
    setIsOpen(false);
    // Recharge pour que toutes les requêtes déjà en cache soient refaites dans le nouveau tenant.
    window.location.href = id == null ? "/super-admin/services" : "/dashboard";
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="dropdown-toggle flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:border-brand-300 hover:text-brand-700 dark:border-gray-800 dark:text-gray-300"
      >
        <Building2 className="h-4 w-4" />
        <span className="hidden max-w-[160px] truncate sm:inline">
          {current ? current.name : "Plateforme"}
        </span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-64 p-2">
        <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
          Opérer en tant que
        </p>
        <DropdownItem
          onItemClick={() => choose(null)}
          className={`flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/5 ${
            impersonatedTenantId == null ? "font-semibold text-brand-600" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          Plateforme (aucun service)
        </DropdownItem>
        {(tenants ?? []).length === 0 ? (
          <p className="px-3 py-2 text-sm text-gray-400">Aucun service</p>
        ) : null}
        {tenants?.map((tenant) => (
          <DropdownItem
            key={tenant.id}
            onItemClick={() => choose(tenant.id)}
            className={`flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/5 ${
              tenant.id === impersonatedTenantId ? "font-semibold text-brand-600" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {tenant.name}
          </DropdownItem>
        ))}
      </Dropdown>
    </div>
  );
}
