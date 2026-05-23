"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, Package, Settings, LogOut,
  Sparkles, Heart, LayoutDashboard, Bell, ChevronDown,
  Loader2, AlertTriangle, Tag, CalendarDays, User,
  Phone, GraduationCap, ExternalLink, Share2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";

const ESTADO_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  activo:     { label: "Disponible",  bg: "bg-[#F8F7FF]",  text: "text-[#534AB7]",  border: "border-indigo-100" },
  disponible: { label: "Disponible",  bg: "bg-[#F8F7FF]",  text: "text-[#534AB7]",  border: "border-indigo-100" },
  reservado:  { label: "Reservado",   bg: "bg-amber-50",   text: "text-amber-600",  border: "border-amber-100" },
  vendido:    { label: "Vendido",     bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  pausado:    { label: "Pausado",     bg: "bg-slate-50",   text: "text-slate-500",  border: "border-slate-200" },
};

export default function DetallePublicacion() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [publicacion, setPublicacion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAuth, setUserAuth] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserAuth(user);
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setUserProfile(profile);
      }

      try {
        const res = await fetch(`/api/publicaciones/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Publicación no encontrada");
        setPublicacion(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) init();
  }, [id]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const isAdmin = userProfile?.rol === "admin" || userProfile?.rol === "superadmin";
  const estado = publicacion?.estado || "activo";
  const estadoConfig = ESTADO_CONFIG[estado] || ESTADO_CONFIG.activo;

  return (
    <div
      className="flex h-screen bg-[#F8F9FB] overflow-hidden"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* ── SIDEBAR ── */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 z-20 hidden lg:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div>
          <div className="h-20 flex items-center px-8 border-b border-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6055D0] to-[#534AB7] flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[18px] text-slate-800 tracking-tight">Market<span className="text-[#534AB7]">Versitario</span></span>
            </div>
          </div>

          <div className="px-5 py-6">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Navegación</p>
            <nav className="space-y-1.5">
              {!isAdmin && (
                <a href="/" className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl font-medium text-[14px] transition-colors">
                  <LayoutDashboard className="w-4 h-4" /><span>Explorar Feed</span>
                </a>
              )}
              <a href="/publicaciones" className="flex items-center gap-3 px-3 py-2.5 bg-[#F8F7FF] text-[#534AB7] rounded-xl font-semibold text-[14px] transition-colors">
                <Package className="w-4 h-4" /><span>{isAdmin ? "Publicaciones" : "Mis Publicaciones"}</span>
              </a>
              {!isAdmin && (
                <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl font-medium text-[14px] transition-colors">
                  <Heart className="w-4 h-4" /><span>Guardados</span>
                </a>
              )}
            </nav>
          </div>
        </div>

        <div className="px-5 py-6 border-t border-slate-50">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ajustes</p>
          <nav className="space-y-1.5">
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl font-medium text-[14px] transition-colors">
              <Settings className="w-4 h-4" /><span>Configuración</span>
            </a>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl font-medium text-[14px] transition-colors mt-2">
              <LogOut className="w-4 h-4" /><span>Cerrar Sesión</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-[#534AB7] transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center group-hover:border-[#534AB7]/30 group-hover:bg-[#F8F7FF] transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-[14px] font-semibold hidden sm:block">Volver</span>
          </button>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6055D0] to-[#534AB7] flex items-center justify-center text-white font-bold text-[14px] border-2 border-white shadow-sm uppercase">
                {userProfile?.nombres?.charAt(0) || userAuth?.email?.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-bold text-slate-700 group-hover:text-[#534AB7] transition-colors">
                  {userProfile ? `${userProfile.nombres} ${userProfile.apellidos}` : "Usuario"}
                </p>
                <p className="text-[11px] text-slate-400 font-medium capitalize">{userProfile?.rol || "Estudiante"}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-5xl mx-auto">

            {/* ── ESTADO DE CARGA ── */}
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-32"
                >
                  <Loader2 className="w-10 h-10 animate-spin text-[#534AB7] mb-4" />
                  <p className="text-slate-500 font-medium">Cargando publicación...</p>
                </motion.div>
              )}

              {!loading && error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-32 text-center"
                >
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-800 mb-2">No se encontró la publicación</h3>
                  <p className="text-[13px] text-slate-500 max-w-sm mb-6">{error}</p>
                  <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#534AB7] hover:bg-[#43399b] text-white rounded-xl font-bold text-[13px] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Regresar
                  </button>
                </motion.div>
              )}

              {!loading && !error && publicacion && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  {/* Grid principal */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                    {/* ── COLUMNA IZQUIERDA: Imagen + Acciones ── */}
                    <div className="lg:col-span-3 flex flex-col gap-5">

                      {/* Imagen principal */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.05 }}
                        className="relative aspect-[4/3] w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
                      >
                        {publicacion.imagen ? (
                          <img
                            src={publicacion.imagen}
                            alt={publicacion.titulo}
                            className={`w-full h-full object-cover transition-all duration-500 ${estado === "vendido" ? "grayscale opacity-60" : ""}`}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <Package className="w-16 h-16 text-slate-300 mb-3" />
                            <p className="text-[13px] text-slate-400 font-medium">Sin imagen</p>
                          </div>
                        )}

                        {/* Badge estado flotante */}
                        <div className="absolute top-4 left-4">
                          <span className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border ${estadoConfig.bg} ${estadoConfig.text} ${estadoConfig.border} shadow-sm`}>
                            {estadoConfig.label}
                          </span>
                        </div>

                        {/* Botón favorito flotante */}
                        <motion.button
                          whileTap={{ scale: 1.3 }}
                          animate={{ scale: isLiked ? [1, 1.3, 1] : 1 }}
                          transition={{ duration: 0.3, type: "spring" }}
                          onClick={() => setIsLiked(!isLiked)}
                          className={`absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-all ${isLiked ? "bg-rose-500 border-rose-400 text-white" : "bg-white/90 border-white text-slate-400 hover:text-rose-500"}`}
                        >
                          <Heart className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} />
                        </motion.button>
                      </motion.div>

                      {/* Botones de acción */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                        className="flex gap-3"
                      >
                        <button
                          onClick={handleShare}
                          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-[13px] transition-all shadow-sm"
                        >
                          <Share2 className="w-4 h-4" />
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={copied ? "copied" : "share"}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                            >
                              {copied ? "¡Enlace copiado!" : "Compartir"}
                            </motion.span>
                          </AnimatePresence>
                        </button>
                        <a
                          href={publicacion.perfil?.telefono ? `https://wa.me/57${publicacion.perfil.telefono}?text=Hola, vi tu publicación "${publicacion.titulo}" en MarketVersitario y me interesa.` : "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-[#6055D0] to-[#534AB7] hover:from-[#5048C0] hover:to-[#4339a8] text-white font-bold text-[13px] transition-all shadow-md shadow-indigo-500/20"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Contactar Vendedor
                        </a>
                      </motion.div>
                    </div>

                    {/* ── COLUMNA DERECHA: Info ── */}
                    <div className="lg:col-span-2 flex flex-col gap-5">

                      {/* Card principal de info */}
                      <motion.div
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.1 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-4"
                      >
                        {/* Categoría */}
                        {publicacion.id_categoria && (
                          <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-[#534AB7]" />
                            <span className="text-[11px] font-bold text-[#534AB7] uppercase tracking-widest">
                              {publicacion.categorias?.nombre || "Categoría"}
                            </span>
                          </div>
                        )}

                        {/* Título */}
                        <h1 className="text-2xl font-black text-slate-800 leading-tight tracking-tight">
                          {publicacion.titulo}
                        </h1>

                        {/* Precio */}
                        <div className="pt-1 pb-3 border-b border-slate-50">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Precio de venta</p>
                          <p className="text-3xl font-black text-slate-900 tracking-tight">
                            <span className="text-lg font-semibold text-slate-400 mr-1">$</span>
                            {new Intl.NumberFormat("es-CO").format(publicacion.precio || 0)}
                          </p>
                        </div>

                        {/* Metadatos */}
                        <div className="space-y-3">
                          {publicacion.ubicacion && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Ubicación</p>
                                <p className="text-[13px] font-semibold text-slate-700">{publicacion.ubicacion}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Publicado</p>
                              <p className="text-[13px] font-semibold text-slate-700">
                                {new Date(publicacion.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Card del vendedor */}
                      {publicacion.perfil && (
                        <motion.div
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: 0.2 }}
                          className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5"
                        >
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Vendedor</p>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6055D0] to-[#534AB7] flex items-center justify-center text-white font-black text-[18px] uppercase shadow-md shadow-indigo-500/20 shrink-0">
                              {publicacion.perfil.nombres?.charAt(0) || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] font-black text-slate-800 truncate">
                                {publicacion.perfil.nombres} {publicacion.perfil.apellidos}
                              </p>
                              {publicacion.perfil.programa_academico && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                                  <p className="text-[11px] text-slate-500 font-medium truncate">{publicacion.perfil.programa_academico}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {publicacion.perfil.telefono && (
                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[12px] text-slate-500 font-medium">{publicacion.perfil.telefono}</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* ── DESCRIPCIÓN ── */}
                  {publicacion.descripcion && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.25 }}
                      className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6"
                    >
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Descripción</p>
                      <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap">{publicacion.descripcion}</p>
                    </motion.div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
