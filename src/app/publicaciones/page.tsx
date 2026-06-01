"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Bell, LayoutDashboard, Package, 
  Settings, LogOut, ChevronDown, Plus, 
  Pencil, Trash2, ExternalLink, Filter,
  Sparkles, Check, Heart, Loader2, X, AlertTriangle, Save,
  Zap
} from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import PagoModal from "@/components/PagoModal";

const CATEGORIAS = ["Todas las categorías", "Tecnología", "Libros", "Útiles", "Ropa", "Servicios Estudiantiles", "Otros"];
export default function GestionPublicaciones() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Mis Publicaciones");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas las categorías");

  // Estado modal de pago
  const [selectedPubForPago, setSelectedPubForPago] = useState<any>(null);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);

  const handlePagoSuccess = (referencia: string, destacadaHasta: string) => {
    if (selectedPubForPago) {
      setProductos(prev => prev.map(p =>
        p.id_publicacion === selectedPubForPago.id_publicacion
          ? { ...p, destacada: true, destacada_hasta: destacadaHasta }
          : p
      ));
    }
  };
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const PERIODOS = ["Todo el periodo", "Últimas 24 horas", "Última semana", "Último mes"];
  const [activePeriod, setActivePeriod] = useState("Todo el periodo");
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);

  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAuth, setUserAuth] = useState<any>(null);

  // Estado modal eliminar
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Estado modal editar
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({ titulo: '', precio: '', ubicacion: '', descripcion: '', estado: '', id_categoria: '' });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Carga inicial
  React.useEffect(() => {
    const fetchUserAndData = async () => {
      const supabase = createClient();
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
      }

      try {
        const [resPubs, resCats] = await Promise.all([
          fetch('/api/publicaciones?estado=todos'),
          fetch('/api/categorias')
        ]);
        
        if (resPubs.ok) {
          const json = await resPubs.json();
          setProductos(json.data || []);
        }
        
        if (resCats.ok) {
          const jsonCats = await resCats.json();
          setCategorias(jsonCats.data || []);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  };

  const openEdit = (pub: any) => {
    setEditTarget(pub);
    setEditForm({
      titulo: pub.titulo || '',
      precio: pub.precio ? String(pub.precio) : '',
      ubicacion: pub.ubicacion || '',
      descripcion: pub.descripcion || '',
      estado: pub.estado || 'activo',
      id_categoria: pub.id_categoria ? String(pub.id_categoria) : '',
    });
    setEditError('');
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    setEditError('');
    try {
      const res = await fetch(`/api/publicaciones/${editTarget.id_publicacion}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: editForm.titulo,
          precio: editForm.precio.replace(/\./g, ''),
          ubicacion: editForm.ubicacion,
          descripcion: editForm.descripcion,
          estado: editForm.estado,
          id_categoria: editForm.id_categoria,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al guardar');
      // Actualizar lista local
      setProductos(prev => prev.map(p =>
        p.id_publicacion === editTarget.id_publicacion ? { ...p, ...json.data } : p
      ));
      setEditTarget(null);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/publicaciones/${deleteTarget.id_publicacion}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Error al eliminar');
      }
      // Quitar de la lista local con animación
      setProductos(prev => prev.filter(p => p.id_publicacion !== deleteTarget.id_publicacion));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const isAdmin = userProfile?.rol === 'admin' || userProfile?.rol === 'superadmin';

  // Para admin, forzar siempre el tab Global
  React.useEffect(() => {
    if (isAdmin) {
      setActiveTab("Global (Admin)");
    } else if (activeTab === "Global (Admin)") {
      setActiveTab("Mis Publicaciones");
    }
  }, [isAdmin]);

  const filteredData = productos.filter(pub => {
    const isMine = pub.id_usuario === userAuth?.id;
    const matchTab = activeTab === "Global (Admin)" ? true : isMine;
    
    // Filtro por búsqueda
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      pub.titulo?.toLowerCase().includes(q) ||
      pub.descripcion?.toLowerCase().includes(q) ||
      pub.ubicacion?.toLowerCase().includes(q) ||
      String(pub.id_publicacion).includes(q) ||
      pub.perfil?.nombres?.toLowerCase().includes(q) ||
      pub.perfil?.apellidos?.toLowerCase().includes(q);

    // Filtro por categoría
    const matchCategory = activeCategory === "Todas las categorías" || pub.categorias?.nombre === activeCategory;

    // Filtro por periodo
    const matchPeriod = (() => {
      if (activePeriod === "Todo el periodo") return true;
      const pubDate = new Date(pub.created_at);
      const diffDays = (new Date().getTime() - pubDate.getTime()) / (1000 * 3600 * 24);
      if (activePeriod === "Últimas 24 horas") return diffDays <= 1;
      if (activePeriod === "Última semana") return diffDays <= 7;
      if (activePeriod === "Último mes") return diffDays <= 30;
      return true;
    })();

    return matchTab && matchSearch && matchCategory && matchPeriod;
  });

  return (
    <div 
      className="flex h-screen bg-[#F8F9FB] overflow-hidden"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      
      {/* 1. SIDEBAR IZQUIERDA (Consistente 100% con page.tsx) */}
      <Sidebar userProfile={userProfile} userAuth={userAuth} />

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar: Buscador y Perfil (Consistente con page.tsx) */}
        <Header 
          userProfile={userProfile} 
          userAuth={userAuth} 
          showSearch={true}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={false}
        />

        {/* Contenido Listado */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-thin">
          
          <div className="max-w-6xl mx-auto">
            
            {/* Cabecera y Filtros */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {activeTab === "Mis Publicaciones" ? "Tus publicaciones recientes" : "Todas las publicaciones"}
                </h2>
                <p className="text-[14px] text-slate-500 mt-1">Gestiona el inventario activo e inactivo del marketplace.</p>
              </div>

              <div className="flex items-center gap-3">
                
                <a 
                  href="/publicaciones/nueva"
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#534AB7] hover:bg-[#43399b] text-white rounded-xl font-bold text-[13px] transition-colors shadow-sm shadow-indigo-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Publicación</span>
                </a>

                {/* Combobox de Categoría con border-radius xl */}
                <div className="relative">
                  <button 
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeCategory}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <AnimatePresence>
                    {isCategoryOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 overflow-hidden"
                      >
                        {["Todas las categorías", ...categorias.map(c => c.nombre)].map((cat) => (
                          <div 
                            key={cat}
                            onClick={() => { setActiveCategory(cat); setIsCategoryOpen(false); }}
                            className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors flex items-center justify-between ${activeCategory === cat ? 'bg-[#F8F7FF] text-[#534AB7]' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            {cat}
                            {activeCategory === cat && <Check className="w-3.5 h-3.5" />}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Filtro Período border-radius xl */}
                <div className="relative">
                  <button 
                    onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <span>{activePeriod}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <AnimatePresence>
                    {isPeriodOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        className="absolute right-0 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 overflow-hidden"
                      >
                        {PERIODOS.map((period) => (
                          <div 
                            key={period}
                            onClick={() => { setActivePeriod(period); setIsPeriodOpen(false); }}
                            className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors flex items-center justify-between ${activePeriod === period ? 'bg-[#F8F7FF] text-[#534AB7]' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            {period}
                            {activePeriod === period && <Check className="w-3.5 h-3.5" />}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* LISTADO TIPO TABLA / CARDS HORIZONTALES */}
            <div className="space-y-3 mt-4">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#534AB7] mb-4" />
                    <p className="text-slate-500 font-medium">Cargando publicaciones...</p>
                  </div>
                ) : filteredData.map((pub, idx) => (
                  <motion.div
                    key={pub.id_publicacion}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all gap-4 group"
                  >
                    
                    {/* Fecha, ID e Imagen */}
                    <div className="flex items-center gap-4 min-w-[220px]">
                      {/* En lugar del botón PDF, usamos la imagen miniatura del producto con radio xl */}
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        <img src={pub.imagen || "https://images.unsplash.com/photo-1555421689-d68471e189f2?q=80&w=600&auto=format&fit=crop"} alt={pub.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-800">{new Date(pub.created_at).toLocaleDateString()}</p>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{String(pub.id_publicacion).substring(0, 8)}</p>
                      </div>
                    </div>

                    {/* Título y Autor/Categoría */}
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-[14px] font-bold text-slate-800 truncate group-hover:text-[#534AB7] transition-colors">{pub.titulo}</p>
                      <p className="text-[12px] text-slate-500 font-medium">
                        {activeTab === "Global (Admin)" ? `Por ${pub.perfil?.nombres} ${pub.perfil?.apellidos} • ${pub.categorias?.nombre || 'Sin categoría'}` : (pub.categorias?.nombre || "Sin categoría")}
                      </p>
                    </div>

                    {/* Precio */}
                    <div className="min-w-[120px] text-left md:text-right">
                      <p className="text-[15px] font-black text-slate-800">${new Intl.NumberFormat("es-CO").format(pub.precio || 0)}</p>
                      <p className="text-[11px] font-medium text-slate-400">Precio de venta</p>
                    </div>

                    {/* Acciones y Estado */}
                    <div className="flex items-center justify-end gap-3 min-w-[280px]">
                      
                      {/* Badge de Estado - Pill pero consistente */}
                      <span className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg border flex items-center justify-center w-24 shrink-0 ${
                        pub.estado === "disponible" ? "bg-[#F8F7FF] text-[#534AB7] border-indigo-100" :
                        pub.estado === "reservado" ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                      }`}>
                        {pub.estado === "vendido" ? <Check className="w-3 h-3 mr-1" /> : null}
                        {pub.estado}
                      </span>
                      
                      {/* Botón Potenciar / Badge Destacada */}
                      {pub.destacada && pub.destacada_hasta && new Date(pub.destacada_hasta) > new Date() ? (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2 text-[11px] font-bold rounded-xl shadow-sm shrink-0">
                          <Sparkles className="w-3.5 h-3.5 fill-white text-white animate-pulse" />
                          <span>Destacada</span>
                        </div>
                      ) : pub.id_usuario === userAuth?.id ? (
                        <button
                          onClick={() => {
                            setSelectedPubForPago(pub);
                            setIsPagoModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white text-[11px] font-bold rounded-xl transition-all shrink-0 shadow-sm shadow-amber-500/25"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white text-white" />
                          <span>Potenciar</span>
                        </button>
                      ) : null}

                      {/* Botón Ver Detalle (Border XL consistente) */}
                      <a 
                        href={`/publicaciones/${pub.id_publicacion}`}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#534AB7] hover:bg-[#43399b] text-white text-[12px] font-bold rounded-xl transition-colors shrink-0 shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver detalle</span>
                      </a>

                      {/* Botones Ícono (Editar y Eliminar) */}
                      <button
                        onClick={() => openEdit(pub)}
                        className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-[#F8F7FF] border border-slate-200 hover:border-[#534AB7]/30 text-slate-500 hover:text-[#534AB7] transition-colors"
                        title="Editar publicación"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(pub)}
                        className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Eliminar publicación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredData.length === 0 && (
                <div className="py-12 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800">No hay publicaciones</h3>
                  <p className="text-[13px] text-slate-500 mt-1 max-w-sm">
                    No encontramos publicaciones que coincidan con tu búsqueda o filtros.
                  </p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </main>

      {/* ═══ MODAL ELIMINAR ═══ */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleting && setDeleteTarget(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ pointerEvents: 'none' }}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5"
                style={{ pointerEvents: 'auto', fontFamily: "'Inter', sans-serif" }}
              >
                {/* Icono */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-black text-slate-800">Eliminar publicación</h2>
                    <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                      ¿Estás seguro de que deseas eliminar
                      <span className="font-bold text-slate-700"> "{deleteTarget.titulo}"</span>?
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleting}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-[13px] hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-[13px] transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ DRAWER EDITAR ═══ */}
      <AnimatePresence>
        {editTarget && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setEditTarget(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            {/* Panel lateral */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* Header */}
              <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
                <div>
                  <h2 className="text-[17px] font-black text-slate-800">Editar publicación</h2>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Los cambios se guardan inmediatamente</p>
                </div>
                <button
                  onClick={() => setEditTarget(null)}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Formulario */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {editError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-600 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {editError}
                  </div>
                )}

                {/* Título */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Título *</label>
                  <input
                    type="text"
                    value={editForm.titulo}
                    onChange={e => setEditForm(p => ({ ...p, titulo: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all"
                    placeholder="Título del producto"
                  />
                </div>

                {/* Precio */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Precio (COP) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">$</span>
                    <input
                      type="text"
                      value={editForm.precio}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '');
                        const fmt = raw ? new Intl.NumberFormat('es-CO').format(parseInt(raw)) : '';
                        setEditForm(p => ({ ...p, precio: fmt }));
                      }}
                      className="w-full h-11 pl-8 pr-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Ubicación */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ubicación</label>
                  <input
                    type="text"
                    value={editForm.ubicacion}
                    onChange={e => setEditForm(p => ({ ...p, ubicacion: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all"
                    placeholder="Ej: Bloque D, Entrada Principal"
                  />
                </div>

                {/* Categoría */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Categoría</label>
                  <select
                    value={editForm.id_categoria}
                    onChange={e => setEditForm(p => ({ ...p, id_categoria: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-700 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all cursor-pointer"
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estado</label>
                  <select
                    value={editForm.estado}
                    onChange={e => setEditForm(p => ({ ...p, estado: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-700 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all cursor-pointer"
                  >
                    <option value="activo">Activo / Disponible</option>
                    <option value="reservado">Reservado</option>
                    <option value="vendido">Vendido</option>
                    <option value="pausado">Pausado</option>
                  </select>
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Descripción</label>
                  <textarea
                    value={editForm.descripcion}
                    onChange={e => setEditForm(p => ({ ...p, descripcion: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all resize-none"
                    placeholder="Describe el estado y detalles del producto..."
                  />
                </div>
              </div>

              {/* Footer con botones */}
              <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
                <button
                  onClick={() => setEditTarget(null)}
                  disabled={saving}
                  className="flex-1 h-11 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-[13px] hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEdit}
                  disabled={saving || !editForm.titulo.trim()}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#6055D0] to-[#534AB7] hover:from-[#5048C0] hover:to-[#4339a8] text-white font-bold text-[13px] transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* ═══ MODAL DE PAGO PARA PUBLICACIÓN ═══ */}
      {selectedPubForPago && (
        <PagoModal
          open={isPagoModalOpen}
          onClose={() => {
            setIsPagoModalOpen(false);
            setSelectedPubForPago(null);
          }}
          tipoItem="publicacion"
          idItem={selectedPubForPago.id_publicacion}
          tituloItem={selectedPubForPago.titulo}
          onSuccess={handlePagoSuccess}
        />
      )}

    </div>
  );
}
