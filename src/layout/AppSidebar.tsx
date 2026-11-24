"use client";
import React, { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "@/providers/auth-provider";
import {
  BoxCubeIcon,
  DocsIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PlugInIcon,
  TableIcon,
  TimeIcon,
  UserCircleIcon,
} from "../icons/index";

export type MenuKey =
  | "dashboard"
  | "employees"
  | "positions"
  | "badges"
  | "attendance"
  | "scan"
  | "users"
  | "settings";

type NavItem = {
  key: MenuKey;
  name: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { key: "dashboard", icon: <GridIcon />, name: "Tableau de bord", path: "/dashboard" },
  { key: "employees", icon: <UserCircleIcon />, name: "Employés", path: "/employees" },
  { key: "positions", icon: <ListIcon />, name: "Postes et fonctions", path: "/positions" },
  { key: "badges", icon: <BoxCubeIcon />, name: "Badges", path: "/badges" },
  { key: "attendance", icon: <TableIcon />, name: "Pointage", path: "/attendance" },
  { key: "scan", icon: <TimeIcon />, name: "Scanner un badge", path: "/attendance/scan" },
  { key: "users", icon: <PlugInIcon />, name: "Utilisateurs", path: "/users", adminOnly: true },
  { key: "settings", icon: <DocsIcon />, name: "Paramètres", path: "/settings", adminOnly: true },
];

// Un SUPER_ADMIN ne gère aucun tenant : seule la page de gestion des services s'applique.
// `key` n'est pas exploité pour cette liste (jamais filtrée par allowedMenus, voir isPlatformView) —
// valeur réutilisée seulement pour satisfaire le typage commun avec `navItems`.
const superAdminNavItems: NavItem[] = [
  { key: "dashboard", icon: <ListIcon />, name: "Services (tenants)", path: "/super-admin/services" },
];

/** Réutilisé par la page Utilisateurs pour construire les cases à cocher d'assignation de menus. */
export const ALL_MENU_ITEMS: { key: MenuKey; label: string; adminOnly?: boolean }[] = navItems.map((nav) => ({
  key: nav.key,
  label: nav.name,
  adminOnly: nav.adminOnly,
}));

/** Résout la clé de menu correspondant à un chemin (y compris ses sous-pages, ex. /employees/123 →
 * "employees") — utilisé par `(app)/layout.tsx` pour rediriger un utilisateur restreint qui
 * tenterait d'accéder directement (URL tapée à la main) à une page hors de ses menus assignés. */
export function resolveMenuKeyForPath(pathname: string): MenuKey | null {
  const match = navItems
    .filter((nav) => pathname === nav.path || pathname.startsWith(`${nav.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.key ?? null;
}

/** Première page accessible à un compte (ex. un vigile restreint à "Scanner un badge" doit
 * atterrir là après connexion, pas sur un tableau de bord qu'il n'a pas le droit de voir) —
 * utilisé par la page de connexion et par le garde de route de `(app)/layout.tsx`. */
export function resolveDefaultPathForUser(allowedMenus: string[] | null | undefined): string {
  if (!allowedMenus || allowedMenus.length === 0) {
    return "/dashboard";
  }
  const firstAllowed = navItems.find((nav) => allowedMenus.includes(nav.key));
  return firstAllowed?.path ?? "/dashboard";
}

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, closeMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const { user, isSuperAdmin, impersonatedTenantId } = useAuth();

  const isActive = useCallback((path: string) => path === pathname, [pathname]);
  const isPlatformView = isSuperAdmin && impersonatedTenantId == null;
  const allowedMenus = user?.allowedMenus;
  const visibleNavItems = isPlatformView
    ? superAdminNavItems
    : navItems
        .filter((nav) => !nav.adminOnly || user?.role === "ADMIN")
        // Menus assignés par l'administrateur (voir page Utilisateurs) — ex. un compte vigile peut
        // n'avoir accès qu'à "Scanner un badge", sans voir le tableau de bord ni les effectifs.
        .filter((nav) => !allowedMenus || allowedMenus.includes(nav.key));

  return (
    <aside
      className={`fixed bottom-0 top-16 flex flex-col px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 transition-all duration-300 ease-in-out z-40 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/" onClick={closeMobileSidebar} className="flex flex-col">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <span className="text-[11px] uppercase tracking-wide text-gray-400">MENET-FP</span>
              <span className="text-lg font-bold text-brand-600">SIGAP</span>
            </>
          ) : (
            <span className="text-lg font-bold text-brand-600">S</span>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
              </h2>
              <ul className="flex flex-col gap-4">
                {visibleNavItems.map((nav) => (
                  <li key={nav.name}>
                    <Link
                      href={nav.path}
                      onClick={closeMobileSidebar}
                      className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
                    >
                      <span className={isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                        {nav.icon}
                      </span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <span className="menu-item-text">{nav.name}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
