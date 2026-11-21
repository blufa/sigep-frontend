"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type BeforeInstallPromptEvent,
  dismissInstallBanner,
  hasDismissedBannerRecently,
  isIosDevice,
  isIosSafariDevice,
  isRunningStandalone,
} from "@/lib/pwa-install";
import { IosInstallInstructionsModal } from "@/components/pwa/ios-install-instructions-modal";

/** Délai avant la première apparition — jamais au premier chargement (mauvaise pratique UX connue). */
const SHOW_AFTER_MS = 8000;

/**
 * Bannière discrète "Ajouter à l'écran d'accueil", uniquement sur mobile — capte `beforeinstallprompt`
 * (Android/Chrome/Edge) et propose la marche à suivre manuelle sur iOS (jamais d'event natif là-bas).
 * Même pattern que lacaeducation-ui/components/pwa, simplifié en un seul composant (sans store dédié).
 */
export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // Initialiseurs paresseux plutôt qu'un effet de montage : ces valeurs ne déterminent jamais le
  // premier rendu visible (la bannière reste masquée tant que `visible` ne passe pas à true, après
  // le délai ci-dessous) — aucun risque de décalage d'hydratation à les lire directement ici.
  const [isInstalled, setIsInstalled] = useState(() => isRunningStandalone());
  const [isIos] = useState(() => isIosDevice());
  const [isIosSafari] = useState(() => isIosSafariDevice());
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      // Empêche la mini-infobar native de Chrome — on affiche notre propre bannière à la place,
      // au moment de notre choix plutôt qu'au premier chargement.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  // Sur iOS (tout navigateur), la marche à suivre manuelle est toujours proposable ; ailleurs, il faut
  // que Chrome/Edge ait effectivement signalé l'event `beforeinstallprompt`.
  const installable = Boolean(deferredPrompt) || isIos;

  useEffect(() => {
    if (!installable || isInstalled) return;
    if (hasDismissedBannerRecently()) return;
    const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [installable, isInstalled]);

  function handleDismiss() {
    dismissInstallBanner();
    setDismissed(true);
  }

  async function handleInstall() {
    if (isIos) {
      setShowIosModal(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible || dismissed || isInstalled) return null;

  return (
    <>
      <div className="fixed inset-x-3 bottom-20 z-40 sm:hidden">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
            <Smartphone className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white/90">Installer l&apos;application</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">Accès rapide depuis votre écran d&apos;accueil</p>
          </div>
          <Button size="sm" onClick={handleInstall}>
            <Download className="mr-1.5 h-4 w-4" /> Installer
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fermer"
            className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <IosInstallInstructionsModal isOpen={showIosModal} onClose={() => setShowIosModal(false)} inSafari={isIosSafari} />
    </>
  );
}
