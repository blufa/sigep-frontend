"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmployeeForm, EmployeeFormValues, toEmployeeInput } from "@/features/employees/employee-form";
import { createEmployee } from "@/lib/api/employees";
import { createUser } from "@/lib/api/users";
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
  createAccount: false,
  accountRole: "AGENT" as const,
  accountPassword: "",
};

export default function NewEmployeePage() {
  const router = useRouter();

  async function handleSubmit(values: EmployeeFormValues) {
    if (values.createAccount) {
      if (!values.phone.trim()) {
        toast.error("Renseignez le téléphone de l'employé pour lui créer un compte.");
        return;
      }
      if (!values.accountPassword || values.accountPassword.length < 8) {
        toast.error("Le mot de passe du compte doit contenir au moins 8 caractères.");
        return;
      }
    }

    let employee;
    try {
      employee = await createEmployee(toEmployeeInput(values));
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec de la création de l'employé"));
      return;
    }

    if (values.createAccount) {
      try {
        await createUser({
          username: values.phone.trim(),
          fullName: `${values.firstName} ${values.lastName}`.trim(),
          password: values.accountPassword!,
          role: values.accountRole,
          employeeId: employee.id,
        });
        toast.success("Employé créé — compte de connexion prêt (identifiant : son téléphone)");
      } catch (error) {
        toast.error(
          extractErrorMessage(error, "Employé créé, mais échec de la création du compte de connexion"),
        );
        router.push("/employees");
        return;
      }
    } else {
      toast.success("Employé créé");
    }

    router.push("/employees");
  }

  return (
    <div>
      <PageHeader title="Nouvel employé" description="Créer la fiche d'un employé." />
      <Card>
        <CardContent>
          <EmployeeForm
            defaultValues={DEFAULT_VALUES}
            onSubmit={handleSubmit}
            submitLabel="Créer l'employé"
            showAccountCreation
          />
        </CardContent>
      </Card>
    </div>
  );
}
