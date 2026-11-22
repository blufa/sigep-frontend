"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function AttendanceDonutChart({
  onTime,
  late,
  absent,
}: {
  onTime: number;
  late: number;
  absent: number;
}) {
  const series = [onTime, late, absent];
  const total = onTime + late + absent;

  const options: ApexOptions = {
    chart: { fontFamily: "Outfit, sans-serif", type: "donut" },
    labels: ["Présents à l'heure", "Retards", "Absences"],
    colors: ["#12B76A", "#F79009", "#F04438"],
    legend: { position: "bottom", fontFamily: "Outfit, sans-serif" },
    dataLabels: { enabled: total > 0 },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: "Effectif actif",
              formatter: () => String(total),
            },
          },
        },
      },
    },
    stroke: { width: 0 },
  };

  if (total === 0) {
    return <p className="text-sm text-gray-500">Aucune donnée de présence pour l&apos;instant.</p>;
  }

  return (
    <div className="overflow-hidden">
      <ReactApexChart options={options} series={series} type="donut" height={300} width="100%" />
    </div>
  );
}
