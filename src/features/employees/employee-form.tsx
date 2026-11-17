"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
});

export type EmployeeFormValues = z.infer<typeof schema>;

export function EmployeeForm({
  defaultValues,
  onSubmit,
  submitLabel = "Enregistrer",
  disableMatricule = false,
}: {
  defaultValues: EmployeeInput;
  onSubmit: (values: EmployeeFormValues) => void;
  submitLabel?: string;
  disableMatricule?: boolean;
}) {
  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: () => listPositions(0, 200),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

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

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
