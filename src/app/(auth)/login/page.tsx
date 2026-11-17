"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { extractErrorMessage } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(username, password);
      router.replace(loggedInUser.role === "SUPER_ADMIN" ? "/super-admin/services" : "/dashboard");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Identifiant ou mot de passe incorrect"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 border-b-4 border-brand-500 pb-4 text-center">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            République de Guinée — MENET-FP
          </p>
          <h1 className="mt-1 text-lg font-semibold text-brand-600">
            Service National des Infrastructures et Équipements Scolaires et Maintenances
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-sm border border-gray-200 bg-white p-6"
        >
          <h2 className="mb-4 text-base font-semibold text-gray-800">Connexion</h2>

          <div className="mb-4">
            <Label htmlFor="username">Identifiant</Label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <Label htmlFor="password">Mot de passe</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Connexion en cours…" : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
