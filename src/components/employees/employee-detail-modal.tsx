"use client";

import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Employee } from "@/lib/types/staff";

const GENRE_LABEL: Record<string, string> = { HOMME: "Homme", FEMME: "Femme" };

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-800 dark:text-white/90">{value || "—"}</p>
    </div>
  );
}

export function EmployeeDetailModal({
  employee,
  positionTitle,
  onClose,
}: {
  employee: Employee | null;
  positionTitle?: string;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={employee !== null} onClose={onClose} className="max-w-lg p-6">
      {employee ? (
        <div>
          <div className="mb-4 flex items-start justify-between pr-10">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {employee.lastName} {employee.firstName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fiche employé</p>
            </div>
            <StatusBadge label={employee.active ? "Actif" : "Inactif"} tone={employee.active ? "success" : "neutral"} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Matricule d'Etat" value={employee.matricule} />
            <Field label="Genre" value={GENRE_LABEL[employee.genre]} />
            <Field label="Poste occupé" value={positionTitle} />
            <Field label="Hiérarchie" value={employee.hierarchie} />
            <Field label="Téléphone" value={employee.phone} />
            <Field label="Ville de travail" value={employee.city} />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
