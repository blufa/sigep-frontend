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

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Tableau de bord", path: "/dashboard" },
  { icon: <UserCircleIcon />, name: "Employés", path: "/employees" },
  { icon: <ListIcon />, name: "Postes et fonctions", path: "/positions" },
  { icon: <BoxCubeIcon />, name: "Badges", path: "/badges" },
  { icon: <TableIcon />, name: "Pointage", path: "/attendance" },
  { icon: <TimeIcon />, name: "Scanner un badge", path: "/attendance/scan" },
  { icon: <PlugInIcon />, name: "Utilisateurs", path: "/users", adminOnly: true },
  { icon: <DocsIcon />, name: "Paramètres", path: "/settings", adminOnly: true },
];

// Un SUPER_ADMIN ne gère aucun tenant : seule la page de gestion des services s'applique.
const superAdminNavItems: NavItem[] = [
  { icon: <ListIcon />, name: "Services (tenants)", path: "/super-admin/services" },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { user, isSuperAdmin, impersonatedTenantId } = useAuth();

  const isActive = useCallback((path: string) => path === pathname, [pathname]);
  const isPlatformView = isSuperAdmin && impersonatedTenantId == null;
  const visibleNavItems = isPlatformView
    ? superAdminNavItems
    : navItems.filter((nav) => !nav.adminOnly || user?.role === "ADMIN");

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
        <Link href="/" className="flex flex-col">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <span className="text-[11px] uppercase tracking-wide text-gray-400">MENET-FP</span>
              <span className="text-lg font-bold text-brand-600">SIGEP</span>
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
