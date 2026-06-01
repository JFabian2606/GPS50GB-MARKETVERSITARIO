"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, Package, Settings, LogOut,
  Sparkles, Heart, LayoutDashboard, Bell, ChevronDown,
  Loader2, AlertTriangle, Tag, CalendarDays, User,
  Phone, GraduationCap, ExternalLink, Share2, Check
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

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
  const [marcandoComprado, setMarcandoComprado] = useState(false);
  const [codigoTransaccion, setCodigoTransaccion] = useState<string | null>(null);
  const [registrandoIntencion, setRegistrandoIntencion] = useState(false);
  const [mostrarSelectorComprador, setMostrarSelectorComprador] = useState(false);
  const [intenciones, setIntenciones] = useState<any[]>([]);
  const [cargandoIntenciones, setCargandoIntenciones] = useState(false);
  const [buscandoPorCodigo, setBuscandoPorCodigo] = useState(false);
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [intencionEncontrada, setIntencionEncontrada] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserAuth(user);
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setUserProfile(profile);

        // Cargar favoritos para ver si ya le gusta
        try {
          const favRes = await fetch('/api/favoritos');
          if (favRes.ok) {
            const favJson = await favRes.json();
            const liked = (favJson.data || []).some((f: any) => f.id_publicacion === parseInt(id));
            setIsLiked(liked);
          }
        } catch (err) {
          console.error("Error al cargar favorito inicial:", err);
        }
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

  const toggleLike = async () => {
    if (!userAuth) {
      alert("Debes iniciar sesión para guardar favoritos");
      return;
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);

    try {
      if (isLiked) {
        const params = new URLSearchParams({ id_publicacion: id });
        await fetch(`/api/favoritos?${params.toString()}`, { method: 'DELETE' });
      } else {
        await fetch('/api/favoritos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_publicacion: parseInt(id) })
        });
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      setIsLiked(isLiked); // Revert
    }
  };

  const handleMarcarComprado = async () => {
    if (!userAuth || !publicacion) return;

    setMarcandoComprado(true);
    try {
      const res = await fetch(`/api/publicaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'marcar_comprado' })
      });

      if (res.ok) {
        const json = await res.json();
        setPublicacion(json.data);
      } else {
        const json = await res.json();
        alert(json.error || 'Error al marcar como comprado');
      }
    } catch (err) {
      console.error(err);
      alert('Error al marcar como comprado');
    } finally {
      setMarcandoComprado(false);
    }
  };

  const handleContactarWhatsApp = async () => {
    if (!userAuth || !publicacion) {
      alert('Debes iniciar sesión para contactar por WhatsApp');
      return;
    }

    setRegistrandoIntencion(true);
    try {
      // Registrar intención y obtener código
      const res = await fetch('/api/intenciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_publicacion: publicacion.id_publicacion })
      });

      if (res.ok) {
        const json = await res.json();
        const codigo = json.codigo_transaccion;
        setCodigoTransaccion(codigo);

        // Abrir WhatsApp con el código
        const telefono = publicacion.perfil?.telefono;
        if (telefono) {
          const mensaje = `Hola, me interesa tu publicación "${publicacion.titulo}" en MarketVersitario. No borres este código: #${codigo}`;
          const url = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`;
          window.open(url, '_blank');
        }
      } else {
        const json = await res.json();
        alert(json.error || 'Error al registrar intención');
      }
    } catch (err) {
      console.error(err);
      alert('Error al registrar intención');
    } finally {
      setRegistrandoIntencion(false);
    }
  };

  const handleCargarIntenciones = async () => {
    if (!publicacion) return;

    setCargandoIntenciones(true);
    try {
      const res = await fetch(`/api/intenciones?id_publicacion=${publicacion.id_publicacion}`);
      const json = await res.json();
      if (res.ok) {
        setIntenciones(json.data || []);
        setMostrarSelectorComprador(true);
      } else {
        alert(json.error || 'Error al cargar intenciones');
      }
    } catch (err) {
      console.error(err);
      alert('Error al cargar intenciones');
    } finally {
      setCargandoIntenciones(false);
    }
  };

  const handleMarcarVendido = async (idIntencion: string) => {
    try {
      const res = await fetch(`/api/intenciones/${idIntencion}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'marcar_vendido' })
      });

      if (res.ok) {
        alert('Marcado como vendido exitosamente');
        setMostrarSelectorComprador(false);
        setIntencionEncontrada(null);
        setCodigoBusqueda('');
        // Recargar publicación
        const pubRes = await fetch(`/api/publicaciones/${id}`);
        const pubJson = await pubRes.json();
        if (pubRes.ok) {
          setPublicacion(pubJson.data);
        }
      } else {
        const json = await res.json();
        alert(json.error || 'Error al marcar como vendido');
      }
    } catch (err) {
      console.error(err);
      alert('Error al marcar como vendido');
    }
  };

  const handleBuscarPorCodigo = async () => {
    if (!codigoBusqueda.trim() || !publicacion) return;

    setBuscandoPorCodigo(true);
    try {
      const res = await fetch(`/api/intenciones?id_publicacion=${publicacion.id_publicacion}`);
      const json = await res.json();
      if (res.ok) {
        const intencion = json.data?.find((i: any) => 
          i.codigo_transaccion.toUpperCase() === codigoBusqueda.trim().toUpperCase()
        );
        if (intencion) {
          setIntencionEncontrada(intencion);
        } else {
          alert('Código no encontrado');
          setIntencionEncontrada(null);
        }
      } else {
        alert(json.error || 'Error al buscar código');
      }
    } catch (err) {
      console.error(err);
      alert('Error al buscar código');
    } finally {
      setBuscandoPorCodigo(false);
    }
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
      <Sidebar userProfile={userProfile} userAuth={userAuth} />

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <Header 
          userProfile={userProfile} 
          userAuth={userAuth} 
          title="Detalle de Publicación"
          showBack={true}
        />

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
                          transition={{ duration: 0.35, type: "tween", ease: "backOut" }}
                          onClick={toggleLike}
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
                        className="flex flex-col gap-3"
                      >
                        {/* Botón Marcar como Vendido (solo para vendedores) */}
                        {userAuth && userAuth.id === publicacion?.id_usuario && (publicacion?.estado === 'activo' || publicacion?.estado === 'disponible') && (
                          <button
                            onClick={handleCargarIntenciones}
                            disabled={cargandoIntenciones}
                            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-[#6055D0] to-[#534AB7] hover:from-[#5048C0] hover:to-[#4339a8] text-white font-bold text-[13px] transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cargandoIntenciones ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {cargandoIntenciones ? "Cargando..." : "Marcar como Vendido"}
                          </button>
                        )}

                        <div className="flex gap-3">
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
                          <button
                            onClick={handleContactarWhatsApp}
                            disabled={registrandoIntencion}
                            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-[#6055D0] to-[#534AB7] hover:from-[#5048C0] hover:to-[#4339a8] text-white font-bold text-[13px] transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {registrandoIntencion ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                            {registrandoIntencion ? "Registrando..." : "Contactar Vendedor"}
                          </button>
                        </div>
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

      {/* Modal para seleccionar comprador */}
      {mostrarSelectorComprador && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">¿A quién se lo vendiste?</h3>
              <p className="text-sm text-slate-500 mt-1">Selecciona el comprador de la lista o busca por código</p>
            </div>
            
            {/* Buscador de código */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codigoBusqueda}
                  onChange={(e) => setCodigoBusqueda(e.target.value)}
                  placeholder="Código de transacción (ej: TRXABC123)"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#534AB7]"
                />
                <button
                  onClick={handleBuscarPorCodigo}
                  disabled={buscandoPorCodigo}
                  className="px-4 py-2 bg-[#534AB7] text-white text-sm font-semibold rounded-lg hover:bg-[#4339a8] transition-colors disabled:opacity-50"
                >
                  {buscandoPorCodigo ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>

            {/* Resultado de búsqueda por código */}
            {intencionEncontrada && (
              <div className="p-4 bg-emerald-50 border-b border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6055D0] to-[#534AB7] flex items-center justify-center text-white font-bold">
                      {intencionEncontrada.comprador?.nombres?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {intencionEncontrada.comprador?.nombres} {intencionEncontrada.comprador?.apellidos}
                      </p>
                      <p className="text-xs text-slate-500">Código: {intencionEncontrada.codigo_transaccion}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarcarVendido(intencionEncontrada.id)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all"
                  >
                    Seleccionar
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {intenciones.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Nadie ha contactado por esta publicación aún.</p>
              ) : (
                intenciones.map((intencion) => (
                  <div
                    key={intencion.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-xl mb-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6055D0] to-[#534AB7] flex items-center justify-center text-white font-bold">
                        {intencion.comprador?.nombres?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {intencion.comprador?.nombres} {intencion.comprador?.apellidos}
                        </p>
                        <p className="text-xs text-slate-500">
                          Clic hace {new Date(intencion.fecha_clic).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarcarVendido(intencion.id)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all"
                    >
                      Seleccionar
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setMostrarSelectorComprador(false);
                  setIntencionEncontrada(null);
                  setCodigoBusqueda('');
                }}
                className="w-full px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
