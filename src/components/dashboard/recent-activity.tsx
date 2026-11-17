import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { AttendanceEntry } from "@/lib/types/attendance";

/** Compare l'heure (UTC) du pointage à un seuil "HH:mm:ss" — Africa/Conakry est UTC+0 toute
 * l'année (pas d'heure d'été), donc l'heure UTC du serveur correspond à l'heure locale réelle. */
function isAfterThreshold(scannedAt: string, threshold: string): boolean {
  const date = new Date(scannedAt);
  const [h, m] = threshold.split(":").map(Number);
  const minutesOfDay = date.getUTCHours() * 60 + date.getUTCMinutes();
  return minutesOfDay > h * 60 + m;
}

function isBeforeThreshold(scannedAt: string, threshold: string): boolean {
  const date = new Date(scannedAt);
  const [h, m] = threshold.split(":").map(Number);
  const minutesOfDay = date.getUTCHours() * 60 + date.getUTCMinutes();
  return minutesOfDay < h * 60 + m;
}

export function RecentActivity({
  entries,
  workStartTime,
  workEndTime,
}: {
  entries: AttendanceEntry[];
  /** "HH:mm:ss" — pour signaler un retard (entrée après) ou un départ anticipé (sortie avant). */
  workStartTime?: string | null;
  workEndTime?: string | null;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">Aucun pointage enregistré pour l&apos;instant.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {entries.map((entry) => {
        const isLate = entry.direction === "ENTREE" && workStartTime ? isAfterThreshold(entry.scannedAt, workStartTime) : false;
        const isEarlyDeparture =
          entry.direction === "SORTIE" && workEndTime ? isBeforeThreshold(entry.scannedAt, workEndTime) : false;

        return (
          <li key={entry.id} className="flex items-center gap-3 py-2.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                entry.direction === "ENTREE" ? "bg-success-50 text-success-600" : "bg-gray-100 text-gray-500"
              }`}
            >
              {entry.direction === "ENTREE" ? (
                <ArrowDownLeft className="h-4 w-4" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{entry.fullName}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-gray-500">{entry.direction === "ENTREE" ? "Entrée" : "Sortie"}</p>
                {isLate ? (
                  <span className="rounded-full bg-warning-50 px-1.5 py-0.5 text-[10px] font-semibold text-warning-600">
                    En retard
                  </span>
                ) : null}
                {isEarlyDeparture ? (
                  <span className="rounded-full bg-error-50 px-1.5 py-0.5 text-[10px] font-semibold text-error-600">
                    Départ anticipé
                  </span>
                ) : null}
              </div>
            </div>
            <p className="shrink-0 text-xs text-gray-400">
              {new Date(entry.scannedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
