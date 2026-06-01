"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Loader2, Sparkles, MessageCircle, ExternalLink, CalendarDays, Trash2, ArrowUpRight
} from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function GuardadosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAuth, setUserAuth] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndFavoritos = async () => {
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
      } else {
        router.push('/auth/login');
        return;
      }

      await loadFavoritos();
    };

    fetchUserAndFavoritos();
  }, []);

  const loadFavoritos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/favoritos');
      if (res.ok) {
        const json = await res.json();
        setFavoritos(json.data || []);
      }
    } catch (e) {
      console.error("Error al cargar favoritos:", e);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (item: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic UI update
    setFavoritos(prev => prev.filter(f => f.id_favorito !== item.id_favorito));

    try {
      const params = new URLSearchParams();
      if (item.id_publicacion) {
        params.append('id_publicacion', String(item.id_publicacion));
      } else if (item.id_tutoria) {
        params.append('id_tutoria', String(item.id_tutoria));
      }

      await fetch(`/api/favoritos?${params.toString()}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error("Error al eliminar favorito:", err);
      // Revert if error
      loadFavoritos();
    }
  };

  if (loading && favoritos.length === 0) {
    return (
      <div className="flex h-screen bg-[#F8F9FB] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Sidebar userProfile={userProfile} userAuth={userAuth} />
        <main className="flex-1 flex flex-col min-w-0">
          <Header userProfile={userProfile} userAuth={userAuth} title="Guardados" />
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#534AB7] mb-4" />
            <p className="text-slate-500 font-bold text-sm">Cargando tus guardados...</p>
          </div>
        </main>
      </div>
    );
  }

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
          title="Tus Guardados" 
        />

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-thin">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Cabecera */}
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                Mis Guardados
              </h2>
              <p className="text-[13px] text-slate-400 mt-0.5">Accede y administra las publicaciones y tutorías que has guardado.</p>
            </div>

            {/* Listado de Favoritos */}
            <AnimatePresence mode="popLayout">
              {favoritos.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm"
                >
                  <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-rose-450 fill-rose-100" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 mb-1">Aún no tienes elementos guardados</h3>
                  <p className="text-[13px] text-slate-500 max-w-[300px] mb-4">
                    Explora el marketplace o las tutorías y haz clic en el corazón para guardarlos aquí.
                  </p>
                  <Link href="/" className="px-5 py-2.5 bg-[#534AB7] hover:bg-[#43399b] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-500/10">
                    Explorar el Feed
                  </Link>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoritos.map((fav: any) => {
                    const item = fav.publicacion || fav.tutoria;
                    const isPublicacion = !!fav.publicacion;
                    const detailUrl = isPublicacion ? `/publicaciones/${item.id_publicacion}` : `/tutorias/${item.id_tutoria}`;

                    return (
                      <motion.div
                        key={fav.id_favorito}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group relative"
                      >
                        {/* Imagen o cabecera visual */}
                        <div className="h-44 bg-slate-50 relative shrink-0 overflow-hidden">
                          {isPublicacion && item.imagen ? (
                            <img 
                              src={item.imagen} 
                              alt={item.titulo} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                              <BookOpen className="w-10 h-10 text-indigo-300" />
                            </div>
                          )}

                          {/* Tipo Badge */}
                          <div className="absolute top-3 left-3">
                            <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md shadow-sm border block backdrop-blur-sm ${
                              isPublicacion ? "bg-blue-50/90 text-blue-600 border-blue-100" : "bg-purple-50/90 text-purple-600 border-purple-100"
                            }`}>
                              {isPublicacion ? "Producto" : "Tutoría"}
                            </span>
                          </div>

                          {/* Eliminar Favorito */}
                          <motion.button 
                            onClick={(e) => removeFavorite(fav, e)}
                            whileTap={{ scale: 1.3 }}
                            className="absolute top-3 right-3 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors shadow-sm z-10"
                            title="Eliminar de guardados"
                          >
                            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                          </motion.button>
                        </div>

                        {/* Contenido */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {isPublicacion ? (item.categorias?.nombre || "Marketplace") : (item.asignatura || "Tutoría")}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 mb-2 group-hover:text-[#534AB7] transition-colors">
                              {item.titulo}
                            </h3>
                            
                            <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                              {item.descripcion}
                            </p>
                          </div>

                          <div className="border-t border-slate-50 pt-4 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Precio</p>
                              <p className="text-sm font-black text-slate-850">
                                ${new Intl.NumberFormat("es-CO").format(item.precio)}
                              </p>
                            </div>

                            <Link 
                              href={detailUrl}
                              className="inline-flex items-center gap-1 px-4 py-2 bg-[#534AB7] hover:bg-[#43399b] text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-500/10"
                            >
                              <span>Ver detalle</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </main>
    </div>
  );
}

// Icono temporal no importado
function BookOpen(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
