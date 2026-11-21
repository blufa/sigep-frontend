"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppHeader from "@/layout/AppHeader";
import AppSidebar, { resolveMenuKeyForPath } from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { MobileTabBar } from "@/layout/MobileTabBar";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/providers/auth-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Un SUPER_ADMIN n'a pas de tenant : les pages métier (tableau de bord, employés…)
  // appellent des endpoints qui exigent un tenant courant et échoueraient pour lui.
  const isSuperAdminSection = pathname.startsWith("/super-admin");

  useEffect(() => {
    if (isLoading || !user) {
      return;
    }
    if (user.role === "SUPER_ADMIN" && !isSuperAdminSection) {
      router.replace("/super-admin/services");
    } else if (user.role !== "SUPER_ADMIN" && isSuperAdminSection) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, isSuperAdminSection, router]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // Un compte restreint (menus assignés par son administrateur — voir page Utilisateurs) qui
  // accède directement par URL à une page hors de ses menus en est renvoyé vers le tableau de bord,
  // toujours autorisé — même règle que le filtrage de la barre latérale (AppSidebar).
  useEffect(() => {
    if (isLoading || !user || isSuperAdminSection || !user.allowedMenus) {
      return;
    }
    const menuKey = resolveMenuKeyForPath(pathname);
    if (menuKey && menuKey !== "dashboard" && !user.allowedMenus.includes(menuKey)) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, pathname, isSuperAdminSection, router]);

  if (isLoading || !user) {
    return null;
  }
  if ((user.role === "SUPER_ADMIN") !== isSuperAdminSection) {
    return null;
  }

  // Header et sidebar sont `fixed` (ne défilent jamais) ; seul ce contenu, poussé sous le header
  // fixe via padding-top, défile normalement avec la page — même structure que
  // lacaeducation-ui/components/layout/app-shell.tsx (HEADER_HEIGHT=64 ⇔ ici pt-16/h-16).
  const mainContentMargin = isMobileOpen ? "ml-0" : isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";
  const footerLeft = isMobileOpen ? "left-0" : isExpanded || isHovered ? "left-0 lg:left-[290px]" : "left-0 lg:left-[90px]";

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <AppHeader />
        <AppSidebar />
        <Backdrop />
      </div>

      <main
        className={`pt-16 pb-24 transition-all duration-300 ease-in-out sm:pb-16 ${mainContentMargin} print:ml-0 print:pt-0 print:pb-0`}
      >
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6 print:p-0 print:max-w-none">{children}</div>
      </main>

      <footer
        className={`fixed bottom-0 right-0 z-30 hidden border-t border-gray-200 bg-white py-2.5 text-center text-xs text-gray-400 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 sm:block print:hidden ${footerLeft}`}
      >
        République de Guinée — MENET-FP · SIGAP © {new Date().getFullYear()}
      </footer>

      <div className="print:hidden">
        <MobileTabBar />
      </div>
    </div>
  );
}
