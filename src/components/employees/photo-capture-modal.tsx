"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Video } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface PhotoCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

/** Capture une photo via la caméra du navigateur (webcam ou caméra du téléphone). */
export function PhotoCaptureModal({ open, onClose, onCapture }: PhotoCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Ce navigateur ne permet pas l'accès à la caméra.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStreaming(true);
    } catch {
      setError("Caméra inaccessible — autorisez l'accès à la caméra dans le navigateur.");
    }
  }, []);

  useEffect(() => {
    if (open) {
      // Synchronisation volontaire avec un système externe (caméra) à l'ouverture de la modale —
      // startCamera() pose `error` à null avant d'attendre getUserMedia, ce que le linter signale
      // comme un setState synchrone ; c'est exactement le rôle de cet effet (pas du rendu).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void startCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function retake() {
    if (snapshot) URL.revokeObjectURL(snapshot);
    setSnapshot(null);
    setResultFile(null);
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || !streaming) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return;
    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
    setResultFile(file);
    setSnapshot(URL.createObjectURL(file));
  }

  function confirm() {
    if (!resultFile) return;
    onCapture(resultFile);
    stopCamera();
    onClose();
  }

  function close() {
    stopCamera();
    if (snapshot) URL.revokeObjectURL(snapshot);
    setSnapshot(null);
    setResultFile(null);
    onClose();
  }

  return (
    <Modal isOpen={open} onClose={close} className="max-w-md p-6">
      <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">Prendre une photo</h2>
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-gray-900">
        {snapshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={snapshot} alt="Capture" className="h-full w-full object-cover" />
        ) : (
           
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        )}
      </div>
      {error ? <p className="mt-2 text-xs text-error-500">{error}</p> : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={close}>
          Annuler
        </Button>
        {snapshot ? (
          <>
            <Button type="button" variant="secondary" onClick={retake}>
              <RefreshCw className="h-4 w-4" /> Reprendre
            </Button>
            <Button type="button" onClick={confirm}>
              Utiliser cette photo
            </Button>
          </>
        ) : streaming ? (
          <Button type="button" onClick={capture}>
            <Camera className="h-4 w-4" /> Capturer
          </Button>
        ) : (
          <Button type="button" onClick={() => void startCamera()}>
            <Video className="h-4 w-4" /> Démarrer la caméra
          </Button>
        )}
      </div>
    </Modal>
  );
}
