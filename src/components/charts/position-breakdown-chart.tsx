"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function PositionBreakdownChart({ data }: { data: { label: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">Aucun employé rattaché à un poste pour l&apos;instant.</p>;
  }

  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 8);

  const options: ApexOptions = {
    chart: { fontFamily: "Outfit, sans-serif", type: "bar", toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "55%" } },
    colors: ["#465FFF"],
    dataLabels: { enabled: false },
    xaxis: { categories: sorted.map((item) => item.label), labels: { style: { fontSize: "12px" } } },
    grid: { strokeDashArray: 4 },
  };

  return (
    <ReactApexChart
      options={options}
      series={[{ name: "Employés", data: sorted.map((item) => item.count) }]}
      type="bar"
      height={Math.max(220, sorted.length * 44)}
    />
  );
}
