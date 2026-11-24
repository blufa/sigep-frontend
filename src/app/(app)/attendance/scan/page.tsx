"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import jsQR from "jsqr";
import { toast } from "sonner";
import { Camera, Flag, Info, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SelectSearch } from "@/components/ui/select-search";
import { PageHeader } from "@/components/layout/page-header";
import { flagAttendancePunch, scanBadge, scanManual } from "@/lib/api/attendance";
import { getEmployeePhotoUrl, listEmployees } from "@/lib/api/employees";
import { extractErrorMessage } from "@/lib/api/client";
import { Direction } from "@/lib/types/attendance";

const COOLDOWN_MS = 8000;
/** Délai laissé à l'agent pour baisser son badge et regarder la caméra avant la capture du
 * visage — sans ça, la photo prise à l'instant même du scan ne montre que le badge levé devant
 * l'objectif, pas le visage (signalé par l'utilisateur). Porté à 6s (au lieu de 3s initialement) :
 * le vigile a aussi besoin de temps pour repositionner la caméra correctement, pas seulement
 * l'agent pour baisser son badge (signalé par l'utilisateur après test en conditions réelles). */
const FACE_CAPTURE_DELAY_SECONDS = 6;

interface LastResult {
  punchId: number;
  employeeId: number;
  fullName: string;
  direction: Direction;
  scannedAt: string;
  /** Photo caméra prise à l'instant du scan — absente pour le pointage manuel (pas de caméra). */
  capturedPhotoUrl: string | null;
  /** Photo officielle déjà enregistrée pour cet employé (celle du badge) — à comparer visuellement
   * avec la photo caméra ci-dessus pour confirmer sur-le-champ que c'est bien la bonne personne. */
  officialPhotoUrl: string | null;
  /** Vrai une fois que le vigile a cliqué "Signaler ce pointage" (badge laissé par un employé
   * absent, visages ne correspondant pas) — voir page Utilisateurs > historique pour la revue. */
  flagged: boolean;
}

type Stage = "scanning" | "countdown" | "submitting";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScannedRef = useRef<Map<string, number>>(new Map());
  const scanningRef = useRef(false);
  const stageRef = useRef<Stage>("scanning");
  const pendingTokenRef = useRef<string | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [manualEmployeeId, setManualEmployeeId] = useState("");
  const [isPunchingManually, setIsPunchingManually] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [isFlagging, setIsFlagging] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");

  const { data: employees } = useQuery({
    queryKey: ["employees", "scan"],
    queryFn: () => listEmployees(0, 200),
  });

  /** Capture l'image caméra — appelée après le délai de décompte ci-dessous, donc normalement le
   * visage de l'agent (badge déjà baissé) plutôt que le badge lui-même. */
  const captureSnapshot = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_CURRENT_DATA) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  const submitScan = useCallback(
    async (token: string) => {
      const photoBase64 = captureSnapshot();
      try {
        const result = await scanBadge(token, "QR", photoBase64);
        const officialPhotoUrl = await getEmployeePhotoUrl(result.employeeId);
        setLastResult({
          punchId: result.id,
          employeeId: result.employeeId,
          fullName: result.fullName,
          direction: result.direction,
          scannedAt: result.scannedAt,
          capturedPhotoUrl: photoBase64,
          officialPhotoUrl,
          flagged: false,
        });
        if (result.direction === "ENTREE") {
          toast.success(`${result.fullName} — Entrée enregistrée`);
        } else {
          toast.success(`${result.fullName} — Sortie enregistrée`, { icon: undefined });
        }
      } catch (error) {
        toast.error(extractErrorMessage(error, "Badge invalide ou illisible"));
      }
    },
    [captureSnapshot],
  );

  const finalizeCapture = useCallback(async () => {
    const token = pendingTokenRef.current;
    pendingTokenRef.current = null;
    stageRef.current = "submitting";
    if (token) {
      await submitScan(token);
    }
    stageRef.current = "scanning";
  }, [submitScan]);

  /** Badge reconnu : on arrête la détection QR et on laisse un court délai pour que l'agent
   * baisse son badge et regarde la caméra, avant de prendre la photo du visage. */
  const beginFaceCaptureCountdown = useCallback(
    (token: string) => {
      stageRef.current = "countdown";
      pendingTokenRef.current = token;
      let remaining = FACE_CAPTURE_DELAY_SECONDS;
      setCountdown(remaining);
      countdownTimerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          setCountdown(null);
          void finalizeCapture();
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    },
    [finalizeCapture],
  );

  // Appelée depuis la boucle de détection ci-dessous (requestAnimationFrame dans un effet), jamais
  // pendant le rendu.
  const handleDetected = useCallback(
    (token: string) => {
      const now = Date.now();
      const last = lastScannedRef.current.get(token);
      if (last && now - last < COOLDOWN_MS) return;
      lastScannedRef.current.set(token, now);
      beginFaceCaptureCountdown(token);
    },
    [beginFaceCaptureCountdown],
  );

  useEffect(() => {
    if (!cameraOn) return;

    // Si l'effet est nettoyé (changement de page, désactivation) avant que getUserMedia ait
    // répondu, `isActive` passe à false pendant l'attente : on arrête alors le flux dès qu'il
    // arrive au lieu de l'assigner à la vidéo — sinon ce flux n'est jamais rattaché à `stream`
    // (fermé sur l'instance précédente de l'effet) et la caméra reste allumée indéfiniment,
    // même après avoir quitté la page (signalé par l'utilisateur).
    let isActive = true;
    let stream: MediaStream | null = null;

    async function start() {
      try {
        // Préférence pour la caméra arrière par défaut (scan de badge + photo de contrôle — jamais
        // la caméra selfie) — `ideal` et non `exact` : une contrainte stricte fait échouer
        // `getUserMedia` (ou renvoie un flux noir sur certains navigateurs) dès qu'aucune caméra ne
        // se déclare explicitement "environment" (signalé par l'utilisateur), ce que `ideal` tolère
        // en se repliant sur la caméra par défaut. Un appareil choisi explicitement dans la liste
        // ci-dessous (deviceId défini) prime toujours sur cette préférence.
        const acquired = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: "environment" } },
        });
        if (!isActive) {
          acquired.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = acquired;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        scanningRef.current = true;
        loop();
        // Certains navigateurs ne révèlent les labels des appareils qu'après autorisation accordée.
        const list = await navigator.mediaDevices.enumerateDevices();
        if (isActive) setDevices(list.filter((d) => d.kind === "videoinput"));
      } catch {
        setCameraError("Caméra indisponible");
      }
    }

    async function loop() {
      if (!scanningRef.current) return;

      const video = videoRef.current;
      // Ne cherche un QR que si on n'est pas déjà en train de traiter un badge détecté (décompte
      // ou envoi en cours) — sinon un second badge présenté pendant le décompte relancerait une
      // capture par-dessus la précédente.
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && stageRef.current === "scanning") {
        const token = await detectToken(video);
        if (token) handleDetected(token);
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    }

    async function detectToken(video: HTMLVideoElement): Promise<string | null> {
      const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;

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
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });
      return result?.data ?? null;
    }

    start();

    return () => {
      isActive = false;
      scanningRef.current = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn, deviceId]);

  async function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!manualEmployeeId) return;
    setIsPunchingManually(true);
    try {
      const result = await scanManual(Number(manualEmployeeId));
      const officialPhotoUrl = await getEmployeePhotoUrl(result.employeeId);
      setLastResult({
        punchId: result.id,
        employeeId: result.employeeId,
        fullName: result.fullName,
        direction: result.direction,
        scannedAt: result.scannedAt,
        capturedPhotoUrl: null,
        officialPhotoUrl,
        flagged: false,
      });
      toast.success(`${result.fullName} — ${result.direction === "ENTREE" ? "Entrée" : "Sortie"} enregistrée`);
      setManualEmployeeId("");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec du pointage manuel"));
    } finally {
      setIsPunchingManually(false);
    }
  }

  function handleToggleCamera() {
    if (cameraOn) {
      // Annule aussi un décompte en cours, pour ne pas tenter une capture sur une vidéo coupée.
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      pendingTokenRef.current = null;
      stageRef.current = "scanning";
      setCountdown(null);
      setCameraError(null);
    }
    setCameraOn((current) => !current);
  }

  async function handleFlagPunch() {
    if (!lastResult) return;
    setIsFlagging(true);
    try {
      await flagAttendancePunch(lastResult.punchId);
      setLastResult({ ...lastResult, flagged: true });
      toast.success("Pointage signalé — un administrateur pourra le vérifier");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec du signalement"));
    } finally {
      setIsFlagging(false);
    }
  }

  return (
    <div>
      <PageHeader title="Scanner un badge" />

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <p>
          Une photo est prise automatiquement à chaque pointage, à des fins de contrôle de
          présence (comparaison avec la photo officielle de l&apos;employé).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-gray-200">
              {cameraOn ? (
                <>
                  { }
                  <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

                  {countdown !== null ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
                      <p className="text-sm font-semibold">Badge reconnu, regardez la caméra</p>
                      <p className="text-5xl font-extrabold">{countdown}</p>
                    </div>
                  ) : (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] text-white">
                      <Camera className="h-3 w-3" /> Le visage est photographié après chaque badge détecté
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
                  <VideoOff className="h-8 w-8" />
                  <p className="text-sm">Caméra désactivée</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleToggleCamera}
                className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/75"
              >
                {cameraOn ? (
                  <>
                    <VideoOff className="h-3.5 w-3.5" /> Désactiver la caméra
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5" /> Activer la caméra
                  </>
                )}
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            {cameraError ? <p className="mt-3 text-sm text-error-500">{cameraError}</p> : null}

            {devices.length > 1 ? (
              <div className="mt-3">
                <Label htmlFor="camera-device">Caméra</Label>
                <Select id="camera-device" value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
                  <option value="">Caméra arrière (par défaut)</option>
                  {devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Caméra ${i + 1}`}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            <form onSubmit={handleManualSubmit} className="mt-4 flex items-end gap-2">
              <div className="flex-1">
                {/* <Label htmlFor="manual-employee">
                  Pointage manuel (si la caméra est indisponible) — rechercher l&apos;employé
                </Label> */}
                <SelectSearch
                  id="manual-employee"
                  value={manualEmployeeId}
                  onChange={setManualEmployeeId}
                  placeholder="Rechercher un employé par nom ou matricule…"
                  options={(employees?.items ?? []).map((employee) => ({
                    value: String(employee.id),
                    label: `${employee.lastName} ${employee.firstName} — ${employee.matricule}`,
                  }))}
                />
              </div>
              <Button type="submit" disabled={!manualEmployeeId || isPunchingManually}>
                Pointer
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="mb-2 text-sm font-medium text-gray-800">Dernier pointage</p>
            {lastResult ? (
              <div>
                <p className="text-lg font-semibold text-gray-800">{lastResult.fullName}</p>
                <p className="text-sm text-gray-500">
                  {lastResult.direction === "ENTREE" ? "Entrée" : "Sortie"} —{" "}
                  {new Date(lastResult.scannedAt).toLocaleTimeString("fr-FR")}
                </p>

                {lastResult.capturedPhotoUrl ? (
                  <>
                    <p className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                      Vérifiez que c&apos;est bien la même personne
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div>
                        <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100">
                          {lastResult.officialPhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={lastResult.officialPhotoUrl} alt="Photo officielle" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                              Aucune photo enregistrée
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-center text-[11px] font-medium text-gray-500">Photo officielle</p>
                      </div>
                      <div>
                        <div className="aspect-square overflow-hidden rounded-lg border-2 border-brand-300 bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={lastResult.capturedPhotoUrl} alt="Photo du scan" className="h-full w-full object-cover" />
                        </div>
                        <p className="mt-1 text-center text-[11px] font-medium text-brand-600">Photo du scan (maintenant)</p>
                      </div>
                    </div>
                    {!lastResult.officialPhotoUrl ? (
                      <p className="mt-2 text-xs text-warning-600">
                        Aucune photo officielle enregistrée pour cet employé — comparaison impossible.
                      </p>
                    ) : null}

                    <div className="mt-4">
                      {lastResult.flagged ? (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-error-600">
                          <Flag className="h-3.5 w-3.5" /> Pointage signalé pour vérification
                        </p>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleFlagPunch}
                          disabled={isFlagging}
                        >
                          <Flag className="h-3.5 w-3.5" /> Les visages ne correspondent pas — signaler
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-gray-400">
                    Pointage manuel — pas de photo caméra à comparer.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun pointage pour l&apos;instant.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
