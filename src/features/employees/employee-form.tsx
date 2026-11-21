"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SelectSearch } from "@/components/ui/select-search";
import { listPositions } from "@/lib/api/positions";
import { EmployeeInput } from "@/lib/types/staff";

const schema = z.object({
  matricule: z.string().min(1, "Le matricule d'Etat est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  firstName: z.string().min(1, "Le prénom est requis"),
  hierarchie: z.string(),
  genre: z.enum(["HOMME", "FEMME"]),
  positionId: z.number().nullable(),
  phone: z.string(),
  city: z.string(),
  active: z.boolean(),
  // Compte de connexion créé en même temps que l'employé — demande explicite : "au lieu de venir
  // créer un utilisateur [séparément], lorsque je crée un employé [...] donne-moi le privilège de
  // lui créer un compte". Validés à la main dans le gestionnaire onSubmit de la page (pas ici) :
  // le mot de passe n'est requis que si createAccount est coché, et le schéma Zod statique ne sait
  // pas exprimer cette dépendance simplement.
  createAccount: z.boolean(),
  accountRole: z.enum(["ADMIN", "AGENT"]),
  accountPassword: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof schema>;

/** Ne garde que les champs attendus par l'API employés — {@link EmployeeFormValues} porte aussi les
 * champs du compte de connexion (UI uniquement, jamais envoyés à /employees). */
export function toEmployeeInput(values: EmployeeFormValues): EmployeeInput {
  return {
    matricule: values.matricule,
    lastName: values.lastName,
    firstName: values.firstName,
    hierarchie: values.hierarchie,
    genre: values.genre,
    positionId: values.positionId,
    phone: values.phone,
    city: values.city,
    active: values.active,
  };
}

export function EmployeeForm({
  defaultValues,
  onSubmit,
  submitLabel = "Enregistrer",
  disableMatricule = false,
  showAccountCreation = false,
}: {
  defaultValues: EmployeeInput & { createAccount?: boolean; accountRole?: "ADMIN" | "AGENT"; accountPassword?: string };
  onSubmit: (values: EmployeeFormValues) => void;
  submitLabel?: string;
  disableMatricule?: boolean;
  /** Affiche la section "Créer un compte de connexion" — réservé à la création d'un nouvel employé. */
  showAccountCreation?: boolean;
}) {
  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: () => listPositions(0, 200),
  });

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      createAccount: false,
      accountRole: "AGENT",
      accountPassword: "",
      ...defaultValues,
    },
  });

  const phone = watch("phone");
  const createAccount = watch("createAccount");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="matricule">Matricule d&apos;Etat</Label>
        <Input id="matricule" disabled={disableMatricule} {...register("matricule")} />
        {errors.matricule ? <p className="mt-1 text-xs text-error-500">{errors.matricule.message}</p> : null}
      </div>

      <div>
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" {...register("phone")} />
      </div>

      <div>
        <Label htmlFor="lastName">Nom</Label>
        <Input id="lastName" {...register("lastName")} />
        {errors.lastName ? <p className="mt-1 text-xs text-error-500">{errors.lastName.message}</p> : null}
      </div>

      <div>
        <Label htmlFor="firstName">Prénom</Label>
        <Input id="firstName" {...register("firstName")} />
        {errors.firstName ? <p className="mt-1 text-xs text-error-500">{errors.firstName.message}</p> : null}
      </div>

      <div>
        <Label htmlFor="genre">Genre</Label>
        <Select id="genre" {...register("genre")}>
          <option value="HOMME">Homme</option>
          <option value="FEMME">Femme</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="hierarchie">Hiérarchie</Label>
        <Input id="hierarchie" placeholder="Ex. Agent de maîtrise" {...register("hierarchie")} />
      </div>

      <div>
        <Label htmlFor="city">Ville de travail</Label>
        <Input id="city" placeholder="Ex. Conakry" {...register("city")} />
      </div>

      <div>
        <Label htmlFor="positionId">Poste occupé</Label>
        <Controller
          name="positionId"
          control={control}
          render={({ field }) => (
            <SelectSearch
              id="positionId"
              value={field.value != null ? String(field.value) : ""}
              onChange={(value) => field.onChange(value === "" ? null : Number(value))}
              placeholder="Rechercher un poste…"
              options={(positions?.items ?? []).map((position) => ({
                value: String(position.id),
                label: position.title,
              }))}
            />
          )}
        />
      </div>

      <div className="flex items-center gap-2">
        <input id="active" type="checkbox" className="h-4 w-4" {...register("active")} />
        <Label htmlFor="active" className="mb-0">
          Employé actif
        </Label>
      </div>

      {showAccountCreation ? (
        <div className="rounded-lg border border-gray-200 p-4 sm:col-span-2 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <input id="createAccount" type="checkbox" className="h-4 w-4" {...register("createAccount")} />
            <Label htmlFor="createAccount" className="mb-0">
              Créer un compte de connexion pour cet employé
            </Label>
          </div>

          {createAccount ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label>Identifiant de connexion</Label>
                <Input value={phone || "—"} disabled />
                {!phone ? (
                  <p className="mt-1 text-xs text-error-500">Renseignez le téléphone ci-dessus pour créer un compte.</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">L&apos;employé se connecte avec ce numéro.</p>
                )}
              </div>
              <div>
                <Label htmlFor="accountRole">Rôle</Label>
                <Select id="accountRole" {...register("accountRole")}>
                  <option value="ADMIN">Administrateur (accès complet)</option>
                  <option value="AGENT">Agent (pointage uniquement)</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="accountPassword">Mot de passe initial</Label>
                <PasswordInput id="accountPassword" {...register("accountPassword")} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
