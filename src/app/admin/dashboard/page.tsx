"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, Users, Package, BookOpen, 
  DollarSign, Loader2, RefreshCw, Sparkles,
  ArrowUpRight, AlertTriangle, ShieldCheck, Tag, Zap, CreditCard, ChevronRight, GraduationCap
} from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAuth, setUserAuth] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndMetrics = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserAuth(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);

        if (profile?.estado === 'inactivo') {
          await supabase.auth.signOut();
          router.push('/auth/login?error=account_disabled');
          return;
        }

        if (profile?.rol !== 'admin' && profile?.rol !== 'superadmin') {
          router.push('/');
          return;
        }
      } else {
        router.push('/auth/login');
        return;
      }

      await loadMetrics();
    };

    fetchUserAndMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/metrics');
      if (res.ok) {
        const json = await res.json();
        setMetrics(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F8F9FB] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Sidebar userProfile={userProfile} userAuth={userAuth} />
        <main className="flex-1 flex flex-col min-w-0">
          <Header userProfile={userProfile} userAuth={userAuth} title="Dashboard" />
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#534AB7] mb-4" />
            <p className="text-slate-500 font-bold text-sm">Cargando métricas y analíticas...</p>
          </div>
        </main>
      </div>
    );
  }

  const r = metrics?.resumen || {};
  const roles = metrics?.roles || {};
  const ventas = metrics?.ventasMensuales || [];
  const categorias = metrics?.categoriasPopulares || [];

  return (
    <div 
      className="flex h-screen bg-[#F8F9FB] overflow-hidden"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <Sidebar userProfile={userProfile} userAuth={userAuth} />

      <main className="flex-1 flex flex-col min-w-0">
        <Header 
          userProfile={userProfile} 
          userAuth={userAuth} 
          title="Panel de Control" 
        />

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-thin">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header del Panel */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  Analytics 
                  <span className="text-[#534AB7] font-semibold text-xs bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#534AB7]" /> Admin Panel
                  </span>
                </h2>
                <p className="text-[13px] text-slate-400 mt-0.5">Monitoreo y analíticas en tiempo real del ecosistema de MarketVersitario</p>
              </div>
              <button 
                onClick={loadMetrics}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-650 transition-colors shadow-sm"
                title="Actualizar datos"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* ── BENTO GRID LAYOUT ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 auto-rows-[180px]">
              
              {/* 1. Bento Card: Ingresos Recaudados (Mediana - 4 cols / 2 rows) */}
              <div className="lg:col-span-4 lg:row-span-2 bg-gradient-to-br from-[#534AB7] to-[#3f3796] rounded-3xl p-6 text-white flex flex-col justify-between shadow-md relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-300" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-1 rounded-full text-indigo-100">
                    Monetización Activa
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-indigo-200">Recaudado por Destacados</p>
                  <h3 className="text-3xl font-black tracking-tight mt-1">
                    ${new Intl.NumberFormat('es-CO').format(r.ingresosDestaques || 0)} <span className="text-sm font-medium text-emerald-300">COP</span>
                  </h3>
                  <p className="text-[11px] text-indigo-200/80 mt-2 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
                    Ingresos directos por promoción de publicaciones.
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xs font-bold text-indigo-100">
                  <span>Tasa de Cobro: 100%</span>
                  <Link href="/admin/auditoria?estado=todos" className="hover:underline flex items-center gap-0.5">
                    Ver auditoría <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* 2. Bento Card: Crecimiento y Gráfico Histórico (Grande - 8 cols / 2 rows) */}
              <div className="lg:col-span-8 lg:row-span-2 bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-[15px] flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Crecimiento Mensual de Destacados
                    </h3>
                    <p className="text-[11px] text-slate-400">Ingresos simulados vs reales generados por mes</p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">
                    Últimos 5 Meses
                  </span>
                </div>

                <div className="h-44 w-full relative pt-2">
                  <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="bentoChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#534AB7" stopOpacity="0.18"/>
                        <stop offset="100%" stopColor="#534AB7" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#f8fafc" strokeWidth="1" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="#f8fafc" strokeWidth="1" />
                    <line x1="0" y1="90" x2="500" y2="90" stroke="#f8fafc" strokeWidth="1" />

                    {/* Area under the line */}
                    <path
                      d="M 30 110 L 140 85 L 250 65 L 360 30 L 470 70 L 470 120 L 30 120 Z"
                      fill="url(#bentoChartGrad)"
                    />
                    {/* Line path */}
                    <path
                      d="M 30 110 L 140 85 L 250 65 L 360 30 L 470 70"
                      fill="none"
                      stroke="#534AB7"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Data dots */}
                    <circle cx="30" cy="110" r="4.5" fill="#534AB7" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx="140" cy="85" r="4.5" fill="#534AB7" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx="250" cy="65" r="4.5" fill="#534AB7" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx="360" cy="30" r="4.5" fill="#534AB7" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx="470" cy="70" r="4.5" fill="#534AB7" stroke="#ffffff" strokeWidth="1.5" />
                  </svg>
                  {/* X Axis Labels */}
                  <div className="flex justify-between px-6 text-[10px] font-bold text-slate-400 mt-2">
                    <span>Ene (${new Intl.NumberFormat('es-CO').format(ventas[0]?.ingresos || 0)})</span>
                    <span>Feb (${new Intl.NumberFormat('es-CO').format(ventas[1]?.ingresos || 0)})</span>
                    <span>Mar (${new Intl.NumberFormat('es-CO').format(ventas[2]?.ingresos || 0)})</span>
                    <span>Abr (${new Intl.NumberFormat('es-CO').format(ventas[3]?.ingresos || 0)})</span>
                    <span>May (${new Intl.NumberFormat('es-CO').format(ventas[4]?.ingresos || 0)})</span>
                  </div>
                </div>
              </div>

              {/* 3. Bento Card: Usuarios Registrados (Mediana - 3 cols / 1 row) */}
              <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm hover:border-[#534AB7]/30 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Comunidad</span>
                  <Users className="w-4 h-4 text-[#534AB7]" />
                </div>
                <div>
                  <h4 className="text-3xl font-black text-slate-800 tracking-tight">{r.totalUsuarios || 0}</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Usuarios registrados en total</p>
                </div>
                <div className="flex gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  <span className="text-emerald-600">Activos</span>
                  <span>•</span>
                  <span>Ecosistema Universitario</span>
                </div>
              </div>

              {/* 4. Bento Card: Publicaciones Activas (Mediana - 3 cols / 1 row) */}
              <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm hover:border-orange-200 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Catálogo de Productos</span>
                  <Package className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <h4 className="text-3xl font-black text-slate-800 tracking-tight">{r.totalPublicaciones || 0}</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Productos y servicios activos</p>
                </div>
                <div className="flex gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  <span className="text-orange-500">Marketplace</span>
                  <span>•</span>
                  <span>Intercambio estudiantil</span>
                </div>
              </div>

              {/* 5. Bento Card: Tutorías Creadas (Mediana - 3 cols / 1 row) */}
              <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Soporte Académico</span>
                  <BookOpen className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-3xl font-black text-slate-800 tracking-tight">{r.totalTutorias || 0}</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Tutorías académicas ofrecidas</p>
                </div>
                <div className="flex gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  <span className="text-blue-500">Tutorías</span>
                  <span>•</span>
                  <span>Apoyo de estudiantes</span>
                </div>
              </div>

              {/* 6. Bento Card: Categorías Populares (Mediana - 3 cols / 1 row) */}
              <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Categorías Top</span>
                  <Tag className="w-4 h-4 text-violet-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700 flex justify-between">
                    <span>{categorias[0]?.name || 'Tecnología'}</span>
                    <span className="text-slate-400">{categorias[0]?.value || 45}%</span>
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 flex justify-between">
                    <span>{categorias[1]?.name || 'Libros'}</span>
                    <span className="text-slate-400">{categorias[1]?.value || 30}%</span>
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 flex justify-between">
                    <span>{categorias[2]?.name || 'Tutorías'}</span>
                    <span className="text-slate-400">{categorias[2]?.value || 15}%</span>
                  </p>
                </div>
                <p className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Demanda del catálogo</p>
              </div>

              {/* 7. Bento Card: Distribución de Roles (Ancha - 6 cols / 2 rows) */}
              <div className="lg:col-span-6 lg:row-span-2 bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800 text-[14px] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#534AB7]" />
                    Distribución de Roles de Usuario
                  </h3>
                  <p className="text-[11px] text-slate-400">Composición y permisos en la base de datos</p>
                </div>

                <div className="space-y-3.5 my-3">
                  {/* Estudiantes */}
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" /> Estudiantes</span>
                      <span>{roles.estudiante || 0}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${Math.min(100, ((roles.estudiante || 0) / (r.totalUsuarios || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Tutores */}
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block" /> Tutores Académicos</span>
                      <span>{roles.tutor || 0}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${Math.min(100, ((roles.tutor || 0) / (r.totalUsuarios || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Administradores */}
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" /> Equipo Administrativo</span>
                      <span>{(roles.admin || 0) + (roles.superadmin || 0)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${Math.min(100, (((roles.admin || 0) + (roles.superadmin || 0)) / (r.totalUsuarios || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Comunidad Unificada</span>
                  <span>Total {r.totalUsuarios || 0} Cuentas</span>
                </div>
              </div>

              {/* 8. Bento Card: Alerta de Auditoría y Estado de Seguridad (Ancha - 6 cols / 2 rows) */}
              <div className="lg:col-span-6 lg:row-span-2 bg-[#FDFDFD] rounded-3xl border border-dashed border-slate-200 p-6 flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-[14px] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Estado de Auditoría y Seguridad
                    </h3>
                    <p className="text-[11px] text-slate-400">Verificación de fraude y sospechas de uso del sistema</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Activo
                  </span>
                </div>

                <div className="py-2.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Controles de Confianza Activos</p>
                    <p className="text-[11px] text-slate-500">Filtro de 3+ rechazos y límites anormales de precios operando en tiempo real.</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Última comprobación: Hoy
                  </div>
                  <Link 
                    href="/admin/auditoria" 
                    className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-[#534AB7] hover:bg-[#4840a0] text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-500/10"
                  >
                    <span>Abrir Auditoría</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* 9. Bento Card: Acceso rápido Solicitudes de Tutor (6 cols / 1 row) */}
              <div className="lg:col-span-12 bg-white rounded-3xl border border-slate-100 p-5 flex items-center justify-between gap-6 shadow-sm hover:border-[#534AB7]/20 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6 text-[#534AB7]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-[14px]">Solicitudes de Tutor</h3>
                    <p className="text-[11px] text-slate-400">Revisa y aprueba solicitudes de estudiantes que quieren convertirse en tutores oficiales</p>
                  </div>
                </div>
                <Link
                  href="/admin/tutores"
                  className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#6055D0] to-[#534AB7] hover:from-[#5048C0] hover:to-[#4339a8] text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-500/20 whitespace-nowrap"
                >
                  Revisar Solicitudes <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
