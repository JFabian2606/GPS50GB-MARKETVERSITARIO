"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, Bell, ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface HeaderProps {
  userProfile: any;
  userAuth: any;
  showSearch?: boolean;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  isSearching?: boolean;
  title?: string;
  showBack?: boolean;
}

export default function Header({ 
  userProfile, 
  userAuth, 
  showSearch = false, 
  searchQuery = "", 
  setSearchQuery, 
  isSearching = false,
  title,
  showBack = false
}: HeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [intencionActual, setIntencionActual] = useState<any>(null);
  const [mostrarCalificacion, setMostrarCalificacion] = useState(false);
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');

  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notificaciones');
        if (res.ok) {
          const json = await res.json();
          const list = json.data || [];
          setNotifications(list);

          // Auto-trigger purchase confirmation popup if there's a pending one
          const pendingConfirm = list.find((n: any) => n.tipo === 'intencion_pendiente');
          if (pendingConfirm && pendingConfirm.payload) {
            const vistasKey = `intenciones_vistas_${userAuth?.id}`;
            const vistas = JSON.parse(localStorage.getItem(vistasKey) || '[]');
            if (!vistas.includes(pendingConfirm.payload.id)) {
              setIntencionActual(pendingConfirm.payload);
              setMostrarModalConfirmacion(true);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingNotifications(false);
      }
    };

    let intervalId: NodeJS.Timeout | null = null;

    if (userAuth) {
      setLoadingNotifications(true);
      fetchNotifications();
      // Cargar notificaciones cada 30 segundos
      intervalId = setInterval(fetchNotifications, 30000);
    } else {
      setLoadingNotifications(false);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [userAuth]);

  const unreadCount = notifications.length;

  // For createPortal SSR safety
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const modal = mostrarModalConfirmacion && intencionActual ? (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full font-sans antialiased"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        {!mostrarCalificacion ? (
          <>
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">¡Confirmación de Compra!</h3>
              <p className="text-sm text-slate-500 mt-1">
                {intencionActual.vendedor?.nombres} {intencionActual.vendedor?.apellidos} indica que te vendió: &ldquo;{intencionActual.publicacion?.titulo}&rdquo;
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {intencionActual.publicacion?.imagen && (
                  <img
                    src={intencionActual.publicacion.imagen}
                    alt={intencionActual.publicacion.titulo}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-slate-800">{intencionActual.publicacion?.titulo}</p>
                  <p className="text-sm text-slate-500">
                    ${new Intl.NumberFormat("es-CO").format(intencionActual.publicacion?.precio || 0)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">¿Compraste este artículo?</p>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/intenciones/${intencionActual.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ accion: 'rechazar' })
                      });
                      if (!res.ok) {
                        const json = await res.json();
                        alert(json.error || 'Error al rechazar');
                        return;
                      }
                      const vistasKey = `intenciones_vistas_${userAuth?.id}`;
                      const vistas = JSON.parse(localStorage.getItem(vistasKey) || '[]');
                      vistas.push(intencionActual.id);
                      localStorage.setItem(vistasKey, JSON.stringify(vistas));
                      setNotifications(prev => prev.filter(n => n.id !== `intencion-${intencionActual.id}`));
                      setMostrarModalConfirmacion(false);
                      setIntencionActual(null);
                    } catch (err) {
                      console.error(err);
                      alert('Error al rechazar');
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  No, es un error
                </button>
                <button
                  onClick={() => setMostrarCalificacion(true)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all"
                >
                  Sí, lo compré
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Califica al Vendedor</h3>
              <p className="text-sm text-slate-500 mt-1">¿Cómo fue tu experiencia con {intencionActual.vendedor?.nombres}?</p>
            </div>
            <div className="p-6">
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setCalificacion(star)}
                    className={`text-3xl transition-colors ${star <= calificacion ? 'text-yellow-400' : 'text-slate-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Deja un comentario (opcional)"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-[#534AB7] mb-4"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/intenciones/${intencionActual.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ accion: 'confirmar', calificacion: null, comentario: null })
                      });
                      if (!res.ok) {
                        const json = await res.json();
                        alert(json.error || 'Error al confirmar la compra');
                        return;
                      }
                      const vistasKey = `intenciones_vistas_${userAuth?.id}`;
                      const vistas = JSON.parse(localStorage.getItem(vistasKey) || '[]');
                      vistas.push(intencionActual.id);
                      localStorage.setItem(vistasKey, JSON.stringify(vistas));
                      setNotifications(prev => prev.filter(n => n.id !== `intencion-${intencionActual.id}`));
                      setMostrarCalificacion(false);
                      setCalificacion(0);
                      setComentario('');
                      setMostrarModalConfirmacion(false);
                      setIntencionActual(null);
                      alert('¡Compra confirmada!');
                      router.refresh();
                    } catch (err) {
                      console.error(err);
                      alert('Error al confirmar');
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Omitir
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/intenciones/${intencionActual.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          accion: 'confirmar',
                          calificacion: calificacion || null,
                          comentario: comentario || null
                        })
                      });
                      if (!res.ok) {
                        const json = await res.json();
                        alert(json.error || 'Error al confirmar la compra');
                        return;
                      }
                      const vistasKey = `intenciones_vistas_${userAuth?.id}`;
                      const vistas = JSON.parse(localStorage.getItem(vistasKey) || '[]');
                      vistas.push(intencionActual.id);
                      localStorage.setItem(vistasKey, JSON.stringify(vistas));
                      setNotifications(prev => prev.filter(n => n.id !== `intencion-${intencionActual.id}`));
                      setMostrarCalificacion(false);
                      setCalificacion(0);
                      setComentario('');
                      setMostrarModalConfirmacion(false);
                      setIntencionActual(null);
                      alert('¡Compra confirmada y calificación guardada!');
                      router.refresh();
                    } catch (err) {
                      console.error(err);
                      alert('Error al confirmar');
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all"
                >
                  Enviar
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  ) : null;

  return (
    <>
    <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
      
      {/* Izquierda: Buscador o Título */}
      {showSearch && setSearchQuery ? (
        <div className="flex-1 max-w-2xl relative">
          {isSearching ? (
            <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#534AB7] animate-spin" />
          ) : (
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          )}
          <input 
            type="text" 
            placeholder="Buscar calculadoras, libros, tutorías..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-10 bg-slate-100/70 border-transparent rounded-full focus:bg-white focus:border-[#534AB7]/30 focus:ring-2 focus:ring-[#534AB7]/10 transition-all text-[14px] text-slate-700 outline-none placeholder:text-slate-400"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 hover:bg-slate-400 flex items-center justify-center text-white transition-colors"
              >
                <span className="text-[10px] font-bold leading-none">✕</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-[#534AB7] transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center group-hover:border-[#534AB7]/30 group-hover:bg-[#F8F7FF] transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              </div>
            </button>
          )}
          <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">{title || "MarketVersitario"}</h2>
        </div>
      )}

      {/* User Widgets (Right) */}
      <div className="flex items-center gap-4 ml-6 relative">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          )}
        </button>

        {/* Panel de Notificaciones (Temporalmente Vacío) */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-14 right-48 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-[14px] text-slate-800">Notificaciones</h3>
                <span className="text-[11px] font-bold text-[#534AB7] bg-indigo-50 px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
                {loadingNotifications ? (
                  <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-[#534AB7]" /></div>
                ) : notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        setShowNotifications(false);
                        if (notif.tipo === 'intencion_pendiente' && notif.payload) {
                          setIntencionActual(notif.payload);
                          setMostrarModalConfirmacion(true);
                        } else {
                          router.push(notif.link);
                        }
                      }}
                      className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[12px] font-bold text-slate-800">{notif.titulo}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(notif.fecha).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-600 leading-snug">{notif.mensaje}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4 opacity-50">
                    <Bell className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-[13px] text-slate-600 font-medium">No hay notificaciones</p>
                    <p className="text-[11px] text-slate-400">Las solicitudes aparecerán aquí.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
        
        <div 
          onClick={() => userAuth && router.push(`/usuarios/${userAuth.id}`)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {userProfile?.avatar_url ? (
            <img 
              src={userProfile.avatar_url} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6055D0] to-[#534AB7] flex items-center justify-center text-white font-bold text-[14px] border-2 border-white shadow-sm uppercase">
              {userProfile?.nombres?.charAt(0) || userAuth?.email?.charAt(0) || "U"}
            </div>
          )}
          
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
    {mounted && createPortal(modal, document.body)}
    </>
  );
}
