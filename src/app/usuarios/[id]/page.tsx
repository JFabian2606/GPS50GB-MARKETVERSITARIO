"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, BookOpen, Inbox, Send, Phone, Mail, Plus, 
  Trash2, Check, X, Clock, Sparkles, GraduationCap, 
  CalendarDays, Bell, LayoutDashboard, Package, Heart, 
  Settings, LogOut, ChevronDown, Loader2, AlertTriangle, Camera,
  Zap, FileText, UploadCloud, BookMarked
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import PagoModal from "@/components/PagoModal";

const TABS = [
  { id: "info", label: "Información", icon: User },
  { id: "tutorias", label: "Mis Tutorías", icon: BookOpen },
  { id: "recibidas", label: "Solicitudes Recibidas", icon: Inbox },
  { id: "enviadas", label: "Solicitudes Enviadas", icon: Send },
];

export default function PerfilUsuario() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // Estado modal de pago para tutoría
  const [selectedTutoriaForPago, setSelectedTutoriaForPago] = useState<any>(null);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);

  const handlePagoSuccess = (referencia: string, destacadaHasta: string) => {
    if (selectedTutoriaForPago) {
      setTutorias(prev => prev.map(t =>
        t.id_tutoria === selectedTutoriaForPago.id_tutoria
          ? { ...t, destacada: true, destacada_hasta: destacadaHasta }
          : t
      ));
    }
  };

  // Sesión y perfiles
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  // Datos específicos del perfil
  const [tutorias, setTutorias] = useState<any[]>([]);
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState<any[]>([]);
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState<any[]>([]);
  
  // Control de tabs
  const [activeTab, setActiveTab] = useState("info");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Perfil del usuario logueado en la cabecera general
  const [userProfile, setUserProfile] = useState<any>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Solicitud para ser tutor
  const [tutorRequest, setTutorRequest] = useState<any>(null);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [tutorMessage, setTutorMessage] = useState("");
  const [tutorArea, setTutorArea] = useState("");
  const [notasFile, setNotasFile] = useState<File | null>(null);
  const [notasFileName, setNotasFileName] = useState("");
  const [uploadingNotas, setUploadingNotas] = useState(false);
  const [sendingTutorRequest, setSendingTutorRequest] = useState(false);

  const isOwnProfile = currentUser?.id === id;

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        // Cargar perfil del usuario logueado para la cabecera
        const { data: loggedProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setUserProfile(loggedProfile);
      }

      // 1. Obtener perfil visitado
      const { data: targetProfile, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileErr || !targetProfile) {
        throw new Error("El perfil especificado no existe.");
      }
      setProfile(targetProfile);

      // 2. Obtener tutorías del perfil visitado
      const resTutorias = await fetch(`/api/tutorias?id_usuario=${id}`);
      if (resTutorias.ok) {
        const json = await resTutorias.json();
        setTutorias(json.data || []);
      }

      // 3. Si es el propio perfil, cargar solicitudes
      if (user?.id === id) {
        const [resRecibidas, resEnviadas] = await Promise.all([
          fetch("/api/solicitudes?tipo=recibidas"),
          fetch("/api/solicitudes?tipo=enviadas")
        ]);

        if (resRecibidas.ok) {
          const json = await resRecibidas.json();
          setSolicitudesRecibidas(json.data || []);
        }
        if (resEnviadas.ok) {
          const json = await resEnviadas.json();
          setSolicitudesEnviadas(json.data || []);
        }

        // 4. Ver estado de solicitud de tutor
        const resTutorReq = await fetch("/api/solicitudes-tutor");
        if (resTutorReq.ok) {
          const json = await resTutorReq.json();
          if (json.data && json.data.length > 0) {
            setTutorRequest(json.data[0]); // La más reciente
          }
        }
      }

    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  };

  // Acciones de Solicitud (Aceptar/Rechazar)
  const handleGestionSolicitud = async (idSolicitud: number, nuevoEstado: "aceptada" | "rechazada") => {
    setActionLoading(`${idSolicitud}-${nuevoEstado}`);
    try {
      const res = await fetch(`/api/solicitudes/${idSolicitud}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error al actualizar la solicitud");
      }

      // Actualizar localmente
      setSolicitudesRecibidas(prev => 
        prev.map(s => s.id_solicitud === idSolicitud ? { ...s, estado: nuevoEstado } : s)
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Acción de Eliminar Tutoría
  const handleEliminarTutoria = async (idTutoria: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tutoría?")) return;
    setActionLoading(`delete-tutoria-${idTutoria}`);
    try {
      const res = await fetch(`/api/tutorias/${idTutoria}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error al eliminar la tutoría");
      }

      // Actualizar localmente
      setTutorias(prev => prev.filter(t => t.id_tutoria !== idTutoria));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Cancelar Solicitud Enviada
  const handleCancelarSolicitud = async (idSolicitud: number) => {
    if (!confirm("¿Quieres cancelar esta solicitud de tutoría?")) return;
    setActionLoading(`cancel-solicitud-${idSolicitud}`);
    try {
      const res = await fetch(`/api/solicitudes/${idSolicitud}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error al cancelar la solicitud");
      }

      setSolicitudesEnviadas(prev => prev.filter(s => s.id_solicitud !== idSolicitud));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleNotasFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNotasFile(file);
    setNotasFileName(file.name);
  };

  const handleSolicitarTutor = async () => {
    if (!tutorArea.trim()) return alert("Debes indicar el área en la que deseas impartir tutorías.");
    if (!notasFile) return alert("Debes adjuntar el documento con tus notas en el área indicada.");

    setSendingTutorRequest(true);
    setUploadingNotas(true);
    try {
      // 1. Subir el archivo de notas a Supabase Storage
      const supabase = createClient();
      const ext = notasFile.name.split('.').pop();
      const filePath = `${currentUser!.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('notas-tutor')
        .upload(filePath, notasFile, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('notas-tutor')
        .getPublicUrl(filePath);
      const url_notas = urlData.publicUrl;
      setUploadingNotas(false);

      // 2. Enviar solicitud con todos los campos
      const res = await fetch("/api/solicitudes-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: tutorMessage, area_interes: tutorArea, url_notas })
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error al enviar la solicitud");
      }
      const json = await res.json();
      setTutorRequest(json.data);
      setShowTutorModal(false);
      setTutorMessage("");
      setTutorArea("");
      setNotasFile(null);
      setNotasFileName("");
      alert("Solicitud enviada exitosamente. Un administrador la revisará pronto.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingTutorRequest(false);
      setUploadingNotas(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProfile({ ...profile, avatar_url: data.publicUrl });
      setUserProfile({ ...userProfile, avatar_url: data.publicUrl });

    } catch (error: any) {
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const isAdmin = userProfile?.rol === "admin" || userProfile?.rol === "superadmin";

  return (
    <div 
      className="flex h-screen bg-[#F8F9FB] overflow-hidden"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      
      {/* ── SIDEBAR IZQUIERDA ── */}
      <Sidebar userProfile={userProfile} userAuth={currentUser} />

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar */}
        <Header 
          userProfile={userProfile} 
          userAuth={currentUser}
          title="Perfil de Usuario"
        />

        {/* Zona Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-thin">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Cargando */}
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-32 flex flex-col items-center justify-center"
                >
                  <Loader2 className="w-10 h-10 animate-spin text-[#534AB7] mb-4" />
                  <p className="text-slate-500 font-medium">Cargando perfil...</p>
                </motion.div>
              )}

              {/* Error */}
              {!loading && errorText && (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-24 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-rose-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Error de Carga</h3>
                  <p className="text-slate-500 max-w-sm mb-6">{errorText}</p>
                  <button onClick={() => router.push("/")} className="px-5 py-2.5 bg-[#534AB7] text-white rounded-xl font-bold text-sm">
                    Volver al Feed
                  </button>
                </motion.div>
              )}

              {/* Contenido Perfil */}
              {!loading && !errorText && profile && (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  
                  {/* Tarjeta de Cabecera del Perfil */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                      
                      {/* Avatar */}
                      <div className="relative group">
                        {profile.avatar_url ? (
                          <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-xl shadow-indigo-500/10 shrink-0">
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#6055D0] to-[#534AB7] flex items-center justify-center text-white font-bold text-[36px] border-4 border-white shadow-xl shadow-indigo-500/10 shrink-0 uppercase">
                            {profile.nombres?.charAt(0)}{profile.apellidos?.charAt(0)}
                          </div>
                        )}
                        
                        {isOwnProfile && (
                          <label className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent ${uploadingAvatar ? 'opacity-100' : ''}`}>
                            {uploadingAvatar ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <Camera className="w-6 h-6" />
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleAvatarUpload} 
                              disabled={uploadingAvatar}
                            />
                          </label>
                        )}
                      </div>

                      {/* Datos Básicos */}
                      <div className="text-center md:text-left space-y-2">
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <h1 className="text-2xl font-black text-slate-800 leading-tight">
                            {profile.nombres} {profile.apellidos}
                          </h1>
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border ${
                            profile.rol === "tutor" ? "bg-indigo-50 text-[#534AB7] border-indigo-100" :
                            profile.rol === "admin" || profile.rol === "superadmin" ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-slate-50 text-slate-500 border-slate-200"
                          }`}>
                            {profile.rol === "tutor" ? "Tutor Oficial" : profile.rol}
                          </span>
                        </div>

                        {profile.programa_academico && (
                          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500">
                            <GraduationCap className="w-4 h-4 text-slate-400" />
                            <span className="text-[14px] font-semibold">{profile.programa_academico}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-[13px] text-slate-400">
                          {profile.telefono && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{profile.telefono}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Miembro desde {new Date(profile.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones Propietario o Contacto */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {isOwnProfile ? (
                        <>
                          {profile?.rol === "tutor" ? (
                            <Link 
                              href="/tutorias/nueva" 
                              className="flex items-center gap-2 px-5 py-2.5 bg-[#534AB7] hover:bg-[#43399b] text-white rounded-xl font-bold text-[13px] transition-colors shadow-sm shadow-indigo-500/20"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Ofrecer Tutoría</span>
                            </Link>
                          ) : profile?.rol === "estudiante" ? (
                            tutorRequest ? (
                              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] border ${
                                tutorRequest.estado === 'pendiente' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                tutorRequest.estado === 'rechazada' ? 'bg-rose-50 text-rose-600 border-rose-200' : ''
                              }`}>
                                {tutorRequest.estado === 'pendiente' ? 'Solicitud de Tutor Pendiente' : 'Solicitud de Tutor Rechazada'}
                              </div>
                            ) : (
                              <button 
                                onClick={() => setShowTutorModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-[13px] transition-colors shadow-sm"
                              >
                                <GraduationCap className="w-4 h-4" />
                                <span>Solicitar ser Tutor</span>
                              </button>
                            )
                          ) : null}
                        </>
                      ) : (
                        profile.telefono && (
                          <a 
                            href={`https://wa.me/57${profile.telefono}?text=Hola%20${profile.nombres},%20me%20gustaría%20saber%20más%20sobre%20tus%20tutorías.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-bold text-[13px] transition-colors shadow-sm shadow-green-500/20"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Contactar por WhatsApp</span>
                          </a>
                        )
                      )}
                    </div>
                  </div>

                  {/* Panel de Contenido / Pestañas */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    
                    {/* Sidebar Pestañas (Solo si es dueño) */}
                    {isOwnProfile ? (
                      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-1 shadow-sm">
                        {TABS.map(tab => {
                          const IconComp = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${
                                isActive 
                                  ? "bg-[#F8F7FF] text-[#534AB7]" 
                                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                              }`}
                            >
                              <IconComp className={`w-4 h-4 ${isActive ? 'text-[#534AB7]' : 'text-slate-400'}`} />
                              <span>{tab.label}</span>
                              {tab.id === "recibidas" && solicitudesRecibidas.filter(s => s.estado === "pendiente").length > 0 && (
                                <span className="ml-auto w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                                  {solicitudesRecibidas.filter(s => s.estado === "pendiente").length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      // Si no es dueño, solo se muestra información y tutorías en una sola columna lateral
                      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-sm">
                        <div>
                          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Información de Contacto</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-[14px]">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-700 font-medium truncate">{profile.email || "No disponible"}</span>
                            </div>
                            {profile.telefono && (
                              <div className="flex items-center gap-3 text-[14px]">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-700 font-medium">{profile.telefono}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contenedor Principal de la Pestaña */}
                    <div className="lg:col-span-3">
                      <AnimatePresence mode="wait">
                        
                        {/* 1. INFORMACIÓN */}
                        {activeTab === "info" && (
                          <motion.div
                            key="info"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-sm"
                          >
                            <h2 className="text-[16px] font-bold text-slate-800 border-b border-slate-50 pb-3">Detalle del Perfil</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombres</p>
                                <p className="text-[14px] font-semibold text-slate-700">{profile.nombres}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Apellidos</p>
                                <p className="text-[14px] font-semibold text-slate-700">{profile.apellidos}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Programa Académico</p>
                                <p className="text-[14px] font-semibold text-slate-700">{profile.programa_academico || "No especificado"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Género</p>
                                <p className="text-[14px] font-semibold text-slate-700">{profile.genero || "No especificado"}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* 2. MIS TUTORÍAS */}
                        {activeTab === "tutorias" && (
                          <motion.div
                            key="tutorias"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h2 className="text-[16px] font-bold text-slate-800">
                                {isOwnProfile ? "Mis Tutorías Ofrecidas" : `Tutorías de ${profile.nombres}`}
                              </h2>
                            </div>

                            {tutorias.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tutorias.map(t => (
                                  <div 
                                    key={t.id_tutoria} 
                                    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#534AB7] bg-indigo-50 px-2 py-0.5 rounded-md">
                                          {t.asignatura}
                                        </span>
                                        {t.nivel && (
                                          <span className="text-[11px] text-slate-400 font-medium">
                                            {t.nivel}
                                          </span>
                                        )}
                                      </div>
                                      <Link href={`/tutorias/${t.id_tutoria}`} className="block">
                                        <h3 className="font-bold text-[15px] text-slate-800 hover:text-[#534AB7] transition-colors leading-snug line-clamp-1">
                                          {t.titulo}
                                        </h3>
                                      </Link>
                                      <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
                                        {t.descripcion || "Sin descripción adicional."}
                                      </p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 mt-4 flex items-center justify-between">
                                      <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Costo por Hora</p>
                                        <p className="text-[15px] font-black text-slate-800">
                                          ${new Intl.NumberFormat("es-CO").format(t.precio || 0)}
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {isOwnProfile && (
                                          <>
                                            {t.destacada && t.destacada_hasta && new Date(t.destacada_hasta) > new Date() ? (
                                              <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2 text-[11px] font-bold rounded-xl shadow-sm shrink-0">
                                                <Sparkles className="w-3.5 h-3.5 fill-white text-white animate-pulse" />
                                                <span>Destacada</span>
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() => {
                                                  setSelectedTutoriaForPago(t);
                                                  setIsPagoModalOpen(true);
                                                }}
                                                className="flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white text-[11px] font-bold rounded-xl transition-all shrink-0 shadow-sm shadow-amber-500/25"
                                                title="Destacar Tutoría"
                                              >
                                                <Zap className="w-3.5 h-3.5 fill-white text-white" />
                                                <span>Potenciar</span>
                                              </button>
                                            )}

                                            <button
                                              onClick={() => handleEliminarTutoria(t.id_tutoria)}
                                              disabled={actionLoading === `delete-tutoria-${t.id_tutoria}`}
                                              className="w-9 h-9 rounded-xl border border-slate-200 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 flex items-center justify-center transition-all shrink-0"
                                              title="Eliminar Tutoría"
                                            >
                                              {actionLoading === `delete-tutoria-${t.id_tutoria}` ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                              ) : (
                                                <Trash2 className="w-4 h-4" />
                                              )}
                                            </button>
                                          </>
                                        )}
                                        <Link 
                                          href={`/tutorias/${t.id_tutoria}`}
                                          className="px-4 py-2 bg-slate-50 hover:bg-[#F8F7FF] text-[#534AB7] text-[12px] font-bold rounded-xl border border-slate-100 hover:border-[#534AB7]/10 transition-all shrink-0"
                                        >
                                          Ver Detalle
                                        </Link>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-12 bg-white rounded-2xl border border-slate-100 text-center flex flex-col items-center justify-center shadow-sm">
                                <BookOpen className="w-8 h-8 text-slate-300 mb-3" />
                                <h3 className="text-slate-800 font-bold text-[14px]">No hay tutorías</h3>
                                <p className="text-slate-400 text-xs mt-1">Este usuario no tiene tutorías publicadas actualmente.</p>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* 3. SOLICITUDES RECIBIDAS (TUTOR) */}
                        {activeTab === "recibidas" && isOwnProfile && (
                          <motion.div
                            key="recibidas"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                          >
                            <h2 className="text-[16px] font-bold text-slate-800 mb-2">Solicitudes Recibidas de Estudiantes</h2>
                            
                            {solicitudesRecibidas.length > 0 ? (
                              <div className="space-y-3">
                                {solicitudesRecibidas.map(s => (
                                  <div 
                                    key={s.id_solicitud} 
                                    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow"
                                  >
                                    <div className="space-y-1.5 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-[14px] text-slate-800">
                                          {s.perfil?.nombres} {s.perfil?.apellidos}
                                        </p>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-[12px] font-semibold text-slate-500">
                                          {s.perfil?.programa_academico || "Carrera no esp."}
                                        </span>
                                      </div>
                                      <p className="text-[13px] text-slate-700 leading-snug">
                                        Interesado en: <span className="font-semibold text-[#534AB7]">{s.tutoria?.titulo}</span>
                                      </p>
                                      {s.mensaje && (
                                        <p className="text-[12px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                                          "{s.mensaje}"
                                        </p>
                                      )}
                                      <div className="flex items-center gap-4 text-[11px] text-slate-400">
                                        <span className="flex items-center gap-1">
                                          <CalendarDays className="w-3 h-3" />
                                          {new Date(s.fecha).toLocaleDateString()} {new Date(s.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {s.perfil?.telefono && s.estado === "aceptada" && (
                                          <a 
                                            href={`https://wa.me/57${s.perfil.telefono}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                                          >
                                            <Phone className="w-3 h-3" /> WhatsApp: {s.perfil.telefono}
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    {/* Estado / Acciones */}
                                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                      {s.estado === "pendiente" ? (
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleGestionSolicitud(s.id_solicitud, "rechazada")}
                                            disabled={actionLoading !== null}
                                            className="h-9 px-3 border border-rose-200 hover:bg-rose-50 text-rose-500 font-bold text-[12px] rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                            <span>Rechazar</span>
                                          </button>
                                          <button
                                            onClick={() => handleGestionSolicitud(s.id_solicitud, "aceptada")}
                                            disabled={actionLoading !== null}
                                            className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[12px] rounded-xl flex items-center gap-1 transition-all shadow-sm shadow-emerald-500/10 disabled:opacity-50"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Aceptar</span>
                                          </button>
                                        </div>
                                      ) : (
                                        <span className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border ${
                                          s.estado === "aceptada" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                          "bg-rose-50 text-rose-600 border-rose-100"
                                        }`}>
                                          {s.estado}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-12 bg-white rounded-2xl border border-slate-100 text-center flex flex-col items-center justify-center shadow-sm">
                                <Inbox className="w-8 h-8 text-slate-300 mb-3" />
                                <h3 className="text-slate-800 font-bold text-[14px]">No hay solicitudes</h3>
                                <p className="text-slate-400 text-xs mt-1">Nadie ha solicitado tus tutorías por el momento.</p>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* 4. SOLICITUDES ENVIADAS (ESTUDIANTE) */}
                        {activeTab === "enviadas" && isOwnProfile && (
                          <motion.div
                            key="enviadas"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                          >
                            <h2 className="text-[16px] font-bold text-slate-800 mb-2">Mis Solicitudes de Tutoría Enviadas</h2>
                            
                            {solicitudesEnviadas.length > 0 ? (
                              <div className="space-y-3">
                                {solicitudesEnviadas.map(s => (
                                  <div 
                                    key={s.id_solicitud} 
                                    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow"
                                  >
                                    <div className="space-y-1.5 flex-1">
                                      <h3 className="font-bold text-[14px] text-slate-800">
                                        Tutoría: <span className="text-[#534AB7]">{s.tutoria?.titulo || "Tutoría eliminada"}</span>
                                      </h3>
                                      <p className="text-[13px] text-slate-600">
                                        Tutor: <span className="font-semibold text-slate-700">{s.tutoria?.perfil?.nombres} {s.tutoria?.perfil?.apellidos}</span>
                                      </p>
                                      {s.mensaje && (
                                        <p className="text-[12px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-50 italic">
                                          Mensaje enviado: "{s.mensaje}"
                                        </p>
                                      )}
                                      <div className="flex items-center gap-4 text-[11px] text-slate-400">
                                        <span className="flex items-center gap-1">
                                          <CalendarDays className="w-3 h-3" />
                                          {new Date(s.fecha).toLocaleDateString()}
                                        </span>
                                        {s.tutoria?.perfil?.telefono && s.estado === "aceptada" && (
                                          <a 
                                            href={`https://wa.me/57${s.tutoria.perfil.telefono}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                                          >
                                            <Phone className="w-3 h-3" /> Contactar Tutor: {s.tutoria.perfil.telefono}
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    {/* Estado / Acción */}
                                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                                      <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border ${
                                        s.estado === "aceptada" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                        s.estado === "rechazada" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                        "bg-amber-50 text-amber-600 border-amber-100"
                                      }`}>
                                        {s.estado}
                                      </span>

                                      {s.estado === "pendiente" && (
                                        <button
                                          onClick={() => handleCancelarSolicitud(s.id_solicitud)}
                                          disabled={actionLoading === `cancel-solicitud-${s.id_solicitud}`}
                                          className="w-9 h-9 rounded-xl border border-slate-200 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 flex items-center justify-center transition-all"
                                          title="Cancelar Solicitud"
                                        >
                                          {actionLoading === `cancel-solicitud-${s.id_solicitud}` ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <X className="w-4 h-4" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-12 bg-white rounded-2xl border border-slate-100 text-center flex flex-col items-center justify-center shadow-sm">
                                <Send className="w-8 h-8 text-slate-300 mb-3" />
                                <h3 className="text-slate-800 font-bold text-[14px]">No has enviado solicitudes</h3>
                                <p className="text-slate-400 text-xs mt-1">Explora tutorías e inscríbete para que aparezcan aquí.</p>
                              </div>
                            )}
                          </motion.div>
                        )}

                      </AnimatePresence>
                    </div>

                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </main>

      {/* ═══ MODAL SOLICITAR SER TUTOR ═══ */}
      <AnimatePresence>
        {showTutorModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !sendingTutorRequest && setShowTutorModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 pointer-events-auto flex flex-col gap-5 max-h-[90vh] overflow-y-auto">

                {/* Encabezado */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-6 h-6 text-[#534AB7]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800 leading-tight">Solicitar ser Tutor</h2>
                      <p className="text-[12px] text-slate-400">Completa los campos para enviar tu solicitud</p>
                    </div>
                  </div>
                  <button
                    onClick={() => !sendingTutorRequest && setShowTutorModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Campo 1: Área de tutorías */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <BookMarked className="w-3.5 h-3.5 text-[#534AB7]" />
                    Área en la que deseas impartir tutorías <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tutorArea}
                    onChange={e => setTutorArea(e.target.value)}
                    placeholder="Ej: Cálculo diferencial, Programación, Estadística..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all"
                    disabled={sendingTutorRequest}
                  />
                </div>

                {/* Campo 2: Subir notas */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#534AB7]" />
                    Documento de notas en esa área <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-400 -mt-1">Adjunta tu historial académico, kardex o captura de notas (PDF, imagen o Word)</p>

                  <label
                    className={`flex flex-col items-center justify-center gap-2 w-full py-6 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                      notasFile
                        ? "border-[#534AB7] bg-indigo-50/60"
                        : "border-slate-200 hover:border-[#534AB7]/40 hover:bg-slate-50"
                    } ${sendingTutorRequest ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {notasFile ? (
                      <>
                        <FileText className="w-8 h-8 text-[#534AB7]" />
                        <span className="text-[13px] font-bold text-[#534AB7] text-center px-2 truncate max-w-full">{notasFileName}</span>
                        <span className="text-[11px] text-slate-400">Haz clic para cambiar el archivo</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-slate-300" />
                        <span className="text-[13px] font-semibold text-slate-500">Haz clic para subir tu archivo</span>
                        <span className="text-[11px] text-slate-400">PDF, JPG, PNG, DOCX — máx. 10 MB</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                      onChange={handleNotasFileChange}
                      disabled={sendingTutorRequest}
                    />
                  </label>
                </div>

                {/* Campo 3: Mensaje de justificación (opcional) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Mensaje de justificación <span className="text-slate-300 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={tutorMessage}
                    onChange={e => setTutorMessage(e.target.value)}
                    rows={3}
                    placeholder="Ej: Tengo buen promedio en cálculo y me gustaría ayudar a otros estudiantes..."
                    className="w-full p-4 rounded-xl border border-slate-200 text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 resize-none transition-all"
                    disabled={sendingTutorRequest}
                  />
                </div>

                {/* Botón enviar */}
                <button
                  onClick={handleSolicitarTutor}
                  disabled={sendingTutorRequest || !tutorArea.trim() || !notasFile}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#6055D0] to-[#534AB7] hover:from-[#5048C0] hover:to-[#4339a8] text-white font-bold text-[14px] transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingTutorRequest ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {uploadingNotas ? 'Subiendo documento...' : 'Enviando solicitud...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar Solicitud
                    </>
                  )}
                </button>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ MODAL DE PAGO PARA TUTORÍA ═══ */}
      {selectedTutoriaForPago && (
        <PagoModal
          open={isPagoModalOpen}
          onClose={() => {
            setIsPagoModalOpen(false);
            setSelectedTutoriaForPago(null);
          }}
          tipoItem="tutoria"
          idItem={selectedTutoriaForPago.id_tutoria}
          tituloItem={selectedTutoriaForPago.titulo}
          onSuccess={handlePagoSuccess}
        />
      )}

    </div>
  );
}
