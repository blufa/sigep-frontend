"use client";

import { Printer, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Prévisualisation d'un PDF déjà généré (blob URL) avant impression/téléchargement — le visualiseur
 * PDF natif du navigateur (dans l'<iframe>) garantit un rendu strictement identique au document final,
 * sans dupliquer sa mise en page dans un composant React séparé (risque de décalage entre l'aperçu et
 * le vrai PDF).
 */
export function PdfPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  title,
  onDownload,
}: {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  title: string;
  onDownload: () => void;
}) {
  if (!isOpen) return null;

  function handlePrint() {
    const iframe = document.getElementById("pdf-preview-frame") as HTMLIFrameElement | null;
    iframe?.contentWindow?.print();
  }

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-gray-400/50 p-4 backdrop-blur-[8px]">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-theme-lg dark:bg-gray-900">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h2>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handlePrint} disabled={!pdfUrl}>
              <Printer className="mr-1.5 h-4 w-4" /> Imprimer
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onDownload} disabled={!pdfUrl}>
              <Download className="mr-1.5 h-4 w-4" /> Télécharger
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 bg-gray-100 dark:bg-gray-950">
          {pdfUrl ? (
            <iframe id="pdf-preview-frame" src={pdfUrl} title={title} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">Génération du PDF…</div>
          )}
        </div>
      </div>
    </div>
  );
}
