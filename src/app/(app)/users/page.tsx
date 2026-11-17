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
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { createUser, listUsers, resetUserPassword } from "@/lib/api/users";
import { extractErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Administrateur", AGENT: "Agent" };

const createSchema = z.object({
  username: z.string().min(1, "L'identifiant est requis"),
  fullName: z.string().min(1, "Le nom complet est requis"),
  password: z.string().min(8, "Au moins 8 caractères"),
  role: z.enum(["ADMIN", "AGENT"]),
});
type CreateValues = z.infer<typeof createSchema>;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["users", page],
    queryFn: () => listUsers(page, 20),
    enabled: currentUser?.role === "ADMIN",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: "", fullName: "", password: "", role: "AGENT" },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateValues) => createUser(values),
    onSuccess: () => {
      toast.success("Utilisateur créé");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowForm(false);
      reset({ username: "", fullName: "", password: "", role: "AGENT" });
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de la création")),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => resetUserPassword(id, password),
    onSuccess: () => {
      toast.success("Mot de passe réinitialisé");
      setResettingId(null);
      setNewPassword("");
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de la réinitialisation")),
  });

  if (currentUser?.role !== "ADMIN") {
    return (
      <div>
        <PageHeader title="Utilisateurs" />
        <p className="text-sm text-gray-500">
          Accès réservé aux administrateurs.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        actions={<Button onClick={() => setShowForm((v) => !v)}>Nouvel utilisateur</Button>}
      />

      {showForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nouvel utilisateur</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => createMutation.mutate(values))}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <div>
                <Label htmlFor="username">Identifiant</Label>
                <Input id="username" {...register("username")} />
                {errors.username ? <p className="mt-1 text-xs text-error-500">{errors.username.message}</p> : null}
              </div>
              <div>
                <Label htmlFor="fullName">Nom complet</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName ? <p className="mt-1 text-xs text-error-500">{errors.fullName.message}</p> : null}
              </div>
              <div>
                <Label htmlFor="password">Mot de passe initial</Label>
                <PasswordInput id="password" {...register("password")} />
                {errors.password ? <p className="mt-1 text-xs text-error-500">{errors.password.message}</p> : null}
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select id="role" {...register("role")}>
                  <option value="ADMIN">Administrateur (accès complet)</option>
                  <option value="AGENT">Agent (pointage uniquement)</option>
                </Select>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={isSubmitting}>
                  Créer le compte
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
                {["Identifiant", "Nom complet", "Rôle", "Statut", ""].map((label) => (
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
                  <TableCell colSpan={5} className="px-5 py-4 text-sm text-gray-500">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : null}
              {data?.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                    {user.username}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                    {user.fullName}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {ROLE_LABEL[user.role] ?? user.role}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <StatusBadge label={user.active ? "Actif" : "Inactif"} tone={user.active ? "success" : "neutral"} />
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    {resettingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <PasswordInput
                          placeholder="Nouveau mot de passe"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-9 w-40"
                        />
                        <Button
                          size="sm"
                          onClick={() => resetMutation.mutate({ id: user.id, password: newPassword })}
                          disabled={newPassword.length < 8}
                        >
                          Valider
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setResettingId(null)}>
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setResettingId(user.id)}>
                        Réinitialiser le mot de passe
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {data ? (
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalItems} onPageChange={setPage} />
        ) : null}
      </Card>
    </div>
  );
}
