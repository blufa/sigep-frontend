const DISMISSED_KEY = "sigap.pwa.installBannerDismissedAt";
/** Après un refus de la bannière, on ne la ré-affiche pas avant ce délai. */
const DISMISS_DAYS = 14;

/** Event natif Chrome/Edge/Android — absent du lib.dom.d.ts standard de TypeScript. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/** true sur tout iPhone/iPad, quel que soit le navigateur (Chrome/Firefox/Edge iOS sont du WebKit maquillé). */
export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
}

/** true seulement si en plus c'est Safari lui-même — seul navigateur autorisé par iOS à installer une PWA. */
export function isIosSafariDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIosDevice() && isSafari;
}

export function hasDismissedBannerRecently(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  const elapsedDays = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return elapsedDays < DISMISS_DAYS;
}

export function dismissInstallBanner(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
}
