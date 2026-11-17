export type Genre = "HOMME" | "FEMME";

export interface Position {
  id: number;
  title: string;
  code: string;
  active: boolean;
}

export interface PositionInput {
  title: string;
  code: string;
  active: boolean;
}

export interface Employee {
  id: number;
  matricule: string;
  lastName: string;
  firstName: string;
  hierarchie: string | null;
  genre: Genre;
  positionId: number | null;
  phone: string | null;
  city: string | null;
  active: boolean;
}

export interface EmployeeInput {
  matricule: string;
  lastName: string;
  firstName: string;
  hierarchie: string;
  genre: Genre;
  positionId: number | null;
  phone: string;
  city: string;
  active: boolean;
}
