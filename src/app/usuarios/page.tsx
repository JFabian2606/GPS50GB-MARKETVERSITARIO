"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Bell, LayoutDashboard, Package, 
  Settings, LogOut, ChevronDown, Plus, 
  Pencil, Trash2, Shield, X, Save, UserX, UserCheck,
  Sparkles, Check, Heart, Loader2, Users, Filter
} from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GestionUsuarios() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAuth, setUserAuth] = useState<any>(null);

  // Estados del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Filtros adicionales
  const [activeRol, setActiveRol] = useState("Todos los roles");
  const [isRolOpen, setIsRolOpen] = useState(false);
  
  const [activeEstado, setActiveEstado] = useState("Todos los estados");
  const [isEstadoOpen, setIsEstadoOpen] = useState(false);

  // Formulario temporal
  const [formData, setFormData] = useState<any>({});

  // Carga inicial
  useEffect(() => {
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

        if (profile?.rol !== 'admin' && profile?.rol !== 'superadmin') {
          router.push('/');
          return;
        }
      } else {
        router.push('/auth/login');
        return;
      }

      try {
        const res = await fetch('/api/usuarios');
        if (res.ok) {
          const json = await res.json();
          setUsuarios(json.data || []);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndData();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  };

  const isAdmin = userProfile?.rol === 'admin' || userProfile?.rol === 'superadmin';

  const filteredData = usuarios.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      u.nombres?.toLowerCase().includes(q) ||
      u.apellidos?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.programa_academico?.toLowerCase().includes(q);
      
    const matchRol = activeRol === "Todos los roles" || u.rol?.toLowerCase() === activeRol.toLowerCase();
    const matchEstado = activeEstado === "Todos los estados" || (u.estado || 'activo').toLowerCase() === activeEstado.toLowerCase();
    
    return matchSearch && matchRol && matchEstado;
  });

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingUser(null);
    setFormData({
      nombres: '',
      apellidos: '',
      email: '',
      password: '',
      documento_identidad: '',
      tipo_documento: 'CC',
      telefono: '',
      genero: 'No especificado',
      programa_academico: '',
      rol: 'estudiante',
      estado: 'activo'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setIsCreating(false);
    setEditingUser(u);
    setFormData({
      nombres: u.nombres || '',
      apellidos: u.apellidos || '',
      documento_identidad: u.documento_identidad || '',
      tipo_documento: u.tipo_documento || 'CC',
      telefono: u.telefono || '',
      genero: u.genero || 'No especificado',
      programa_academico: u.programa_academico || '',
      rol: u.rol || 'estudiante',
      estado: u.estado || 'activo'
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isCreating) {
        const res = await fetch(`/api/usuarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const { data } = await res.json();
          setUsuarios([data, ...usuarios]);
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          alert(err.error || 'Error al crear usuario');
        }
      } else {
        const res = await fetch(`/api/usuarios/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const { data } = await res.json();
          setUsuarios(prev => prev.map(u => u.id === data.id ? { ...u, ...data } : u));
          setIsModalOpen(false);
        } else {
          alert('Error al guardar');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u: any) => {
    const newStatus = u.estado === 'inactivo' ? 'activo' : 'inactivo';
    if (!confirm(`¿Estás seguro de que quieres ${newStatus === 'activo' ? 'activar' : 'desactivar'} a ${u.nombres}?`)) return;
    
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus })
      });
      if (res.ok) {
        setUsuarios(prev => prev.map(user => user.id === u.id ? { ...user, estado: newStatus } : user));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAdmin && !loading) {
    return null;
  }

  return (
    <div 
      className="flex h-screen bg-[#F8F9FB] overflow-hidden"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      
      {/* SIDEBAR IZQUIERDA */}
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

          <div className="px-5 py-6">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Navegación</p>
            <nav className="space-y-1.5">
              {userProfile && !isAdmin && (
                <Link href="/" className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl font-medium text-[14px] transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Explorar Feed</span>
                </Link>
              )}
              {userProfile && (
                <Link href="/publicaciones" className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl font-medium text-[14px] transition-colors">
                  <Package className="w-4 h-4" />
                  <span>{isAdmin ? 'Publicaciones' : 'Mis Publicaciones'}</span>
                </Link>
              )}
              {userProfile && isAdmin && (
                <Link href="/usuarios" className="flex items-center gap-3 px-3 py-2.5 bg-[#F8F7FF] text-[#534AB7] rounded-xl font-semibold text-[14px] transition-colors">
                  <Users className="w-4 h-4" />
                  <span>Usuarios</span>
                </Link>
              )}
              {userProfile && !isAdmin && (
                <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl font-medium text-[14px] transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>Guardados</span>
                </a>
              )}
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          
          {/* Barra de Búsqueda */}
          <div className="flex-1 max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo o carrera..." 
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

          {/* User Widgets */}
          <div className="flex items-center gap-4 ml-6">
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

        {/* Contenido Listado */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-thin">
          <div className="max-w-6xl mx-auto">
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                  Gestión de Usuarios
                </h2>
                <p className="text-[14px] text-slate-500 mt-1">Administra los usuarios registrados en la plataforma.</p>
              </div>
              <div className="flex items-center gap-3">
                
                {isAdmin && (
                  <button onClick={openCreateModal} className="flex items-center gap-2 px-5 py-2.5 bg-[#534AB7] hover:bg-[#43399b] text-white rounded-xl font-bold text-[13px] transition-colors shadow-sm shadow-indigo-500/20">
                    <Plus className="w-4 h-4" />
                    <span>Crear Usuario</span>
                  </button>
                )}

                {/* Combobox de Roles con border-radius xl */}
                {userProfile?.rol === 'superadmin' && (
                  <div className="relative hidden md:block">
                  <button 
                    onClick={() => setIsRolOpen(!isRolOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="capitalize">{activeRol}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <AnimatePresence>
                    {isRolOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        className="absolute right-0 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 overflow-hidden"
                      >
                        {["Todos los roles", "Estudiante", "Tutor", "Admin", "Superadmin"].map((rol) => (
                          <div 
                            key={rol}
                            onClick={() => { setActiveRol(rol); setIsRolOpen(false); }}
                            className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors flex items-center justify-between ${activeRol === rol ? 'bg-[#F8F7FF] text-[#534AB7]' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            {rol}
                            {activeRol === rol && <Check className="w-3.5 h-3.5" />}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                )}

                {/* Filtro Estado border-radius xl */}
                <div className="relative hidden md:block">
                  <button 
                    onClick={() => setIsEstadoOpen(!isEstadoOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <span className="capitalize">{activeEstado}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <AnimatePresence>
                    {isEstadoOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        className="absolute right-0 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 overflow-hidden"
                      >
                        {["Todos los estados", "Activo", "Inactivo"].map((estado) => (
                          <div 
                            key={estado}
                            onClick={() => { setActiveEstado(estado); setIsEstadoOpen(false); }}
                            className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors flex items-center justify-between ${activeEstado === estado ? 'bg-[#F8F7FF] text-[#534AB7]' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            {estado}
                            {activeEstado === estado && <Check className="w-3.5 h-3.5" />}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>

            {/* Listado */}
            <div className="space-y-3 mt-4">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#534AB7] mb-4" />
                    <p className="text-slate-500 font-medium">Cargando usuarios...</p>
                  </div>
                ) : filteredData.map((u, idx) => (
                  <motion.div
                    key={u.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all gap-4 group"
                  >
                    
                    {/* Avatar y Datos Básicos */}
                    <div className="flex items-center gap-4 min-w-[220px]">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase shrink-0 border border-slate-200">
                        {u.nombres?.charAt(0)}{u.apellidos?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-800">{new Date(u.created_at).toLocaleDateString()}</p>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Fecha de registro</p>
                      </div>
                    </div>

                    {/* Nombres y Carrera */}
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-[14px] font-bold text-slate-800 truncate group-hover:text-[#534AB7] transition-colors">{u.nombres} {u.apellidos}</p>
                      <p className="text-[12px] text-slate-500 font-medium truncate max-w-[250px]">{u.programa_academico || "Carrera no especificada"} • {u.email}</p>
                    </div>

                    {/* Rol */}
                    <div className="min-w-[120px] text-left md:text-right">
                      <p className="text-[15px] font-black text-slate-800 capitalize">{u.rol}</p>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Rol asignado</p>
                    </div>

                    {/* Acciones y Estado */}
                    <div className="flex items-center justify-end gap-3 min-w-[280px]">
                      {/* Badge de Estado - Pill pero consistente */}
                      <span className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg border flex items-center justify-center w-24 shrink-0 ${
                        u.estado === "inactivo" ? "bg-rose-50 text-rose-600 border-rose-100" :
                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                      }`}>
                        {u.estado || "activo"}
                      </span>
                      
                      {/* Botón Editar (Border XL consistente) */}
                      <button 
                        onClick={() => openEditModal(u)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#534AB7] hover:bg-[#43399b] text-white text-[12px] font-bold rounded-xl transition-colors shrink-0 shadow-sm"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {/* Botones Ícono (Activar/Desactivar) */}
                      <button
                        onClick={() => toggleStatus(u)}
                        className={`w-[38px] h-[38px] rounded-xl border border-slate-200 flex items-center justify-center shrink-0 transition-colors ${u.estado === 'inactivo' ? 'text-slate-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600' : 'text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600'}`}
                        title={u.estado === 'inactivo' ? 'Activar usuario' : 'Desactivar usuario'}
                      >
                        {u.estado === 'inactivo' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>
                    </div>

                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredData.length === 0 && !loading && (
                <div className="py-12 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 mb-1">No hay usuarios</h3>
                  <p className="text-[13px] text-slate-500 max-w-[250px]">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* ═══ DRAWER EDITAR ═══ */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
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
                  <h2 className="text-[17px] font-black text-slate-800">{isCreating ? 'Crear Usuario' : 'Editar Usuario'}</h2>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{isCreating ? 'Registrar nuevo usuario' : 'Gestión de perfil y permisos'}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: 'thin' }}>
                
                {isCreating && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Correo Electrónico *</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contraseña *</label>
                      <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all" />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nombres *</label>
                  <input type="text" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Apellidos *</label>
                  <input type="text" value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tipo Doc.</label>
                    <select value={formData.tipo_documento} onChange={e => setFormData({...formData, tipo_documento: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all appearance-none">
                      <option value="CC">Cédula</option>
                      <option value="TI">Tarjeta Identidad</option>
                      <option value="CE">Cédula Extranjería</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Documento</label>
                    <input type="text" value={formData.documento_identidad} onChange={e => setFormData({...formData, documento_identidad: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Programa Académico</label>
                  <input type="text" value={formData.programa_academico} onChange={e => setFormData({...formData, programa_academico: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Teléfono</label>
                    <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Género</label>
                    <select value={formData.genero} onChange={e => setFormData({...formData, genero: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all appearance-none">
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="No especificado">No especificado</option>
                    </select>
                  </div>
                </div>
                {(userProfile?.rol === 'superadmin' || userProfile?.rol === 'admin') && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Rol de Sistema</label>
                    <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all appearance-none">
                      <option value="estudiante">Estudiante</option>
                      <option value="tutor">Tutor</option>
                      {userProfile?.rol === 'superadmin' && (
                        <option value="admin">Administrador</option>
                      )}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estado de Cuenta</label>
                  <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all appearance-none">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-[13px] text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#534AB7] hover:bg-[#43399b] text-white rounded-xl font-bold text-[13px] transition-colors shadow-sm shadow-[#534AB7]/30 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Guardar</span>
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
