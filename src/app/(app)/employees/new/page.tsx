"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmployeeForm, EmployeeFormValues } from "@/features/employees/employee-form";
import { createEmployee } from "@/lib/api/employees";
import { extractErrorMessage } from "@/lib/api/client";

const DEFAULT_VALUES = {
  matricule: "",
  lastName: "",
  firstName: "",
  hierarchie: "",
  genre: "HOMME" as const,
  positionId: null,
  phone: "",
  city: "",
  active: true,
};

export default function NewEmployeePage() {
  const router = useRouter();

  async function handleSubmit(values: EmployeeFormValues) {
    try {
      await createEmployee(values);
      toast.success("Employé créé");
      router.push("/employees");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec de la création de l'employé"));
    }
  }

  return (
    <div>
      <PageHeader title="Nouvel employé" description="Créer la fiche d'un employé." />
      <Card>
        <CardContent>
          <EmployeeForm defaultValues={DEFAULT_VALUES} onSubmit={handleSubmit} submitLabel="Créer l'employé" />
        </CardContent>
      </Card>
    </div>
  );
}
