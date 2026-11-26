"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectSearch } from "@/components/ui/select-search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { cancelMission, createMission, listMissions } from "@/lib/api/missions";
import { listEmployees } from "@/lib/api/employees";
import { extractErrorMessage } from "@/lib/api/client";

const schema = z.object({
  employeeId: z.string().min(1, "L'employé est requis"),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().min(1, "La date de fin est requise"),
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function MissionsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["missions", page],
    queryFn: () => listMissions({ page, size: 20 }),
  });

  const { data: employees } = useQuery({
    queryKey: ["employees", "missions"],
    queryFn: () => listEmployees(0, 200),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { employeeId: "", startDate: "", endDate: "", reason: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      createMission({
        employeeId: Number(values.employeeId),
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason || undefined,
      }),
    onSuccess: () => {
      toast.success("Mission enregistrée — l'employé ne sera pas compté absent sur cette période");
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      setShowForm(false);
      reset({ employeeId: "", startDate: "", endDate: "", reason: "" });
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de l'enregistrement de la mission")),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelMission,
    onSuccess: () => {
      toast.success("Mission annulée");
      queryClient.invalidateQueries({ queryKey: ["missions"] });
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de l'annulation")),
  });

  return (
    <div>
      <PageHeader
        title="Missions"
        description="Un employé en mission officielle n'est pas compté absent pendant cette période."
        actions={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Fermer" : "Nouvelle mission"}</Button>}
      />

      {showForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nouvelle mission</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => createMutation.mutate(values))}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:items-end"
            >
              <div className="lg:col-span-2">
                <Label htmlFor="mission-employee">Employé</Label>
                <Controller
                  control={control}
                  name="employeeId"
                  render={({ field }) => (
                    <SelectSearch
                      id="mission-employee"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Rechercher un employé…"
                      options={(employees?.items ?? []).map((employee) => ({
                        value: String(employee.id),
                        label: `${employee.lastName} ${employee.firstName}`,
                      }))}
                    />
                  )}
                />
                {errors.employeeId ? <p className="mt-1 text-xs text-error-500">{errors.employeeId.message}</p> : null}
              </div>
              <div>
                <Label htmlFor="mission-start">Du</Label>
                <Input id="mission-start" type="date" {...register("startDate")} />
                {errors.startDate ? <p className="mt-1 text-xs text-error-500">{errors.startDate.message}</p> : null}
              </div>
              <div>
                <Label htmlFor="mission-end">Au</Label>
                <Input id="mission-end" type="date" {...register("endDate")} />
                {errors.endDate ? <p className="mt-1 text-xs text-error-500">{errors.endDate.message}</p> : null}
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <Label htmlFor="mission-reason">Motif (optionnel)</Label>
                <Input id="mission-reason" {...register("reason")} placeholder="Ex. Mission à Kankan — inspection" />
              </div>
              <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
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
                {["Employé", "Matricule", "Du", "Au", "Motif", ""].map((label) => (
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
              {data?.items.map((mission) => (
                <TableRow key={mission.id}>
                  <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                    {mission.employeeFullName ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {mission.matricule ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {dayjs(mission.startDate).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {dayjs(mission.endDate).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {mission.reason ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate(mission.id)}>
                      Annuler
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-4 text-sm text-gray-500">
                    Aucune mission enregistrée.
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
