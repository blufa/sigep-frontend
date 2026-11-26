"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, UserCheck, Gauge, Clock, LogOut, FileDown, ArrowRight, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { AttendanceDonutChart } from "@/components/charts/attendance-donut-chart";
import { PositionBreakdownChart } from "@/components/charts/position-breakdown-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { PdfPreviewModal } from "@/components/ui/pdf-preview-modal";
import { getAttendanceHistory, getAttendanceSummary, getMonthlyAttendanceReportPdfBlobUrl } from "@/lib/api/attendance";
import { listEmployees } from "@/lib/api/employees";
import { listPositions } from "@/lib/api/positions";
import { getOrganization } from "@/lib/api/organization";
import { extractErrorMessage } from "@/lib/api/client";

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${accent}`}>{icon}</div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-0.5 text-2xl font-semibold text-gray-800 dark:text-white/90">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [reportMonth, setReportMonth] = useState(currentMonthValue());
  const [isLoadingReportPreview, setIsLoadingReportPreview] = useState(false);
  const [reportPreviewUrl, setReportPreviewUrl] = useState<string | null>(null);
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["attendance-summary"],
    queryFn: getAttendanceSummary,
    refetchInterval: 30_000,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees", "dashboard"],
    queryFn: () => listEmployees(0, 200),
  });

  const { data: positions } = useQuery({
    queryKey: ["positions", "dashboard"],
    queryFn: () => listPositions(0, 200),
  });

  const { data: recent } = useQuery({
    queryKey: ["attendance-recent"],
    queryFn: () => getAttendanceHistory({ size: 5, sort: "scannedAt,desc" }),
    refetchInterval: 30_000,
  });

  const { data: organization } = useQuery({
    queryKey: ["organization", "dashboard"],
    queryFn: getOrganization,
  });

  const activeEmployees = (employees?.items ?? []).filter((e) => e.active);
  const hommeCount = activeEmployees.filter((e) => e.genre === "HOMME").length;
  const femmeCount = activeEmployees.filter((e) => e.genre === "FEMME").length;

  const positionTitleById = new Map((positions?.items ?? []).map((p) => [p.id, p.title]));
  const countByPosition = new Map<string, number>();
  for (const employee of activeEmployees) {
    const title = employee.positionId ? positionTitleById.get(employee.positionId) ?? "Sans poste" : "Sans poste";
    countByPosition.set(title, (countByPosition.get(title) ?? 0) + 1);
  }
  const positionBreakdown = Array.from(countByPosition.entries()).map(([label, count]) => ({ label, count }));

  const totalToday = (summary?.onTimeToday ?? 0) + (summary?.lateToday ?? 0);
  const presenceRate =
    summary && summary.totalActiveEmployees > 0 ? Math.round((totalToday / summary.totalActiveEmployees) * 100) : 0;

  async function handlePreviewMonthlyReport() {
    const [yearStr, monthStr] = reportMonth.split("-");
    setIsReportPreviewOpen(true);
    setIsLoadingReportPreview(true);
    try {
      const url = await getMonthlyAttendanceReportPdfBlobUrl(Number(yearStr), Number(monthStr));
      setReportPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
    } catch (error) {
      toast.error(extractErrorMessage(error, "Échec de la génération du rapport mensuel"));
      setIsReportPreviewOpen(false);
    } finally {
      setIsLoadingReportPreview(false);
    }
  }

  function handleCloseReportPreview() {
    setIsReportPreviewOpen(false);
  }

  function handleDownloadReportFromPreview() {
    if (!reportPreviewUrl) return;
    const [yearStr, monthStr] = reportMonth.split("-");
    const link = document.createElement("a");
    link.href = reportPreviewUrl;
    link.download = `rapport-mensuel-presence-${yearStr}-${monthStr.padStart(2, "0")}.pdf`;
    link.click();
  }

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble des effectifs et des présences."
        actions={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
            />
            <Button variant="outline" onClick={handlePreviewMonthlyReport} disabled={isLoadingReportPreview}>
              <FileDown className="mr-1.5 h-4 w-4" /> Rapport mensuel (PDF)
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={<Users className="h-5 w-5 text-brand-600" />}
          label="Employés actifs"
          value={isLoadingSummary ? "—" : String(summary?.totalActiveEmployees ?? 0)}
          accent="bg-brand-50"
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5 text-success-600" />}
          label="Présents maintenant"
          value={isLoadingSummary ? "—" : String(summary?.presentToday ?? 0)}
          accent="bg-success-50"
        />
        <StatCard
          icon={<Gauge className="h-5 w-5 text-brand-600" />}
          label="Taux de présence du jour"
          value={isLoadingSummary ? "—" : `${presenceRate}%`}
          accent="bg-brand-50"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-warning-600" />}
          label="Retards aujourd'hui"
          value={isLoadingSummary ? "—" : String(summary?.lateToday ?? 0)}
          accent="bg-warning-50"
        />
        <StatCard
          icon={<LogOut className="h-5 w-5 text-error-600" />}
          label="Départs anticipés"
          value={isLoadingSummary ? "—" : String(summary?.earlyDepartureToday ?? 0)}
          accent="bg-error-50"
        />
        <StatCard
          icon={<Briefcase className="h-5 w-5 text-gray-600" />}
          label="En mission aujourd'hui"
          value={isLoadingSummary ? "—" : String(summary?.onMissionToday ?? 0)}
          accent="bg-gray-100"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Analyse des présences du jour</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary || !summary ? (
              <p className="text-sm text-gray-500">Chargement…</p>
            ) : (
              <AttendanceDonutChart onTime={summary.onTimeToday} late={summary.lateToday} absent={summary.absentToday} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des effectifs par poste</CardTitle>
          </CardHeader>
          <CardContent>
            <PositionBreakdownChart data={positionBreakdown} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Effectifs par genre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Hommes", count: hommeCount, color: "bg-brand-500" },
                { label: "Femmes", count: femmeCount, color: "bg-success-500" },
              ].map((item) => {
                const total = hommeCount + femmeCount;
                const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {item.count} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Activité récente</CardTitle>
            <Link
              href="/attendance"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
            >
              Voir tout <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <RecentActivity
              entries={recent?.items ?? []}
              workStartTime={organization?.workStartTime}
              workEndTime={organization?.workEndTime}
            />
          </CardContent>
        </Card>
      </div>

      <PdfPreviewModal
        isOpen={isReportPreviewOpen}
        onClose={handleCloseReportPreview}
        pdfUrl={isLoadingReportPreview ? null : reportPreviewUrl}
        title={`Rapport mensuel de présence — ${reportMonth}`}
        onDownload={handleDownloadReportFromPreview}
      />
    </div>
  );
}
