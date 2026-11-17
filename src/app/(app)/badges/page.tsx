"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { IdBadge } from "@/components/cards/id-badge";
import { BadgeSheet } from "@/components/cards/badge-sheet";
import { getEmployeePhotoUrl, listEmployees } from "@/lib/api/employees";
import {
  downloadBadgeCardPdf,
  downloadBadgeSheetPdf,
  getBadgeCardView,
  getSheetCardViews,
} from "@/lib/api/badges";
import { getOrganization } from "@/lib/api/organization";
import { getOrganizationLogoUrlOrNull } from "@/lib/api/organization-logo";
import { extractErrorMessage } from "@/lib/api/client";
import { BadgeCardView } from "@/lib/types/badge";

function BadgesPageContent() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("employeeId");

  const [selectedIds, setSelectedIds] = useState<number[]>(
    preselected ? [Number(preselected)] : [],
  );
  const [cards, setCards] = useState<BadgeCardView[]>([]);
  const [photoUrls, setPhotoUrls] = useState<(string | null)[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => listEmployees(0, 200),
  });

  const { data: organization } = useQuery({
    queryKey: ["organization"],
    queryFn: getOrganization,
  });

  const { data: logoUrl } = useQuery({
    queryKey: ["organization-logo", organization?.hasLogo],
    queryFn: getOrganizationLogoUrlOrNull,
    enabled: Boolean(organization?.hasLogo),
  });

  useEffect(() => {
    if (selectedIds.length === 0) {
      setCards([]);
      setPhotoUrls([]);
      return;
    }
    setIsLoadingPreview(true);
    const request =
      selectedIds.length === 1
        ? getBadgeCardView(selectedIds[0]).then((card) => [card])
        : getSheetCardViews(selectedIds);
    request
      .then(async (fetchedCards) => {
        setCards(fetchedCards);
        setPhotoUrls(await Promise.all(selectedIds.map((employeeId) => getEmployeePhotoUrl(employeeId))));
      })
      .catch((error) => toast.error(extractErrorMessage(error, "Impossible de charger l'aperçu du badge")))
      .finally(() => setIsLoadingPreview(false));
  }, [selectedIds]);

  function toggleEmployee(id: number) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function handleDownloadPdf() {
    try {
      if (selectedIds.length === 1) {
        await downloadBadgeCardPdf(selectedIds[0]);
      } else {
        await downloadBadgeSheetPdf(selectedIds);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec de la génération du PDF"));
    }
  }

  const employeeOptions = useMemo(() => employees?.items ?? [], [employees]);

  return (
    <div>
      <PageHeader
        title="Badges"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="print:hidden lg:col-span-1">
          <CardContent>
            <p className="mb-3 text-sm font-medium text-gray-800">Employés</p>
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {employeeOptions.map((employee) => (
                <label
                  key={employee.id}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedIds.includes(employee.id)}
                    onChange={() => toggleEmployee(employee.id)}
                  />
                  <span>
                    {employee.lastName} {employee.firstName} | {employee.matricule}
                  </span>
                </label>
              ))}
              {employeeOptions.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun employé enregistré.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <div className="mb-1 flex gap-2 print:hidden">
            <Button variant="secondary" onClick={handleDownloadPdf} disabled={cards.length === 0}>
              {selectedIds.length === 1
                ? "Télécharger le PDF officiel (format exact, imprimante PVC)"
                : "Télécharger la planche PDF (A4, papier)"}
            </Button>
          </div>
          {selectedIds.length > 1 ? (
            <p className="mb-4 text-xs text-gray-400 print:hidden">
              Pour imprimer sur une imprimante à cartes PVC, sélectionnez les employés un par un : seul le PDF
              individuel porte le format exact 54 × 85,6 mm.
            </p>
          ) : (
            <div className="mb-4" />
          )}

          {isLoadingPreview ? <p className="text-sm text-gray-500">Chargement de l&apos;aperçu…</p> : null}

          {!isLoadingPreview && cards.length === 0 ? (
            <p className="text-sm text-gray-500">
              Sélectionnez au moins un employé pour afficher l&apos;aperçu du badge.
            </p>
          ) : null}

          {cards.length === 1 ? <IdBadge card={cards[0]} logoUrl={logoUrl} photoUrl={photoUrls[0]} /> : null}
          {cards.length > 1 ? <BadgeSheet cards={cards} logoUrl={logoUrl} photoUrls={photoUrls} /> : null}
        </div>
      </div>
    </div>
  );
}

export default function BadgesPage() {
  return (
    <Suspense fallback={null}>
      <BadgesPageContent />
    </Suspense>
  );
}
