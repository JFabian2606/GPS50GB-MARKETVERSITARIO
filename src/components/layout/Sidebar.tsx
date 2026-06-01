"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Package, User, 
  Heart, Settings, LogOut, Sparkles,
  BarChart3, Users, ShieldCheck, GraduationCap
} from "lucide-react";

interface SidebarProps {
  userProfile: any;
  userAuth: any;
}

export default function Sidebar({ userProfile, userAuth }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = userProfile?.rol === 'admin' || userProfile?.rol === 'superadmin';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  };

  const navLink = (href: string, icon: React.ReactNode, label: string, exact = false) => {
    const isActive = exact ? pathname === href : pathname?.startsWith(href);
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-[14px] transition-colors ${
          isActive ? 'bg-[#F8F7FF] text-[#534AB7] font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 z-20 hidden lg:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div>
        {/* Logo */}
        <div className="h-20 flex items-center px-8 border-b border-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6055D0] to-[#534AB7] flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[18px] text-slate-800 tracking-tight">Market<span className="text-[#534AB7]">Versitario</span></span>
          </div>
        </div>

        {/* Menú Principal */}
        <div className="px-5 py-6">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Navegación</p>
          <nav className="space-y-1.5">

            {/* Dashboard Analytics — solo admin */}
            {isAdmin && navLink('/admin/dashboard', <BarChart3 className="w-4 h-4" />, 'Métricas')}

            {/* Feed — solo usuarios no admin */}
            {!isAdmin && navLink('/', <LayoutDashboard className="w-4 h-4" />, 'Explorar Feed', true)}

            {/* Publicaciones — todos */}
            {navLink('/publicaciones', <Package className="w-4 h-4" />, isAdmin ? 'Publicaciones' : 'Mis Publicaciones', true)}

            {/* Mi Perfil / Tutorías — solo no admin */}
            {userProfile && !isAdmin && navLink(
              `/usuarios/${userAuth?.id}`,
              <User className="w-4 h-4" strokeWidth={2} />,
              'Mi Perfil / Tutorías',
              true
            )}

            {/* Usuarios — solo admin */}
            {isAdmin && navLink('/usuarios', <Users className="w-4 h-4" />, 'Usuarios')}

            {/* Auditoría de Ventas — solo admin */}
            {isAdmin && navLink('/admin/auditoria', <ShieldCheck className="w-4 h-4" />, 'Auditoría')}

            {/* Solicitudes de Tutor — solo admin */}
            {isAdmin && navLink('/admin/tutores', <GraduationCap className="w-4 h-4" />, 'Solicitudes Tutor')}

            {/* Guardados — solo usuarios no admin */}
            {!isAdmin && navLink('/guardados', <Heart className="w-4 h-4" />, 'Guardados')}
          </nav>
        </div>
      </div>

      {/* Menú Inferior */}
      <div className="px-5 py-6 border-t border-slate-50">
        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ajustes</p>
        <nav className="space-y-1.5">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl font-medium text-[14px] transition-colors">
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </a>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl font-medium text-[14px] transition-colors mt-2">
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
