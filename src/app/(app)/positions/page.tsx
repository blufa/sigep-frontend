"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { createPosition, listPositions, updatePosition } from "@/lib/api/positions";
import { extractErrorMessage } from "@/lib/api/client";
import { Position } from "@/lib/types/staff";

const schema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  code: z.string().min(1, "Le code est requis"),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function PositionsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Position | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["positions", page],
    queryFn: () => listPositions(page, 20),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", code: "", active: true },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing ? updatePosition(editing.id, values) : createPosition(values),
    onSuccess: () => {
      toast.success(editing ? "Poste mis à jour" : "Poste créé");
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setShowForm(false);
      setEditing(null);
      reset({ title: "", code: "", active: true });
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de l'enregistrement")),
  });

  function openCreate() {
    setEditing(null);
    reset({ title: "", code: "", active: true });
    setShowForm(true);
  }

  function openEdit(position: Position) {
    setEditing(position);
    reset(position);
    setShowForm(true);
  }

  return (
    <div>
      <PageHeader
        title="Postes et fonctions"
        actions={<Button onClick={openCreate}>Nouveau poste</Button>}
      />

      {showForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? "Modifier le poste" : "Nouveau poste"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => mutation.mutate(values))}
              className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end"
            >
              <div>
                <Label htmlFor="title">Titre du poste</Label>
                <Input id="title" {...register("title")} />
                {errors.title ? <p className="mt-1 text-xs text-error-500">{errors.title.message}</p> : null}
              </div>
              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" {...register("code")} />
                {errors.code ? <p className="mt-1 text-xs text-error-500">{errors.code.message}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <input id="active" type="checkbox" {...register("active")} className="h-4 w-4" />
                <Label htmlFor="active" className="mb-0">Actif</Label>
              </div>
              <div className="flex gap-2 sm:col-span-3">
                <Button type="submit" disabled={isSubmitting}>
                  Enregistrer
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
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
                {["Titre", "Code", "Statut", ""].map((label) => (
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
                  <TableCell colSpan={4} className="px-5 py-4 text-sm text-gray-500">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : null}
              {data?.items.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                    {position.title}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {position.code}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <StatusBadge
                      label={position.active ? "Actif" : "Inactif"}
                      tone={position.active ? "success" : "neutral"}
                    />
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Button variant="outline" size="sm" onClick={() => openEdit(position)}>
                      Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-5 py-4 text-sm text-gray-500">
                    Aucun poste enregistré.
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
    </div>
  );
}
