"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Bell, LayoutDashboard, Package, 
  Settings, LogOut, ChevronDown, MapPin, 
  Heart, Filter, Sparkles, Check, Loader2
} from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


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
      }

      try {
        const [resPubs, resCats] = await Promise.all([
          fetch('/api/publicaciones?estado=activo'),
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



  // Búsqueda debounced: cuando el query cambia, espera 400ms y consulta el servidor
  React.useEffect(() => {
    const trimmed = searchQuery.trim();

    // Si está vacío, restaurar carga completa
    if (!trimmed) {
      const reload = async () => {
        setIsSearching(true);
        try {
          const res = await fetch('/api/publicaciones?estado=activo');
          if (res.ok) {
            const json = await res.json();
            setProductos(json.data || []);
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
        const params = new URLSearchParams({ estado: 'activo', q: trimmed });
        const res = await fetch(`/api/publicaciones?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setProductos(json.data || []);
        }
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);



  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setLikedItems(prev => ({ ...prev, [id]: !prev[id] }));
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

  const isAdmin = userProfile?.rol === 'admin' || userProfile?.rol === 'superadmin';

  return (
    <div 
      className="flex h-screen bg-[#F8F9FB] overflow-hidden"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      
      {/* 1. SIDEBAR IZQUIERDA */}
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

          {/* Menú Principal */}
          <div className="px-5 py-6">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Navegación</p>
            <nav className="space-y-1.5">
              {userProfile && !isAdmin && (
                <Link href="/" className="flex items-center gap-3 px-3 py-2.5 bg-[#F8F7FF] text-[#534AB7] rounded-xl font-semibold text-[14px] transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Explorar Feed</span>
                </Link>
              )}
              {userProfile && (
                <Link href="/publicaciones" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-[14px] transition-colors ${isAdmin ? 'bg-[#F8F7FF] text-[#534AB7]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                  <Package className="w-4 h-4" />
                  <span>{isAdmin ? 'Publicaciones' : 'Mis Publicaciones'}</span>
                </Link>
              )}
              {userProfile && isAdmin && (
                <Link href="/usuarios" className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl font-medium text-[14px] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
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

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar: Buscador y Perfil */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          {/* Barra de Búsqueda Prominente */}
          <div className="flex-1 max-w-2xl relative">
            {isSearching ? (
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#534AB7] animate-spin" />
            ) : (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            )}
            <input 
              type="text" 
              placeholder="Buscar calculadoras, libros, tecnología..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-10 bg-slate-100/70 border-transparent rounded-full focus:bg-white focus:border-[#534AB7]/30 focus:ring-2 focus:ring-[#534AB7]/10 transition-all text-[14px] text-slate-700 outline-none placeholder:text-slate-400"
            />
            {/* Botón limpiar búsqueda */}
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

          {/* User Widgets (Right) */}
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

        {/* Scrollable Feed */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-thin">
          
          {/* Cabecera y Filtros */}
          <div className="mb-8">
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Descubre productos</h2>
                <p className="text-[14px] text-slate-500 mt-1">Encuentra lo que necesitas dentro del campus universitario.</p>
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

            {/* Filtro de Categoría (Dropdown Consistente) */}
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
          </div>

          {/* Grid de Productos */}
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
                  <p className="text-slate-500 font-medium">Cargando publicaciones...</p>
                </div>
              ) : isSearching ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-[#534AB7] mb-3" />
                  <p className="text-[13px] text-slate-400 font-medium">Buscando...</p>
                </div>
              ) : filteredProducts.map((producto) => {
                const isLiked = likedItems[producto.id_publicacion] || false;
                
                return (
                  <motion.div
                    key={producto.id_publicacion}
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
                        transition={{ duration: 0.3, type: "spring" }}
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
                        
                        <div className="border-t border-slate-100 pt-3 mt-3">
                          {/* Precio Estelar con separador sutil */}
                          <p className="text-xl font-black text-slate-800 tracking-tight">
                            <span className="text-sm font-semibold text-slate-400 mr-1">$</span>
                            {new Intl.NumberFormat("es-CO").format(producto.precio || 0)}
                          </p>
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
            </AnimatePresence>
          </motion.div>

          {!loading && !isSearching && filteredProducts.length === 0 && (
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
                    Intenta con otras palabras clave o revisa los filtros de precio.
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
                  <h3 className="text-[16px] font-black text-slate-700">No hay publicaciones disponibles</h3>
                  <p className="text-[13px] text-slate-500 mt-1 max-w-sm">
                    Aún no hay productos en este rango de precio o categoría.
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
