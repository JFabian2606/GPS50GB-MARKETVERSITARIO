"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Loader2, RefreshCw, Search, Check, X,
  Clock, CheckCircle, XCircle, FileText, ExternalLink,
  Filter, Users, BookMarked, Mail, Phone, CalendarDays,
  ChevronDown, Sparkles, AlertTriangle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const FONT: React.CSSProperties = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const ESTADO_CONFIG = {
  pendiente: {
    label: "Pendiente",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-400",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  aceptada: {
    label: "Aceptada",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-400",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  rechazada: {
    label: "Rechazada",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-400",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
} as const;

type EstadoKey = keyof typeof ESTADO_CONFIG;

export default function AdminTutoresPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAuth, setUserAuth] = useState<any>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pendientes: 0, aceptadas: 0, rechazadas: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  // Auth check
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUserAuth(user);
      const { data: profile } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      if (!profile || (profile.rol !== "admin" && profile.rol !== "superadmin")) {
        router.push("/"); return;
      }
      if (profile.estado === "inactivo") {
        await supabase.auth.signOut();
        router.push("/auth/login?error=account_disabled"); return;
      }
      setUserProfile(profile);
    };
    init();
  }, []);

  const loadSolicitudes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ estado: filtroEstado });
      const res = await fetch(`/api/admin/solicitudes-tutor?${params}`);
      if (res.ok) {
        const json = await res.json();
        setSolicitudes(json.data ?? []);
        setStats(json.stats ?? { total: 0, pendientes: 0, aceptadas: 0, rechazadas: 0 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    if (userProfile) loadSolicitudes();
  }, [userProfile, loadSolicitudes]);

  const handleGestion = async (idSolicitud: number, nuevoEstado: "aceptada" | "rechazada") => {
    setActionLoading(`${idSolicitud}-${nuevoEstado}`);
    try {
      const res = await fetch(`/api/solicitudes-tutor/${idSolicitud}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error al actualizar");
      }
      // Update local state
      setSolicitudes(prev =>
        prev.map(s => s.id_solicitud === idSolicitud ? { ...s, estado: nuevoEstado } : s)
      );
      setStats(prev => ({
        ...prev,
        pendientes: prev.pendientes - 1,
        aceptadas: nuevoEstado === "aceptada" ? prev.aceptadas + 1 : prev.aceptadas,
        rechazadas: nuevoEstado === "rechazada" ? prev.rechazadas + 1 : prev.rechazadas,
      }));
      if (selected?.id_solicitud === idSolicitud) {
        setSelected((s: any) => ({ ...s, estado: nuevoEstado }));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = solicitudes.filter(s => {
    const nombre = `${s.profiles?.nombres ?? ""} ${s.profiles?.apellidos ?? ""}`.toLowerCase();
    const area = (s.area_interes ?? "").toLowerCase();
    const q = busqueda.toLowerCase();
    return !q || nombre.includes(q) || area.includes(q);
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  if (!userProfile) {
    return (
      <div className="flex h-screen bg-[#F8F9FB] items-center justify-center" style={FONT}>
        <Loader2 className="w-8 h-8 animate-spin text-[#534AB7]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FB] overflow-hidden" style={FONT}>
      <Sidebar userProfile={userProfile} userAuth={userAuth} />

      <main className="flex-1 flex flex-col min-w-0">
        <Header userProfile={userProfile} userAuth={userAuth} title="Solicitudes de Tutor" />

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  Solicitudes de Tutor
                  {stats.pendientes > 0 && (
                    <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      {stats.pendientes} pendiente{stats.pendientes !== 1 ? "s" : ""}
                    </span>
                  )}
                </h2>
                <p className="text-[13px] text-slate-400 mt-0.5">
                  Revisa y gestiona las solicitudes para convertirse en tutor oficial
                </p>
              </div>
              <button
                onClick={loadSolicitudes}
                disabled={loading}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors shadow-sm disabled:opacity-50"
                title="Actualizar"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Solicitudes", value: stats.total, icon: <Users className="w-5 h-5 text-[#534AB7]" />, color: "indigo" },
                { label: "Pendientes", value: stats.pendientes, icon: <Clock className="w-5 h-5 text-amber-500" />, color: "amber" },
                { label: "Aceptadas", value: stats.aceptadas, icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, color: "emerald" },
                { label: "Rechazadas", value: stats.rechazadas, icon: <XCircle className="w-5 h-5 text-rose-500" />, color: "rose" },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    {kpi.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800">{kpi.value}</p>
                    <p className="text-[11px] font-semibold text-slate-400">{kpi.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Filtros ── */}
            <div className="flex flex-wrap gap-3">
              {/* Búsqueda */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o área..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all"
                />
              </div>

              {/* Filtro estado */}
              <div className="relative">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={filtroEstado}
                  onChange={e => { setFiltroEstado(e.target.value); }}
                  className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 focus:outline-none focus:border-[#534AB7] appearance-none cursor-pointer"
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="aceptada">Aceptadas</option>
                  <option value="rechazada">Rechazadas</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* ── Tabla / Lista ── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#534AB7] mb-3" />
                  <p className="text-slate-500 text-sm font-medium">Cargando solicitudes...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                    <GraduationCap className="w-7 h-7 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-[15px]">Sin solicitudes</h3>
                  <p className="text-slate-400 text-sm mt-1">No hay solicitudes que coincidan con los filtros.</p>
                </div>
              ) : (
                <>
                  {/* Cabecera de tabla */}
                  <div className="hidden md:grid grid-cols-12 px-6 py-3 border-b border-slate-50 bg-slate-50/60">
                    <p className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solicitante</p>
                    <p className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Área de Interés</p>
                    <p className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</p>
                    <p className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</p>
                    <p className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</p>
                  </div>

                  {/* Filas */}
                  <div className="divide-y divide-slate-50">
                    {filtered.map((s, i) => {
                      const cfg = ESTADO_CONFIG[s.estado as EstadoKey] ?? ESTADO_CONFIG.pendiente;
                      const nombre = `${s.profiles?.nombres ?? "—"} ${s.profiles?.apellidos ?? ""}`;
                      const isPending = s.estado === "pendiente";

                      return (
                        <motion.div
                          key={s.id_solicitud}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group"
                        >
                          {/* Solicitante */}
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6055D0] to-[#534AB7] flex items-center justify-center text-white font-black text-[13px] uppercase shrink-0">
                              {(s.profiles?.nombres?.charAt(0) ?? "?")}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[13px] text-slate-800 truncate">{nombre}</p>
                              <p className="text-[11px] text-slate-400 truncate">{s.profiles?.programa_academico ?? "Sin programa"}</p>
                              {s.email && (
                                <p className="text-[10px] text-slate-400 truncate">{s.email}</p>
                              )}
                            </div>
                          </div>

                          {/* Área */}
                          <div className="col-span-3">
                            <div className="flex items-center gap-1.5">
                              <BookMarked className="w-3.5 h-3.5 text-[#534AB7] shrink-0" />
                              <span className="text-[13px] font-semibold text-slate-700 truncate">
                                {s.area_interes ?? <span className="text-slate-400 italic">Sin especificar</span>}
                              </span>
                            </div>
                          </div>

                          {/* Fecha */}
                          <div className="col-span-2">
                            <p className="text-[12px] text-slate-500 flex items-center gap-1">
                              <CalendarDays className="w-3 h-3 text-slate-400" />
                              {new Date(s.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                          </div>

                          {/* Estado */}
                          <div className="col-span-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </div>

                          {/* Acciones */}
                          <div className="col-span-2 flex items-center justify-end gap-2">
                            {/* Ver detalle */}
                            <button
                              onClick={() => setSelected(s)}
                              className="h-8 px-3 rounded-xl border border-slate-200 hover:bg-[#F8F7FF] hover:border-[#534AB7]/20 text-[11px] font-bold text-slate-500 hover:text-[#534AB7] transition-all flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Ver</span>
                            </button>

                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleGestion(s.id_solicitud, "rechazada")}
                                  disabled={actionLoading !== null}
                                  title="Rechazar solicitud"
                                  className="w-8 h-8 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-500 flex items-center justify-center transition-all disabled:opacity-50"
                                >
                                  {actionLoading === `${s.id_solicitud}-rechazada`
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <X className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => handleGestion(s.id_solicitud, "aceptada")}
                                  disabled={actionLoading !== null}
                                  title="Aceptar solicitud"
                                  className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-50"
                                >
                                  {actionLoading === `${s.id_solicitud}-aceptada`
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Check className="w-3.5 h-3.5" />}
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ══ PANEL LATERAL DE DETALLE ══ */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
              style={FONT}
            >
              {/* Header del drawer */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-[#534AB7]" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-[15px]">Detalle de Solicitud</h3>
                    <p className="text-[11px] text-slate-400">#{selected.id_solicitud}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contenido scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                {/* Estado badge */}
                {(() => {
                  const cfg = ESTADO_CONFIG[selected.estado as EstadoKey] ?? ESTADO_CONFIG.pendiente;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  );
                })()}

                {/* Datos del solicitante */}
                <section className="bg-slate-50 rounded-2xl p-5 space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solicitante</h4>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6055D0] to-[#534AB7] flex items-center justify-center text-white font-black text-[22px] uppercase shrink-0">
                      {selected.profiles?.nombres?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-[16px]">
                        {selected.profiles?.nombres} {selected.profiles?.apellidos}
                      </p>
                      <p className="text-[13px] text-slate-500">{selected.profiles?.programa_academico ?? "Sin programa"}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {selected.email && (
                      <div className="flex items-center gap-2 text-[13px] text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selected.email}</span>
                      </div>
                    )}
                    {selected.profiles?.telefono && (
                      <div className="flex items-center gap-2 text-[13px] text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a
                          href={`https://wa.me/57${selected.profiles.telefono}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 font-semibold hover:underline"
                        >
                          {selected.profiles.telefono} (WhatsApp)
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[13px] text-slate-500">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      Solicitud enviada el {new Date(selected.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}
                    </div>
                  </div>
                </section>

                {/* Área de interés */}
                <section className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Área de Tutorías</h4>
                  <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <BookMarked className="w-4 h-4 text-[#534AB7] mt-0.5 shrink-0" />
                    <p className="text-[14px] font-semibold text-[#534AB7]">
                      {selected.area_interes ?? <span className="text-slate-400 italic">No especificada</span>}
                    </p>
                  </div>
                </section>

                {/* Documento de notas */}
                <section className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documento de Notas</h4>
                  {selected.url_notas ? (
                    <a
                      href={selected.url_notas}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-[#534AB7]/30 hover:bg-[#F8F7FF] transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-colors">
                        <FileText className="w-5 h-5 text-slate-500 group-hover:text-[#534AB7] transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[13px] text-slate-700 group-hover:text-[#534AB7] transition-colors truncate">
                          Ver documento adjunto
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{selected.url_notas}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#534AB7] shrink-0 transition-colors" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-slate-200 text-slate-400">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <p className="text-[13px]">No se adjuntó ningún documento.</p>
                    </div>
                  )}
                </section>

                {/* Mensaje de justificación */}
                {selected.mensaje && (
                  <section className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mensaje de Justificación</h4>
                    <blockquote className="border-l-4 border-[#534AB7]/30 pl-4 italic text-[13px] text-slate-600 leading-relaxed bg-slate-50 rounded-r-xl py-3 pr-4">
                      "{selected.mensaje}"
                    </blockquote>
                  </section>
                )}
              </div>

              {/* Footer con acciones (solo si está pendiente) */}
              {selected.estado === "pendiente" && (
                <div className="border-t border-slate-100 px-6 py-5 flex gap-3">
                  <button
                    onClick={() => handleGestion(selected.id_solicitud, "rechazada")}
                    disabled={actionLoading !== null}
                    className="flex-1 h-11 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-[13px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {actionLoading === `${selected.id_solicitud}-rechazada`
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <X className="w-4 h-4" />}
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleGestion(selected.id_solicitud, "aceptada")}
                    disabled={actionLoading !== null}
                    className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {actionLoading === `${selected.id_solicitud}-aceptada`
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Check className="w-4 h-4" />}
                    Aceptar como Tutor
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
