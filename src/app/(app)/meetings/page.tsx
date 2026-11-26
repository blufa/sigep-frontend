"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { cancelMeeting, createMeeting, listMeetings, updateMeeting } from "@/lib/api/meetings";
import { listEmployees } from "@/lib/api/employees";
import { extractErrorMessage } from "@/lib/api/client";
import { Meeting } from "@/lib/types/meeting";

const schema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  scheduledAt: z.string().min(1, "La date/heure est requise"),
  location: z.string().optional(),
  attendeeEmployeeIds: z.array(z.string()).min(1, "Au moins un invité est requis"),
  notifyAt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function MeetingsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["meetings", page],
    queryFn: () => listMeetings(page, 20),
  });

  const { data: employees } = useQuery({
    queryKey: ["employees", "meetings"],
    queryFn: () => listEmployees(0, 200),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", scheduledAt: "", location: "", attendeeEmployeeIds: [], notifyAt: "" },
  });

  const selectedAttendeeIds = watch("attendeeEmployeeIds");
  const allEmployeeIds = (employees?.items ?? []).map((e) => String(e.id));
  const allSelected = allEmployeeIds.length > 0 && allEmployeeIds.every((id) => selectedAttendeeIds.includes(id));

  function toggleAttendee(employeeId: string, checked: boolean) {
    const next = checked
      ? [...selectedAttendeeIds, employeeId]
      : selectedAttendeeIds.filter((id) => id !== employeeId);
    setValue("attendeeEmployeeIds", next, { shouldValidate: true });
  }

  function toggleAll(checked: boolean) {
    setValue("attendeeEmployeeIds", checked ? allEmployeeIds : [], { shouldValidate: true });
  }

  function openCreate() {
    setEditing(null);
    reset({ title: "", description: "", scheduledAt: "", location: "", attendeeEmployeeIds: [], notifyAt: "" });
    setShowForm(true);
  }

  function openEdit(meeting: Meeting) {
    setEditing(meeting);
    reset({
      title: meeting.title,
      description: meeting.description ?? "",
      scheduledAt: dayjs(meeting.scheduledAt).format("YYYY-MM-DDTHH:mm"),
      location: meeting.location ?? "",
      attendeeEmployeeIds: meeting.attendees.map((a) => String(a.employeeId)),
      notifyAt: "",
    });
    setShowForm(true);
  }

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing
        ? updateMeeting(editing.id, {
            title: values.title,
            description: values.description || undefined,
            scheduledAt: new Date(values.scheduledAt).toISOString(),
            location: values.location || undefined,
            attendeeEmployeeIds: values.attendeeEmployeeIds.map(Number),
          })
        : createMeeting({
            title: values.title,
            description: values.description || undefined,
            scheduledAt: new Date(values.scheduledAt).toISOString(),
            location: values.location || undefined,
            attendeeEmployeeIds: values.attendeeEmployeeIds.map(Number),
            notifyAt: values.notifyAt ? new Date(values.notifyAt).toISOString() : undefined,
          }),
    onSuccess: (_, values) => {
      toast.success(
        editing
          ? "Réunion mise à jour"
          : values.notifyAt
            ? "Réunion programmée — le SMS de convocation sera envoyé à l'heure choisie"
            : "Réunion programmée — les invités ont été notifiés par SMS",
      );
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setShowForm(false);
      setEditing(null);
      reset({ title: "", description: "", scheduledAt: "", location: "", attendeeEmployeeIds: [], notifyAt: "" });
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de l'enregistrement de la réunion")),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelMeeting,
    onSuccess: () => {
      toast.success("Réunion annulée");
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (error) => toast.error(extractErrorMessage(error, "Échec de l'annulation")),
  });

  return (
    <div>
      <PageHeader
        title="Réunions"
        description="Programmer une réunion envoie automatiquement un SMS de convocation à chaque invité."
        actions={
          <Button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
              } else {
                openCreate();
              }
            }}
          >
            {showForm ? "Fermer" : "Nouvelle réunion"}
          </Button>
        }
      />

      {showForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? "Modifier la réunion" : "Nouvelle réunion"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <div>
                <Label htmlFor="meeting-title">Titre</Label>
                <Input id="meeting-title" {...register("title")} />
                {errors.title ? <p className="mt-1 text-xs text-error-500">{errors.title.message}</p> : null}
              </div>
              <div>
                <Label htmlFor="meeting-datetime">Date et heure</Label>
                <Input id="meeting-datetime" type="datetime-local" {...register("scheduledAt")} />
                {errors.scheduledAt ? <p className="mt-1 text-xs text-error-500">{errors.scheduledAt.message}</p> : null}
              </div>
              <div>
                <Label htmlFor="meeting-location">Lieu (optionnel)</Label>
                <Input id="meeting-location" {...register("location")} placeholder="Ex. Salle de réunion" />
              </div>
              <div>
                <Label htmlFor="meeting-description">Description (optionnel)</Label>
                <Input id="meeting-description" {...register("description")} />
              </div>
              {!editing ? (
                <div className="sm:col-span-2">
                  <Label htmlFor="meeting-notify-at">Programmer l&apos;envoi du SMS (optionnel)</Label>
                  <Input id="meeting-notify-at" type="datetime-local" {...register("notifyAt")} />
                  <p className="mt-1 text-xs text-gray-400">
                    Laisser vide pour envoyer la convocation immédiatement à l&apos;enregistrement.
                  </p>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="mb-0">Invités</Label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={allSelected}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                    Tout sélectionner
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-3 dark:border-gray-800">
                  {(employees?.items ?? []).map((employee) => (
                    <label key={employee.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedAttendeeIds.includes(String(employee.id))}
                        onChange={(e) => toggleAttendee(String(employee.id), e.target.checked)}
                      />
                      {employee.lastName} {employee.firstName}
                    </label>
                  ))}
                </div>
                {errors.attendeeEmployeeIds ? (
                  <p className="mt-1 text-xs text-error-500">{errors.attendeeEmployeeIds.message}</p>
                ) : null}
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={isSubmitting}>
                  {editing ? "Enregistrer" : "Programmer et envoyer les SMS"}
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
                {["Titre", "Date et heure", "Lieu", "Invités", "SMS", ""].map((label) => (
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
              {data?.items.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{meeting.title}</TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {dayjs(meeting.scheduledAt).format("DD/MM/YYYY HH:mm")}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {meeting.location ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {meeting.attendees.map((a) => a.fullName).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {meeting.notified
                      ? "Envoyé"
                      : meeting.notifyAt
                        ? `Programmé — ${dayjs(meeting.notifyAt).format("DD/MM/YYYY HH:mm")}`
                        : "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(meeting)}>
                        Modifier
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate(meeting.id)}>
                        Annuler
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-4 text-sm text-gray-500">
                    Aucune réunion programmée.
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
