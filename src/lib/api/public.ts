import axios from "axios";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8085"}/api`;

// Client dédié aux endpoints publics (sans authentification) — jamais d'Authorization, jamais le
// redirect-to-login global du client admin (src/lib/api/client.ts), même si un jeton (expiré ou
// non) traîne dans le localStorage d'un précédent utilisateur sur la même machine.
const publicHttp = axios.create({ baseURL: BASE_URL, timeout: 15_000 });

export interface PublicBadgeVerification {
  valid: boolean;
  matricule: string | null;
  fullName: string | null;
  positionTitle: string | null;
  hierarchie: string | null;
  hasPhoto: boolean;
}

/** Vérification par jeton QR (scan caméra) — le jeton n'est lisible que par la caméra. */
export async function verifyBadgePublic(token: string): Promise<PublicBadgeVerification> {
  const { data } = await publicHttp.get<PublicBadgeVerification>("/public/badges/verify", { params: { token } });
  return data;
}

export function publicBadgePhotoUrl(token: string): string {
  return `${BASE_URL}/public/badges/verify/photo?token=${encodeURIComponent(token)}`;
}

/** Vérification par matricule (saisie manuelle) — c'est le matricule qui est imprimé en clair sur le badge. */
export async function verifyBadgeByMatricule(matricule: string): Promise<PublicBadgeVerification> {
  const { data } = await publicHttp.get<PublicBadgeVerification>("/public/badges/verify-by-matricule", {
    params: { matricule },
  });
  return data;
}

export function publicBadgePhotoUrlByMatricule(matricule: string): string {
  return `${BASE_URL}/public/badges/verify-by-matricule/photo?matricule=${encodeURIComponent(matricule)}`;
}

export interface PublicOrganization {
  ministryName: string | null;
  serviceName: string | null;
  hasLogo: boolean;
}

export async function getPublicOrganization(): Promise<PublicOrganization> {
  const { data } = await publicHttp.get<PublicOrganization>("/public/organization");
  return data;
}

export function publicOrganizationLogoUrl(): string {
  return `${BASE_URL}/public/organization/logo`;
}

