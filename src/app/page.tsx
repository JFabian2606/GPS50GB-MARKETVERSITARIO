"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Bell, LayoutDashboard, Package, 
  Settings, LogOut, ChevronDown, MapPin, 
  Heart, Filter, Sparkles, Check, Loader2,
  User, BookOpen, Clock, GraduationCap
} from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const RANGOS_PRECIO = [
  { label: "Todos los precios", min: 0, max: Infinity },
  { label: "Menos de $50.000", min: 0, max: 50000 },
  { label: "$50.000 - $200.000", min: 50000, max: 200000 },
  { label: "Más de $200.000", min: 200000, max: Infinity },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } }
};

export default function FeedMarketplace() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("Todas las categorías");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [tutorias, setTutorias] = useState<any[]>([]);
  const [activeFeedTab, setActiveFeedTab] = useState<'productos' | 'tutorias'>('productos');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAuth, setUserAuth] = useState<any>(null);


  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false); // debounce indicator
  const [activePriceRange, setActivePriceRange] = useState(0);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [likedItems, setLikedItems] = useState<{ [key: string]: boolean }>({});

  const PERIODOS = ["Todo el periodo", "Últimas 24 horas", "Última semana", "Último mes"];
  const [activePeriod, setActivePeriod] = useState("Todo el periodo");
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);


  // Carga inicial (Auth y Productos)
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

        // Redirect admin to dashboard
        if (profile?.rol === 'admin' || profile?.rol === 'superadmin') {
          router.push('/publicaciones');
          return;
        }

        // Cargar favoritos
        try {
          const favRes = await fetch('/api/favoritos');
          if (favRes.ok) {
            const favJson = await favRes.json();
            const likedMap: { [key: string]: boolean } = {};
            (favJson.data || []).forEach((fav: any) => {
              if (fav.id_publicacion) {
                likedMap[fav.id_publicacion] = true;
              } else if (fav.id_tutoria) {
                likedMap[fav.id_tutoria] = true;
              }
            });
            setLikedItems(likedMap);
          }
        } catch (err) {
          console.error("Error al cargar favoritos iniciales:", err);
        }
      }

      try {
        const [resPubs, resCats, resTuts] = await Promise.all([
          fetch('/api/publicaciones?estado=activo'),
          fetch('/api/categorias'),
          fetch('/api/tutorias')
        ]);

        if (resPubs.ok) {
          const json = await resPubs.json();
          setProductos(json.data || []);
        }

        if (resCats.ok) {
          const jsonCats = await resCats.json();
          setCategorias(jsonCats.data || []);
        }

        if (resTuts.ok) {
          const jsonTuts = await resTuts.json();
          setTutorias(jsonTuts.data || []);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndData();
  }, []);



  // Búsqueda debounced: cuando el query cambia, espera 400ms y consulta el servidor
  React.useEffect(() => {
    const trimmed = searchQuery.trim();

    // Si está vacío, restaurar carga completa
    if (!trimmed) {
      const reload = async () => {
        setIsSearching(true);
        try {
          if (activeFeedTab === 'productos') {
            const res = await fetch('/api/publicaciones?estado=activo');
            if (res.ok) {
              const json = await res.json();
              setProductos(json.data || []);
            }
          } else {
            const res = await fetch('/api/tutorias');
            if (res.ok) {
              const json = await res.json();
              setTutorias(json.data || []);
            }
          }
        } finally {
          setIsSearching(false);
        }
      };
      reload();
      return;
    }

    // Debounce 400ms antes de llamar al servidor
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (activeFeedTab === 'productos') {
          params.append('estado', 'activo');
          const res = await fetch(`/api/publicaciones?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            setProductos(json.data || []);
          }
        } else {
          const res = await fetch(`/api/tutorias?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            setTutorias(json.data || []);
          }
        }
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFeedTab]);



  const toggleLike = async (id: string, e: React.MouseEvent, type: 'publicacion' | 'tutoria' = 'publicacion') => {
    e.preventDefault();
    e.stopPropagation();

    if (!userAuth) {
      alert("Debes iniciar sesión para guardar favoritos");
      return;
    }

    const isCurrentlyLiked = likedItems[id];
    
    // Update UI optimistically
    setLikedItems(prev => ({ ...prev, [id]: !isCurrentlyLiked }));

    try {
      if (isCurrentlyLiked) {
        // DELETE from favorites
        const params = new URLSearchParams();
        if (type === 'publicacion') {
          params.append('id_publicacion', id);
        } else {
          params.append('id_tutoria', id);
        }
        await fetch(`/api/favoritos?${params.toString()}`, {
          method: 'DELETE'
        });
      } else {
        // POST to favorites
        await fetch('/api/favoritos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_publicacion: type === 'publicacion' ? parseInt(id) : undefined,
            id_tutoria: type === 'tutoria' ? parseInt(id) : undefined,
          })
        });
      }
    } catch (err) {
      console.error("Error al alternar favorito:", err);
      // Revert if error
      setLikedItems(prev => ({ ...prev, [id]: isCurrentlyLiked }));
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  };

  const currentPriceRange = RANGOS_PRECIO[activePriceRange];

  // Filtros client-side (Precio, Categoría y Tiempo)
  const filteredProducts = productos.filter(p => {
    // 1. Precio
    const matchPrice = p.precio >= currentPriceRange.min && p.precio <= currentPriceRange.max;
    
    // 2. Categoría
    const matchCategory = activeCategory === "Todas las categorías" || p.categorias?.nombre === activeCategory;

    // 3. Periodo
    const matchPeriod = (() => {
      if (activePeriod === "Todo el periodo") return true;
      const pubDate = new Date(p.created_at);
      const diffDays = (new Date().getTime() - pubDate.getTime()) / (1000 * 3600 * 24);
      if (activePeriod === "Últimas 24 horas") return diffDays <= 1;
      if (activePeriod === "Última semana") return diffDays <= 7;
      if (activePeriod === "Último mes") return diffDays <= 30;
      return true;
    })();

    return matchPrice && matchCategory && matchPeriod;
  });

  const filteredTutorias = tutorias.filter(t => {
    const price = Number(t.precio) || 0;
    const matchPrice = price >= currentPriceRange.min && price <= currentPriceRange.max;

    const matchPeriod = (() => {
      if (activePeriod === "Todo el periodo") return true;
      const pubDate = new Date(t.created_at);
      const diffDays = (new Date().getTime() - pubDate.getTime()) / (1000 * 3600 * 24);
      if (activePeriod === "Últimas 24 horas") return diffDays <= 1;
      if (activePeriod === "Última semana") return diffDays <= 7;
      if (activePeriod === "Último mes") return diffDays <= 30;
      return true;
    })();

    return matchPrice && matchPeriod;
  });

  const featuredProducts = filteredProducts.filter(p => p.destacada && p.destacada_hasta && new Date(p.destacada_hasta) > new Date());
  const regularProducts = filteredProducts.filter(p => !(p.destacada && p.destacada_hasta && new Date(p.destacada_hasta) > new Date()));

  const featuredTutorias = filteredTutorias.filter(t => t.destacada && t.destacada_hasta && new Date(t.destacada_hasta) > new Date());
  const regularTutorias = filteredTutorias.filter(t => !(t.destacada && t.destacada_hasta && new Date(t.destacada_hasta) > new Date()));

  const hasNoItems = activeFeedTab === 'productos' 
    ? (featuredProducts.length === 0 && regularProducts.length === 0)
    : (featuredTutorias.length === 0 && regularTutorias.length === 0);

  const isAdmin = userProfile?.rol === 'admin' || userProfile?.rol === 'superadmin';

  return (
    <div 
      className="flex h-screen bg-[#F8F9FB] overflow-hidden"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      
      {/* 1. SIDEBAR IZQUIERDA */}
      <Sidebar userProfile={userProfile} userAuth={userAuth} />

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar: Buscador y Perfil */}
        <Header 
          userProfile={userProfile} 
          userAuth={userAuth} 
          showSearch={true}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
        />

        {/* Scrollable Feed */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-thin">
          
          {/* Cabecera y Filtros */}
          <div className="mb-8">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {activeFeedTab === 'productos' ? 'Descubre Productos' : 'Explora Tutorías Académicas'}
                </h2>
                {/* Selector de Feed (Productos / Tutorías) */}
                <div className="flex bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200/50">
                  <button 
                    onClick={() => setActiveFeedTab('productos')}
                    className={`px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${activeFeedTab === 'productos' ? 'bg-white text-[#534AB7] shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    Productos
                  </button>
                  <button 
                    onClick={() => setActiveFeedTab('tutorias')}
                    className={`px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${activeFeedTab === 'tutorias' ? 'bg-white text-[#534AB7] shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
                  >
                    Tutorías
                  </button>
                </div>
              </div>

              {/* Filtros Secundarios (Precio y Orden) */}
              <div className="flex items-center gap-3 relative">
                {/* Filtro Rango de Precio */}
                <div className="relative">
                  <button 
                    onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <span>{currentPriceRange.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <AnimatePresence>
                    {isPriceDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1"
                      >
                        {RANGOS_PRECIO.map((rango, idx) => (
                          <div 
                            key={idx}
                            onClick={() => { setActivePriceRange(idx); setIsPriceDropdownOpen(false); }}
                            className={`px-4 py-2 text-[13px] cursor-pointer transition-colors ${activePriceRange === idx ? 'bg-[#F8F7FF] text-[#534AB7] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            {rango.label}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Filtro Período (antes Recientes) */}
                <div className="relative">
                  <button 
                    onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>{activePeriod}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <AnimatePresence>
                    {isPeriodOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1"
                      >
                        {PERIODOS.map((period) => (
                          <div 
                            key={period}
                            onClick={() => { setActivePeriod(period); setIsPeriodOpen(false); }}
                            className={`px-4 py-2 text-[13px] cursor-pointer transition-colors ${activePeriod === period ? 'bg-[#F8F7FF] text-[#534AB7] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            {period}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Filtro de Categoría (Dropdown Consistente) - Solo para Productos */}
            {activeFeedTab === 'productos' && (
              <div className="relative w-full sm:w-auto">
                <button 
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm w-full sm:w-64 justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{activeCategory}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
                <AnimatePresence>
                  {isCategoryOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      className="absolute left-0 top-12 w-full sm:w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 overflow-hidden"
                    >
                      {["Todas las categorías", ...categorias.map(c => c.nombre)].map((cat) => (
                        <div 
                          key={cat}
                          onClick={() => { setActiveCategory(cat); setIsCategoryOpen(false); }}
                          className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors flex items-center justify-between ${activeCategory === cat ? 'bg-[#F8F7FF] text-[#534AB7]' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          <span className="truncate pr-2">{cat}</span>
                          {activeCategory === cat && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ── SECCIÓN DESTACADAS (PRODUCTOS) ── */}
          {!loading && !isSearching && activeFeedTab === 'productos' && featuredProducts.length > 0 && (
            <div className="mb-10 animate-fade-in">
              <div className="flex items-center gap-2 mb-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-2 rounded-2xl border border-amber-200/50 w-fit shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                <h3 className="text-[14px] font-black text-amber-800 tracking-tight">Publicaciones Destacadas</h3>
                <span className="bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ml-1">Premium</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {featuredProducts.map((producto) => {
                  const isLiked = likedItems[producto.id_publicacion] || false;
                  return (
                    <motion.div
                      key={`feat-pub-${producto.id_publicacion}`}
                      layout
                      variants={cardVariants}
                      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(245, 158, 11, 0.15)" }}
                      className="bg-white rounded-2xl border-2 border-amber-300 overflow-hidden transition-all duration-205 group flex flex-col shadow-[0_4px_20px_rgba(245,158,11,0.05)] relative"
                    >
                      {/* Imagen del Producto (Aspect Ratio 4/3) */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-105">
                        <img 
                          src={producto.imagen || "https://images.unsplash.com/photo-1555421689-d68471e189f2?q=80&w=600&auto=format&fit=crop"} 
                          alt={producto.titulo} 
                          className={`w-full h-full object-cover transition-transform duration-500 ${
                            producto.estado === "vendido" ? "grayscale opacity-60" : "group-hover:scale-105"
                          }`}
                        />
                        
                        {/* Badges de Destacado y Estado */}
                        <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                          <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3 fill-white text-white" />
                            Destacada
                          </span>
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm border block ${
                            producto.estado === "disponible" ? "bg-white/90 backdrop-blur-sm text-emerald-600 border-emerald-100" :
                            producto.estado === "reservado" ? "bg-white/90 backdrop-blur-sm text-amber-600 border-amber-100" :
                            "bg-slate-800/90 backdrop-blur-sm text-white border-transparent"
                          }`}>
                            {producto.estado}
                          </span>
                        </div>
                        
                        {/* Botón Favorito Flotante */}
                        <motion.button 
                          onClick={(e) => toggleLike(producto.id_publicacion, e)}
                          whileTap={{ scale: 1.4 }}
                          animate={{ scale: isLiked ? [1, 1.3, 1] : 1 }}
                          transition={{ duration: 0.35, type: "tween", ease: "backOut" }}
                          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-white transition-colors shadow-sm z-10"
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                        </motion.button>
                      </div>

                      {/* Información del Producto */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-[#534AB7] uppercase tracking-wider bg-[#F8F7FF] px-2 py-0.5 rounded-sm">
                            {producto.categoria || "Varios"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(producto.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-[15px] font-bold text-slate-800 leading-snug line-clamp-2 mb-3 group-hover:text-[#534AB7] transition-colors">
                          {producto.titulo}
                        </h3>
                        
                        <div className="mt-auto">
                          <div className="border-t border-slate-105 pt-3 mt-3 flex items-center justify-between">
                            <p className="text-xl font-black text-slate-800 tracking-tight">
                              <span className="text-sm font-semibold text-slate-400 mr-1">$</span>
                              {new Intl.NumberFormat("es-CO").format(producto.precio || 0)}
                            </p>
                            <Link 
                              href={`/publicaciones/${producto.id_publicacion}`}
                              className="px-3.5 py-2 bg-gradient-to-r from-[#6055D0] to-[#534AB7] hover:from-[#5048C0] hover:to-[#4339a8] text-white text-[11px] font-bold rounded-lg border border-transparent transition-all shadow-sm"
                            >
                              Ver Detalle
                            </Link>
                          </div>

                          {/* Footer de la Card: Vendedor y Ubicación */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6055D0] to-[#534AB7] flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm">
                                {producto.perfil?.nombres?.charAt(0) || "U"}
                              </div>
                              <span className="text-[12px] font-medium text-slate-600">{producto.perfil?.nombres} {producto.perfil?.apellidos}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-medium truncate max-w-[80px]">{producto.ubicacion || "Campus"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="border-b border-slate-200/60 mt-10 mb-8" />
            </div>
          )}

          {/* ── SECCIÓN DESTACADAS (TUTORÍAS) ── */}
          {!loading && !isSearching && activeFeedTab === 'tutorias' && featuredTutorias.length > 0 && (
            <div className="mb-10 animate-fade-in">
              <div className="flex items-center gap-2 mb-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-2 rounded-2xl border border-amber-200/50 w-fit shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                <h3 className="text-[14px] font-black text-amber-800 tracking-tight">Tutorías Destacadas</h3>
                <span className="bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ml-1">Premium</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {featuredTutorias.map((tutoria) => (
                  <motion.div
                    key={`feat-tut-${tutoria.id_tutoria}`}
                    layout
                    variants={cardVariants}
                    whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(245, 158, 11, 0.15)" }}
                    className="bg-white rounded-2xl border-2 border-amber-300 overflow-hidden transition-all duration-200 group flex flex-col p-5 justify-between shadow-[0_4px_20px_rgba(245,158,11,0.05)] relative"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#534AB7] bg-indigo-50 px-2.5 py-1 rounded-lg">
                          {tutoria.asignatura}
                        </span>
                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 fill-white text-white" />
                          Destacada
                        </span>
                      </div>

                      <Link href={`/tutorias/${tutoria.id_tutoria}`} className="block">
                        <h3 className="text-[15px] font-bold text-slate-800 leading-snug group-hover:text-[#534AB7] transition-colors line-clamp-2">
                          {tutoria.titulo}
                        </h3>
                      </Link>

                      <p className="text-[12px] text-slate-500 line-clamp-3 leading-relaxed">
                        {tutoria.descripcion || "Sin descripción adicional."}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Costo por hora</p>
                        <p className="text-xl font-black text-slate-800 tracking-tight">
                          <span className="text-xs font-semibold text-slate-400 mr-0.5">$</span>
                          {new Intl.NumberFormat("es-CO").format(tutoria.precio || 0)}
                        </p>
                      </div>

                      <Link 
                        href={`/tutorias/${tutoria.id_tutoria}`}
                        className="px-3.5 py-2 bg-gradient-to-r from-[#6055D0] to-[#534AB7] hover:from-[#5048C0] hover:to-[#4339a8] text-white text-[11px] font-bold rounded-xl border border-transparent transition-all shadow-sm"
                      >
                        Ver Tutoría
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="border-b border-slate-200/60 mt-10 mb-8" />
            </div>
          )}

          {/* Grid de Productos o Tutorías */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#534AB7] mb-4" />
                  <p className="text-slate-500 font-medium">Cargando contenido...</p>
                </div>
              ) : isSearching ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-[#534AB7] mb-3" />
                  <p className="text-[13px] text-slate-400 font-medium">Buscando...</p>
                </div>
              ) : activeFeedTab === 'productos' ? (
                regularProducts.map((producto) => {
                  const isLiked = likedItems[producto.id_publicacion] || false;
                  
                  return (
                    <motion.div
                      key={`pub-${producto.id_publicacion}`}
                      layout
                      variants={cardVariants}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-200 group flex flex-col"
                    >
                    {/* Imagen del Producto (Aspect Ratio 4/3) */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      <img 
                        src={producto.imagen || "https://images.unsplash.com/photo-1555421689-d68471e189f2?q=80&w=600&auto=format&fit=crop"} 
                        alt={producto.titulo} 
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          producto.estado === "vendido" ? "grayscale opacity-60" : "group-hover:scale-105"
                        }`}
                      />
                      
                      {/* Badge de Estado Absoluto */}
                      <div className="absolute top-3 left-3">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={producto.estado}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm border block ${
                              producto.estado === "disponible" ? "bg-white/90 backdrop-blur-sm text-emerald-600 border-emerald-100" :
                              producto.estado === "reservado" ? "bg-white/90 backdrop-blur-sm text-amber-600 border-amber-100" :
                              "bg-slate-800/90 backdrop-blur-sm text-white border-transparent"
                            }`}
                          >
                            {producto.estado}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                      
                      {/* Botón Favorito Flotante */}
                      <motion.button 
                        onClick={(e) => toggleLike(producto.id_publicacion, e)}
                        whileTap={{ scale: 1.4 }}
                        animate={{ scale: isLiked ? [1, 1.3, 1] : 1 }}
                        transition={{ duration: 0.35, type: "tween", ease: "backOut" }}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-white transition-colors shadow-sm"
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                      </motion.button>
                    </div>

                    {/* Información del Producto */}
                    <div className="p-5 flex-1 flex flex-col">
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-[#534AB7] uppercase tracking-wider bg-[#F8F7FF] px-2 py-0.5 rounded-sm">
                          {producto.categoria || "Varios"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(producto.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-[15px] font-bold text-slate-800 leading-snug line-clamp-2 mb-3 group-hover:text-[#534AB7] transition-colors">
                        {producto.titulo}
                      </h3>
                      
                      <div className="mt-auto">

                        <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between">
                          {/* Precio Estelar con separador sutil */}
                          <p className="text-xl font-black text-slate-800 tracking-tight">
                            <span className="text-sm font-semibold text-slate-400 mr-1">$</span>
                            {new Intl.NumberFormat("es-CO").format(producto.precio || 0)}
                          </p>
                          <Link
                            href={`/publicaciones/${producto.id_publicacion}`}
                            className="px-3.5 py-2 bg-gradient-to-r from-[#6055D0] to-[#534AB7] hover:from-[#5048C0] hover:to-[#4339a8] text-white text-[11px] font-bold rounded-lg border border-transparent transition-all shadow-sm"
                          >
                            Ver Detalle
                          </Link>
                        </div>

                        {/* Footer de la Card: Vendedor y Ubicación */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6055D0] to-[#534AB7] flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm">
                              {producto.perfil?.nombres?.charAt(0) || "U"}
                            </div>
                            <span className="text-[12px] font-medium text-slate-600">{producto.perfil?.nombres} {producto.perfil?.apellidos}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium truncate max-w-[80px]">{producto.ubicacion || "Campus"}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                );
              })
            ) : (
              regularTutorias.map((tutoria) => (
                <motion.div
                  key={`tut-${tutoria.id_tutoria}`}
                  layout
                  variants={cardVariants}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-200 group flex flex-col p-5 justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#534AB7] bg-indigo-50 px-2.5 py-1 rounded-lg">
                        {tutoria.asignatura}
                      </span>
                      {tutoria.nivel && (
                        <span className="text-[11px] text-slate-400 font-semibold truncate max-w-[120px]">
                          {tutoria.nivel}
                        </span>
                      )}
                    </div>

                    <Link href={`/tutorias/${tutoria.id_tutoria}`} className="block">
                      <h3 className="text-[15px] font-bold text-slate-800 leading-snug group-hover:text-[#534AB7] transition-colors line-clamp-2">
                        {tutoria.titulo}
                      </h3>
                    </Link>

                    <p className="text-[12px] text-slate-500 line-clamp-3 leading-relaxed">
                      {tutoria.descripcion || "Sin descripción adicional."}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Costo por hora</p>
                      <p className="text-xl font-black text-slate-800 tracking-tight">
                        <span className="text-xs font-semibold text-slate-400 mr-0.5">$</span>
                        {new Intl.NumberFormat("es-CO").format(tutoria.precio || 0)}
                      </p>
                    </div>

                    <Link 
                      href={`/tutorias/${tutoria.id_tutoria}`}
                      className="px-3.5 py-2 bg-slate-50 hover:bg-[#F8F7FF] text-[#534AB7] text-[11px] font-bold rounded-xl border border-slate-150 transition-all"
                    >
                      Ver Tutoría
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

          {!loading && !isSearching && hasNoItems && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              {searchQuery.trim() ? (
                <>
                  <h3 className="text-[16px] font-black text-slate-700">
                    Sin resultados para &ldquo;{searchQuery}&rdquo;
                  </h3>
                  <p className="text-[13px] text-slate-500 mt-1 max-w-sm">
                    Intenta con otras palabras clave o revisa los filtros.
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Limpiar búsqueda
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-[16px] font-black text-slate-700">
                    {activeFeedTab === 'productos' ? 'No hay publicaciones disponibles' : 'No hay tutorías disponibles'}
                  </h3>
                  <p className="text-[13px] text-slate-500 mt-1 max-w-sm">
                    {activeFeedTab === 'productos' 
                      ? 'Aún no hay productos en este rango de precio o categoría.' 
                      : 'Aún no hay tutorías disponibles en este rango de precio.'}
                  </p>
                </>
              )}
            </motion.div>
          )}

        </div>
      </main>

    </div>
  );
}
