"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmployeeForm, EmployeeFormValues } from "@/features/employees/employee-form";
import { EmployeePhotoUpload } from "@/components/employees/employee-photo-upload";
import { getEmployee, getEmployeePhotoUrl, updateEmployee, uploadEmployeePhoto } from "@/lib/api/employees";
import { extractErrorMessage } from "@/lib/api/client";

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const employeeId = Number(id);
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => getEmployee(employeeId),
  });

  useEffect(() => {
    getEmployeePhotoUrl(employeeId).then(setPhotoUrl);
  }, [employeeId]);

  async function handlePhotoUpload(file: File) {
    try {
      await uploadEmployeePhoto(employeeId, file);
      setPhotoUrl(await getEmployeePhotoUrl(employeeId));
      toast.success("Photo mise à jour");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec de l'envoi de la photo"));
    }
  }

  async function handleSubmit(values: EmployeeFormValues) {
    try {
      await updateEmployee(employeeId, values);
      toast.success("Employé mis à jour");
      router.push("/employees");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec de la mise à jour"));
    }
  }

  return (
    <div>
      <PageHeader title="Modifier l'employé" description="Mettre à jour la fiche de l'employé." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Photo d&apos;identité</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeePhotoUpload photoUrl={photoUrl} onUpload={handlePhotoUpload} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {isLoading || !employee ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : (
            <EmployeeForm
              defaultValues={{
                matricule: employee.matricule,
                lastName: employee.lastName,
                firstName: employee.firstName,
                hierarchie: employee.hierarchie ?? "",
                genre: employee.genre,
                positionId: employee.positionId,
                phone: employee.phone ?? "",
                city: employee.city ?? "",
                active: employee.active,
              }}
              onSubmit={handleSubmit}
              submitLabel="Enregistrer les modifications"
              disableMatricule
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
