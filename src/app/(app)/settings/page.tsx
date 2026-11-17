"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { getOrganization, updateOrganization, uploadOrganizationLogo } from "@/lib/api/organization";
import { getOrganizationLogoUrlOrNull } from "@/lib/api/organization-logo";
import { extractErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ministryName, setMinistryName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [workStartTime, setWorkStartTime] = useState("");
  const [workEndTime, setWorkEndTime] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setVerifyUrl(window.location.origin);
    }
  }, []);

  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization"],
    queryFn: getOrganization,
    enabled: user?.role === "ADMIN",
  });

  useEffect(() => {
    if (organization) {
      setMinistryName(organization.ministryName ?? "");
      setServiceName(organization.serviceName ?? "");
      setWorkStartTime(organization.workStartTime?.slice(0, 5) ?? "");
      setWorkEndTime(organization.workEndTime?.slice(0, 5) ?? "");
      if (organization.hasLogo) {
        getOrganizationLogoUrlOrNull().then(setLogoUrl);
      }
    }
  }, [organization]);

  const updateMutation = useMutation({
    mutationFn: () => updateOrganization(ministryName, serviceName, workStartTime, workEndTime),
    onSuccess: () => {
      toast.success("Informations de l'organisation mises à jour");
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de la mise à jour")),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => uploadOrganizationLogo(file),
    onSuccess: async () => {
      toast.success("Logo mis à jour");
      setLogoUrl(await getOrganizationLogoUrlOrNull());
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de l'envoi du logo")),
  });

  if (user?.role !== "ADMIN") {
    return (
      <div>
        <PageHeader title="Paramètres" />
        <p className="text-sm text-gray-500">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Paramètres"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Vérification publique de badge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
              {verifyUrl}
            </code>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(verifyUrl);
                  toast.success("Lien copié");
                }}
              >
                <Copy className="h-4 w-4" /> Copier
              </Button>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="outline">
                  <ExternalLink className="h-4 w-4" /> Ouvrir
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Horaires de travail</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate();
              }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end"
            >
              <div>
                <Label htmlFor="workStartTime">Heure de début</Label>
                <input
                  id="workStartTime"
                  type="time"
                  value={workStartTime}
                  onChange={(e) => setWorkStartTime(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
                />
              </div>
              <div>
                <Label htmlFor="workEndTime">Heure de descente </Label>
                <input
                  id="workEndTime"
                  type="time"
                  value={workEndTime}
                  onChange={(e) => setWorkEndTime(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
                />
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                Enregistrer
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400 hover:border-brand-300"
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo de l'organisation" className="h-full w-full rounded-lg object-contain" />
              ) : (
                "Ajouter"
              )}
            </button>
            <div>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                {logoUrl ? "Remplacer le logo" : "Téléverser un logo"}
              </Button>
              <p className="mt-1 text-xs text-gray-500">PNG ou JPG, utilisé sur le badge et les documents générés.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) logoMutation.mutate(file);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dénomination officielle</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="ministryName">Ministère</Label>
                <textarea
                  id="ministryName"
                  rows={2}
                  value={ministryName}
                  onChange={(e) => setMinistryName(e.target.value)}
                  className="h-auto w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
                />
              </div>
              <div>
                <Label htmlFor="serviceName">Service / direction</Label>
                <textarea
                  id="serviceName"
                  rows={2}
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="h-auto w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
                />
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                Enregistrer
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
