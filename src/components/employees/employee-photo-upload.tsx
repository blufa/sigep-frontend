"use client";

import { useRef, useState } from "react";
import { Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoCaptureModal } from "@/components/employees/photo-capture-modal";

export function EmployeePhotoUpload({
  photoUrl,
  onUpload,
}: {
  photoUrl: string | null;
  onUpload: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-brand-300"
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Photo de l'employé" className="h-full w-full object-cover" />
        ) : (
          <User className="h-8 w-8 text-gray-300" />
        )}
      </button>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            Choisir un fichier
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowCamera(true)}>
            <Camera className="h-4 w-4" /> Prendre une photo
          </Button>
        </div>
        <p className="text-xs text-gray-500">Photo d&apos;identité utilisée sur le badge.</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      <PhotoCaptureModal open={showCamera} onClose={() => setShowCamera(false)} onCapture={onUpload} />
    </div>
  );
}
