"use client";

import { useRef } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printBadgeSheet } from "@/lib/print-node";
import { IdBadge } from "@/components/cards/id-badge";
import { BadgeCardView } from "@/lib/types/badge";

const BADGES_PER_SHEET = 9;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Planche de badges (54 x 85,6mm CR80, portrait) prête à imprimer — 9 par feuille A4 en grille
 * 3x3, comme lacaeducation-ui/components/cards/badge-sheet.tsx : au-delà de 9 badges, plusieurs
 * pages sont générées (saut de page entre chacune), sans marge/ligne de coupure à l'impression
 * (repère pointillé visible seulement à l'écran, pendant la préparation).
 */
export function BadgeSheet({
  cards,
  logoUrl,
  photoUrls,
}: {
  cards: BadgeCardView[];
  logoUrl?: string | null;
  photoUrls?: (string | null)[];
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const pages = chunk(cards, BADGES_PER_SHEET);

  function print() {
    if (sheetRef.current) printBadgeSheet(sheetRef.current);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-1 print:hidden">
        <Button type="button" onClick={print}>
          <Printer className="mr-1.5 h-4 w-4" /> Imprimer la planche sur papier ({cards.length} badge
          {cards.length > 1 ? "s" : ""})
        </Button>
        <p className="max-w-sm text-center text-[11px] text-gray-400">
          Planche sur papier bristol à plastifier/découper. Pour une imprimante à cartes PVC, téléchargez le PDF
          officiel de chaque badge individuellement — lui seul porte le format exact 54 × 85,6 mm.
        </p>
      </div>

      <div
        ref={sheetRef}
        className="max-h-[70vh] space-y-6 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 print:max-h-none print:overflow-visible print:border-none print:bg-white print:p-0"
      >
        {pages.map((pageCards, pageIndex) => (
          <div
            key={pageIndex}
            style={pageIndex < pages.length - 1 ? { pageBreakAfter: "always" } : undefined}
            className="mx-auto w-fit bg-white p-4 print:w-auto print:p-0"
          >
            <p className="mb-3 text-center text-[10px] uppercase tracking-wide text-gray-400 print:hidden">
              {pageCards.length} badge{pageCards.length > 1 ? "s" : ""} · 54 × 85,6 mm · Planche {pageIndex + 1}/
              {pages.length}
            </p>
            <div className="grid grid-cols-3 gap-[4mm] print:gap-0">
              {pageCards.map((card, i) => {
                const globalIndex = pageIndex * BADGES_PER_SHEET + i;
                return (
                  <div
                    key={card.matricule}
                    className="rounded-[4mm] border border-dashed border-gray-300 p-[2mm] print:rounded-none print:border-transparent print:p-0"
                  >
                    <IdBadge card={card} logoUrl={logoUrl} photoUrl={photoUrls?.[globalIndex]} printable={false} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
