"use client";

import { useRef } from "react";
import { Printer, Shield, User } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { printNode } from "@/lib/print-node";
import { BadgeCardView } from "@/lib/types/badge";

const ACCENT = "#0B3D2E";
const MUTED = "#5B6670";
const INK = "#13202B";

const DEFAULT_MINISTRY_NAME =
  "Ministère de l'Éducation Nationale, de l'Enseignement Technique, de la Formation Professionnelle et de l'Alphabétisation";
const DEFAULT_SERVICE_NAME = "Service National des Infrastructures, Équipements Scolaires et Maintenance";

/**
 * Carte CR80 portrait (54 x 85,6mm), gabarit officiel validé par le client (voir docs/Badge
 * Ministère.*). L'écran affiche une version agrandie (300px de large) pour la lisibilité de
 * l'aperçu ; CHAQUE dimension (padding, gap, taille de police, boîtes photo/QR) porte une
 * variante `print:` en mm, à l'échelle réelle 54mm/300px = 0,18mm par pixel-écran — sans ce
 * doublage systématique, les boîtes de taille fixe (photo, QR) resteraient à leur taille écran
 * en pixels lors de l'impression, bien plus grandes que la carte réelle une fois celle-ci
 * ramenée à 54mm : au mieux débordement, au pire contenu tronqué par `overflow:hidden` — la
 * "déformation" signalée. Même pattern que lacaeducation-ui/id-badge-portrait.tsx.
 */
export function IdBadge({
  card,
  logoUrl,
  photoUrl,
  printable = true,
}: {
  card: BadgeCardView;
  logoUrl?: string | null;
  photoUrl?: string | null;
  printable?: boolean;
}) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const fullName = card.fullName.trim();
  const lastSpaceIndex = fullName.lastIndexOf(" ");
  const firstName = lastSpaceIndex === -1 ? fullName : fullName.slice(0, lastSpaceIndex);
  const lastName = lastSpaceIndex === -1 ? "" : fullName.slice(lastSpaceIndex + 1);

  function print() {
    if (badgeRef.current) printNode(badgeRef.current);
  }

  return (
    <div className="space-y-3">
      <div ref={badgeRef}>
        <div
          className="relative mx-auto flex w-[300px] flex-col overflow-hidden rounded-[16px] bg-white shadow-theme-md print:h-[85.6mm] print:w-[54mm] print:min-h-0 print:overflow-hidden print:rounded-none print:shadow-none print:break-inside-avoid"
          style={{ color: INK, fontFamily: "var(--font-sora, inherit)" }}
        >
          <div className="flex h-[7px] shrink-0 print:h-[1.3mm]">
            <div className="flex-1" style={{ background: "#CE1126" }} />
            <div className="flex-1" style={{ background: "#FCD116" }} />
            <div className="flex-1" style={{ background: "#009460" }} />
          </div>

          <div className="flex flex-col items-center gap-1.5 px-5 pb-3 pt-6 text-center print:gap-[0.27mm] print:px-[3.6mm] print:pb-[0.9mm] print:pt-[4.5mm]">
            <div className="flex items-center gap-2 print:gap-[0.36mm]">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="h-10 w-10 shrink-0 object-contain print:h-[7.2mm] print:w-[7.2mm]" />
              ) : (
                <Shield
                  className="h-10 w-10 shrink-0 print:h-[7.2mm] print:w-[7.2mm]"
                  style={{ color: MUTED }}
                  strokeWidth={1.5}
                />
              )}
              <div className="text-left">
                <p className="text-[8px] font-extrabold tracking-wider print:text-[1.44mm]">RÉPUBLIQUE DE GUINÉE</p>
                <p className="text-[6px] font-medium print:text-[1.08mm]" style={{ color: MUTED }}>
                  Travail – Justice – Solidarité
                </p>
              </div>
            </div>
            <p className="text-[6.5px] font-bold uppercase leading-tight print:text-[1.17mm]">
              {card.ministryName ?? DEFAULT_MINISTRY_NAME}
            </p>
            <p
              className="w-full border-t pt-1.5 text-[6px] font-semibold uppercase leading-tight print:pt-[0.27mm] print:text-[1.08mm]"
              style={{ color: ACCENT, borderColor: "#DDE2E6" }}
            >
              {card.serviceName ?? DEFAULT_SERVICE_NAME}
            </p>
          </div>

          <div className="flex gap-3 px-5 print:gap-[0.54mm] print:px-[3.6mm]">
            <div
              className="flex h-[150px] w-[123px] shrink-0 items-center justify-center overflow-hidden rounded-lg print:h-[27mm] print:w-[22.1mm] print:rounded-[0.7mm]"
              style={{ background: "#F1F3F5", border: `2px solid ${ACCENT}` }}
            >
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt={card.fullName} className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 print:h-[7.2mm] print:w-[7.2mm]" style={{ color: MUTED }} strokeWidth={1.25} />
              )}
            </div>
            {/* gap-4 (au lieu de gap-2) sépare davantage "FONCTION" du nom au-dessus — demande
                explicite : "faire descendre un peu FONCTION Directeur Général". */}
            <div className="flex min-w-0 flex-col gap-4 pt-1 print:gap-[2.1mm] print:pt-[0.9mm]">
              <div>
                <p className="text-[8px] font-medium print:text-[1.44mm]" style={{ color: MUTED }}>
                  {firstName}
                </p>
                <p className="break-words text-[15px] font-extrabold uppercase leading-tight print:text-[2.7mm]">
                  {lastName}
                </p>
              </div>
              <div>
                <p className="text-[6px] font-bold uppercase tracking-wider print:text-[1.08mm]" style={{ color: MUTED }}>
                  Fonction
                </p>
                <p className="text-[8px] font-semibold leading-tight print:text-[1.44mm]">{card.positionTitle ?? "—"}</p>
              </div>
            </div>
          </div>

          <div
            className="mx-5 mt-5 mb-5 flex items-center gap-3 rounded-xl p-2 print:mx-[3.6mm] print:mt-[2.2mm] print:mb-[2.2mm] print:gap-[0.54mm] print:rounded-[0.7mm] print:p-[0.36mm]"
            style={{ background: "#F4F6F7" }}
          >
            <div className="flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-md bg-white p-1 print:h-[18.7mm] print:w-[18.7mm] print:rounded-[0.5mm] print:p-[0.18mm]">
              <QRCodeSVG value={card.qrToken} size={94} level="M" marginSize={0} className="h-full w-full" />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5 print:gap-[0.27mm]">
              <p className="text-[7.5px] font-bold leading-tight print:text-[1.35mm]">
                Scanner à l&apos;arrivée et au départ
              </p>
              <div>
                <p className="text-[6px] font-bold uppercase tracking-wider print:text-[1.08mm]" style={{ color: MUTED }}>
                  Matricule
                </p>
                <p className="font-mono text-[9px] font-bold leading-tight print:text-[1.6mm]">{card.matricule}</p>
              </div>
              <div>
                <p className="text-[6px] font-bold uppercase tracking-wider print:text-[1.08mm]" style={{ color: MUTED }}>
                  Hiérarchie
                </p>
                <p className="text-[7.5px] font-semibold leading-tight print:text-[1.35mm]">{card.hierarchie ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Comble l'espace restant jusqu'au bas réel de la carte (fixé en print:h-[85.6mm] ci-dessus)
              pour que le pied BADGE AGENT touche toujours le bord physique de la carte, quelle que
              soit la longueur du contenu au-dessus — sans lui, le pied s'arrête là où le contenu
              finit naturellement, laissant un blanc sous le bandeau (la "déformation" remontée),
              invisible à l'écran (hauteur non contrainte) mais flagrant sur une carte PVC réelle ou
              une planche aux cartes serrées. Même pattern que lacaeducation-ui/id-badge-portrait.tsx. */}
          <div className="flex-1" />

          <div
            className="flex h-[34px] shrink-0 items-center justify-between px-5 text-white print:h-[6.1mm] print:px-[3.6mm]"
            style={{ background: ACCENT }}
          >
            <p className="text-[10px] font-extrabold tracking-[0.2em] print:text-[1.8mm]">BADGE AGENT</p>
            {card.city ? <p className="text-[6px] font-semibold opacity-85 print:text-[1.08mm]">{card.city}</p> : null}
          </div>
        </div>
      </div>

      {printable && (
        <div className="flex flex-col items-center gap-1 print:hidden">
          <Button type="button" variant="secondary" size="sm" onClick={print}>
            <Printer className="mr-1.5 h-4 w-4" /> Imprimer sur papier (aperçu)
          </Button>
          <p className="max-w-xs text-center text-[11px] text-gray-400">
            Pour une imprimante à cartes PVC, utilisez « Télécharger le PDF officiel » ci-dessus — seul le PDF porte
            le format exact de la carte.
          </p>
        </div>
      )}
    </div>
  );
}
