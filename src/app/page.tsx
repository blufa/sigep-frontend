"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import { useQuery } from "@tanstack/react-query";
import { Camera, Keyboard, LogIn, Shield, ShieldCheck, ShieldX, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPublicOrganization,
  publicBadgePhotoUrl,
  publicBadgePhotoUrlByMatricule,
  publicOrganizationLogoUrl,
  PublicBadgeVerification,
  verifyBadgeByMatricule,
  verifyBadgePublic,
} from "@/lib/api/public";

type PhotoSource = { kind: "token" | "matricule"; value: string } | null;

export default function Home() {
  const { data: organization } = useQuery({
    queryKey: ["public-organization"],
    queryFn: getPublicOrganization,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanningRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualMatricule, setManualMatricule] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [result, setResult] = useState<PublicBadgeVerification | null>(null);
  const [photoSource, setPhotoSource] = useState<PhotoSource>(null);

  // Appelée depuis la boucle de détection ci-dessous (requestAnimationFrame dans un effet), jamais
  // pendant le rendu — déclarée avant cet effet pour que l'analyse de dépendances la voie correctement.
  const checkToken = useCallback(async (token: string) => {
    setIsChecking(true);
    try {
      const verification = await verifyBadgePublic(token);
      setResult(verification);
      setPhotoSource(verification.valid ? { kind: "token", value: token } : null);
    } catch {
      setResult({ valid: false, matricule: null, fullName: null, positionTitle: null, hierarchie: null, hasPhoto: false });
      setPhotoSource(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!showCamera) return;
    let stream: MediaStream | null = null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        scanningRef.current = true;
        loop();
      } catch {
        setCameraError("Caméra indisponible — utilisez la saisie du matricule ci-dessous.");
      }
    }

    async function loop() {
      if (!scanningRef.current) return;
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const token = await detectToken(video);
        if (token && token !== lastTokenRef.current) {
          lastTokenRef.current = token;
          void checkToken(token);
        }
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    }

    async function detectToken(video: HTMLVideoElement): Promise<string | null> {
      const BarcodeDetectorCtor = (
        window as unknown as {
          BarcodeDetector?: new (options: { formats: string[] }) => {
            detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
          };
        }
      ).BarcodeDetector;

      if (BarcodeDetectorCtor) {
        try {
          const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
          const results = await detector.detect(video);
          return results[0]?.rawValue ?? null;
        } catch {
          return null;
        }
      }

      const canvas = canvasRef.current;
      if (!canvas) return null;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
      return result?.data ?? null;
    }

    start();

    return () => {
      scanningRef.current = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCamera]);

  async function checkMatricule(matricule: string) {
    setIsChecking(true);
    try {
      const verification = await verifyBadgeByMatricule(matricule);
      setResult(verification);
      setPhotoSource(verification.valid ? { kind: "matricule", value: matricule } : null);
    } catch {
      setResult({ valid: false, matricule: null, fullName: null, positionTitle: null, hierarchie: null, hasPhoto: false });
      setPhotoSource(null);
    } finally {
      setIsChecking(false);
    }
  }

  function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!manualMatricule.trim()) return;
    void checkMatricule(manualMatricule.trim());
  }

  const photoUrl = photoSource
    ? photoSource.kind === "token"
      ? publicBadgePhotoUrl(photoSource.value)
      : publicBadgePhotoUrlByMatricule(photoSource.value)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="flex h-1.5 w-full shrink-0">
        <div className="flex-1" style={{ background: "#CE1126" }} />
        <div className="flex-1" style={{ background: "#FCD116" }} />
        <div className="flex-1" style={{ background: "#009460" }} />
      </div>

      <div className="flex justify-end px-4 pt-3">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-600">
          <LogIn className="h-4 w-4" /> Connexion administrateur
        </Link>
      </div>

      <div className="mx-auto max-w-xl px-4 py-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-white shadow-theme-xs">
          {organization?.hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={publicOrganizationLogoUrl()} alt="Logo du ministère" className="h-full w-full rounded-full object-contain p-1.5" />
          ) : (
            <Shield className="h-8 w-8 text-brand-500" strokeWidth={1.5} />
          )}
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">République de Guinée</p>
        <h1 className="mt-1 text-2xl font-extrabold text-gray-800 sm:text-3xl">Vérification de badge agent</h1>

        <form onSubmit={handleManualSubmit} className="mx-auto mt-6 flex max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Keyboard className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="manual-matricule"
              value={manualMatricule}
              onChange={(e) => setManualMatricule(e.target.value)}
              placeholder="Saisir le matricule de l'agent…"
              className="h-12 rounded-full pl-11"
            />
          </div>
          <Button type="submit" className="h-12 shrink-0 rounded-full px-6" disabled={isChecking}>
            Vérifier
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setShowCamera((current) => !current)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
        >
          <Camera className="h-4 w-4" />
          {showCamera ? "Masquer la caméra" : "Scanner le QR du badge plutôt"}
        </button>

        {showCamera ? (
          <div className="mx-auto mt-4 max-w-xs rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-sm">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-900">
              { }
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            {cameraError ? <p className="mt-2 text-xs text-error-500">{cameraError}</p> : null}
          </div>
        ) : null}

        {result ? (
          <div
            className={`mx-auto mt-6 max-w-md rounded-2xl border p-4 text-left ${
              result.valid ? "border-success-200 bg-success-50" : "border-error-200 bg-error-50"
            }`}
          >
            {result.valid ? (
              <div className="flex items-start gap-3">
                {photoUrl && result.hasPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={result.fullName ?? ""}
                    className="h-16 w-16 shrink-0 rounded-lg border border-success-300 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-success-300 bg-white">
                    <User className="h-7 w-7 text-success-500" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5 text-success-700">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="text-sm font-bold">Badge valide</p>
                  </div>
                  <p className="mt-1 text-base font-semibold text-gray-800">{result.fullName}</p>
                  <p className="text-sm text-gray-600">{result.positionTitle ?? "—"}</p>
                  <p className="text-xs text-gray-500">
                    Matricule {result.matricule} {result.hierarchie ? `· ${result.hierarchie}` : ""}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-error-700">
                <ShieldX className="h-5 w-5" />
                <p className="text-sm font-bold">Badge invalide, inconnu ou révoqué.</p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-center">
        {organization?.ministryName ? (
          <p className="mx-auto max-w-md truncate text-[11px] font-medium text-gray-500">{organization.ministryName}</p>
        ) : null}
        <p className="mt-0.5 text-[11px] text-gray-400">
          République de Guinée — SIGAP © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
