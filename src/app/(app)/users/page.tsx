"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Search } from "lucide-react";
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
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { createUser, listUsers, resetUserPassword, updateUserMenus, updateUsername } from "@/lib/api/users";
import { extractErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import { ALL_MENU_ITEMS } from "@/layout/AppSidebar";
import { AppUser } from "@/lib/types/user";

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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [menusForUser, setMenusForUser] = useState<AppUser | null>(null);
  const [checkedMenuKeys, setCheckedMenuKeys] = useState<string[]>([]);
  const [editingUsernameFor, setEditingUsernameFor] = useState<AppUser | null>(null);
  const [newUsername, setNewUsername] = useState("");

  // Léger délai avant d'interroger l'API le temps que l'utilisateur finisse de taper, pour ne pas
  // déclencher une requête à chaque frappe (même pattern que la liste des employés).
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search],
    queryFn: () => listUsers(page, 20, search),
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

  const usernameMutation = useMutation({
    mutationFn: ({ id, username }: { id: number; username: string }) => updateUsername(id, username),
    onSuccess: () => {
      toast.success("Identifiant mis à jour");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUsernameFor(null);
      setNewUsername("");
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de la mise à jour de l'identifiant")),
  });

  const menusMutation = useMutation({
    mutationFn: ({ id, menuKeys }: { id: number; menuKeys: string[] | null }) => updateUserMenus(id, menuKeys),
    onSuccess: () => {
      toast.success("Menus mis à jour");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setMenusForUser(null);
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de la mise à jour des menus")),
  });

  /** Menus assignés réellement applicables au rôle de l'utilisateur — un compte Agent ne peut de
   * toute façon jamais voir les pages réservées aux administrateurs (Utilisateurs, Paramètres),
   * quand bien même ces clés traîneraient encore dans ses menus enregistrés (ex. après un
   * changement de rôle). Sans ce filtre, le décompte affiché ("Accès restreint (N menus)") compte
   * des menus inaccessibles en pratique, ce qui ne correspond pas à l'accès réel du compte. */
  function applicableMenuKeys(user: AppUser): string[] {
    const allowed = user.allowedMenus;
    if (!allowed) return ALL_MENU_ITEMS.map((item) => item.key);
    return allowed.filter((key) => {
      const item = ALL_MENU_ITEMS.find((i) => i.key === key);
      return item && (!item.adminOnly || user.role === "ADMIN");
    });
  }

  function openUsernameEditor(user: AppUser) {
    setEditingUsernameFor(user);
    setNewUsername(user.username);
  }

  function openMenuEditor(user: AppUser) {
    setMenusForUser(user);
    setCheckedMenuKeys(applicableMenuKeys(user));
  }

  function toggleMenuKey(key: string) {
    setCheckedMenuKeys((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }

  function saveMenus() {
    if (!menusForUser) return;
    if (checkedMenuKeys.length === 0) {
      toast.error("Il faut laisser au moins un menu accessible");
      return;
    }
    const allKeys = ALL_MENU_ITEMS.map((item) => item.key);
    const isUnrestricted = allKeys.every((key) => checkedMenuKeys.includes(key));
    menusMutation.mutate({ id: menusForUser.id, menuKeys: isUnrestricted ? null : checkedMenuKeys });
  }

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

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Rechercher par identifiant ou nom…"
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
        />
      </div>

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
                    {user.allowedMenus ? (
                      <p className="mt-0.5 text-xs text-warning-600 dark:text-warning-400">
                        Accès restreint ({applicableMenuKeys(user).length} menu{applicableMenuKeys(user).length > 1 ? "s" : ""})
                      </p>
                    ) : null}
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
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setResettingId(user.id)}>
                          Réinitialiser le mot de passe
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openUsernameEditor(user)}>
                          Modifier l&apos;identifiant
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openMenuEditor(user)}>
                          Gérer les menus
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-4 text-sm text-gray-500">
                    {search ? "Aucun utilisateur ne correspond à cette recherche." : "Aucun utilisateur enregistré."}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
        {data ? (
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalItems} onPageChange={setPage} />
        ) : null}
      </Card>

      <Modal isOpen={!!editingUsernameFor} onClose={() => setEditingUsernameFor(null)} className="max-w-sm p-6">
        <h2 className="mb-1 text-base font-semibold text-gray-800 dark:text-white/90">
          Identifiant de {editingUsernameFor?.fullName}
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Utile par exemple si le numéro de téléphone a été enregistré avec des espaces, empêchant
          la connexion.
        </p>
        <Label htmlFor="new-username">Identifiant</Label>
        <Input id="new-username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setEditingUsernameFor(null)}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => editingUsernameFor && usernameMutation.mutate({ id: editingUsernameFor.id, username: newUsername })}
            disabled={!newUsername.trim() || usernameMutation.isPending}
          >
            Enregistrer
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!menusForUser} onClose={() => setMenusForUser(null)} className="max-w-md p-6">
        <h2 className="mb-1 text-base font-semibold text-gray-800 dark:text-white/90">
          Menus de {menusForUser?.fullName}
        </h2>
        <div className="mb-6 space-y-2">
          {ALL_MENU_ITEMS.filter((item) => !item.adminOnly || menusForUser?.role === "ADMIN").map((item) => (
            <label key={item.key} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-white/5">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={checkedMenuKeys.includes(item.key)}
                onChange={() => toggleMenuKey(item.key)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setMenusForUser(null)}>
            Annuler
          </Button>
          <Button type="button" onClick={saveMenus} disabled={menusMutation.isPending}>
            Enregistrer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
