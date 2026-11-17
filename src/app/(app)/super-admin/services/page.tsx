"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { createTenant, createTenantAdmin, listTenants, setTenantActive } from "@/lib/api/tenants";
import { extractErrorMessage } from "@/lib/api/client";
import { Tenant } from "@/lib/types/tenant";

const createTenantSchema = z.object({
  name: z.string().min(1, "Le nom du service est requis"),
  code: z.string().min(1, "Le code est requis"),
  ministryName: z.string().optional(),
  serviceName: z.string().optional(),
});
type CreateTenantValues = z.infer<typeof createTenantSchema>;

const createAdminSchema = z.object({
  username: z.string().min(1, "L'identifiant est requis"),
  fullName: z.string().min(1, "Le nom complet est requis"),
  password: z.string().min(8, "Au moins 8 caractères"),
});
type CreateAdminValues = z.infer<typeof createAdminSchema>;

export default function SuperAdminServicesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [adminTargetTenant, setAdminTargetTenant] = useState<Tenant | null>(null);

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["super-admin", "tenants"],
    queryFn: listTenants,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTenantValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { name: "", code: "", ministryName: "", serviceName: "" },
  });

  const createTenantMutation = useMutation({
    mutationFn: (values: CreateTenantValues) => createTenant(values),
    onSuccess: () => {
      toast.success("Service créé");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "tenants"] });
      setShowForm(false);
      reset({ name: "", code: "", ministryName: "", serviceName: "" });
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de la création du service")),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => setTenantActive(id, active),
    onSuccess: () => {
      toast.success("Statut du service mis à jour");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "tenants"] });
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de la mise à jour du statut")),
  });

  return (
    <div>
      <PageHeader
        title="Services (tenants)"
        description="Créez et administrez les services rattachés au ministère. Chaque service dispose de ses propres employés, badges, pointages et utilisateurs, totalement isolés des autres."
        actions={<Button onClick={() => setShowForm((v) => !v)}>Nouveau service</Button>}
      />

      {showForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nouveau service</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => createTenantMutation.mutate(values))}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <div>
                <Label htmlFor="name">Nom du service</Label>
                <Input id="name" {...register("name")} />
                {errors.name ? <p className="mt-1 text-xs text-error-500">{errors.name.message}</p> : null}
              </div>
              <div>
                <Label htmlFor="code">Code (unique)</Label>
                <Input id="code" {...register("code")} placeholder="ex. DNFP" />
                {errors.code ? <p className="mt-1 text-xs text-error-500">{errors.code.message}</p> : null}
              </div>
              <div>
                <Label htmlFor="ministryName">Ministère</Label>
                <Input id="ministryName" {...register("ministryName")} />
              </div>
              <div>
                <Label htmlFor="serviceName">Service / direction</Label>
                <Input id="serviceName" {...register("serviceName")} />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={isSubmitting}>
                  Créer le service
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                {["Nom", "Code", "Ministère", "Service", "Statut", ""].map((label) => (
                  <TableCell
                    key={label}
                    isHeader
                    className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-4 text-sm text-gray-500">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && (tenants?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-4 text-sm text-gray-500">
                    Aucun service pour l&apos;instant.
                  </TableCell>
                </TableRow>
              ) : null}
              {tenants?.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                    {tenant.name}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {tenant.code}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {tenant.ministryName ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {tenant.serviceName ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <StatusBadge label={tenant.active ? "Actif" : "Inactif"} tone={tenant.active ? "success" : "neutral"} />
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setAdminTargetTenant(tenant)}>
                        Ajouter un administrateur
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate({ id: tenant.id, active: !tenant.active })}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {tenant.active ? "Désactiver" : "Activer"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CreateTenantAdminModal
        tenant={adminTargetTenant}
        onClose={() => setAdminTargetTenant(null)}
      />
    </div>
  );
}

function CreateTenantAdminModal({ tenant, onClose }: { tenant: Tenant | null; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdminValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { username: "", fullName: "", password: "" },
  });

  const createAdminMutation = useMutation({
    mutationFn: (values: CreateAdminValues) => {
      if (!tenant) throw new Error("Aucun service sélectionné");
      return createTenantAdmin(tenant.id, { ...values, role: "ADMIN" });
    },
    onSuccess: () => {
      toast.success("Administrateur créé pour ce service");
      reset({ username: "", fullName: "", password: "" });
      onClose();
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de la création de l'administrateur")),
  });

  if (!tenant) return null;

  return (
    <Modal isOpen={!!tenant} onClose={onClose} className="max-w-md p-6">
      <h2 className="mb-1 text-base font-semibold text-gray-800 dark:text-white/90">
        Administrateur de {tenant.name}
      </h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Ce compte pourra ensuite se connecter et gérer ses propres employés, badges et utilisateurs pour ce service.
      </p>
      <form
        onSubmit={handleSubmit((values) => createAdminMutation.mutate(values))}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="admin-username">Identifiant</Label>
          <Input id="admin-username" {...register("username")} />
          {errors.username ? <p className="mt-1 text-xs text-error-500">{errors.username.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="admin-fullName">Nom complet</Label>
          <Input id="admin-fullName" {...register("fullName")} />
          {errors.fullName ? <p className="mt-1 text-xs text-error-500">{errors.fullName.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="admin-password">Mot de passe initial</Label>
          <PasswordInput id="admin-password" {...register("password")} />
          {errors.password ? <p className="mt-1 text-xs text-error-500">{errors.password.message}</p> : null}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Créer l&apos;administrateur
        </Button>
      </form>
    </Modal>
  );
}
