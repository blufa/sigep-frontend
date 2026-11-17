"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/providers/auth-provider";
import { GridIcon, TableIcon, TimeIcon, UserCircleIcon } from "@/icons/index";

const MOBILE_TABS = [
  { key: "dashboard", icon: GridIcon, label: "Accueil", href: "/dashboard" },
  { key: "scan", icon: TimeIcon, label: "Scanner", href: "/attendance/scan" },
  { key: "attendance", icon: TableIcon, label: "Pointage", href: "/attendance" },
  { key: "employees", icon: UserCircleIcon, label: "Employés", href: "/employees" },
];

/**
 * Barre d'onglets fixe en bas d'écran, uniquement sur mobile — même pattern que
 * lacaeducation-ui/components/layout/mobile-tab-bar.tsx : accès direct aux actions les plus
 * fréquentes (scan/pointage/employés), plus un onglet « Plus » qui ouvre le tiroir de navigation
 * complet (postes, badges, utilisateurs, paramètres).
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  const { user } = useAuth();

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // Les onglets ci-dessus sont tous des pages de tenant : un SUPER_ADMIN n'en a aucun.
  if (user?.role === "SUPER_ADMIN") {
    return null;
  }

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:hidden ${
        isMobileOpen ? "hidden" : ""
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${MOBILE_TABS.length + 1}, minmax(0, 1fr))` }}>
        {MOBILE_TABS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 py-2"
            >
              <item.icon className={`h-5 w-5 ${active ? "text-brand-600" : "text-gray-400"}`} />
              <span className={`max-w-full truncate px-0.5 text-[11px] font-medium ${active ? "text-brand-600" : "text-gray-500"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        <button type="button" onClick={toggleMobileSidebar} className="flex flex-col items-center justify-center gap-1 py-2">
          <Menu className="h-5 w-5 text-gray-400" />
          <span className="text-[11px] font-medium text-gray-500">Plus</span>
        </button>
      </div>
    </nav>
  );
}
