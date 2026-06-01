"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowLeft, Loader2, Sparkles, BookOpen, GraduationCap, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const NIVELES = [
  "Básico (Primaria)",
  "Medio (Secundaria)",
  "Preuniversitario",
  "Universitario",
  "Postgrado / Avanzado",
];

export default function NuevaTutoria() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [userAuth, setUserAuth] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    titulo: "",
    asignatura: "",
    nivel: "",
    precio: "",
    descripcion: "",
  });

  // Verificar sesión al cargar
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login?redirect=/tutorias/nueva");
        return;
      }
      setUserAuth(user);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setUserProfile(profile);
    };
    checkUser();
  }, [router]);

  // Manejo de inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "descripcion" && value.length > 500) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setFormData(prev => ({ ...prev, precio: "" }));
      return;
    }
    const formatted = new Intl.NumberFormat("es-CO").format(parseInt(rawValue, 10));
    setFormData(prev => ({ ...prev, precio: formatted }));
  };

  // Cálculos de progreso
  const requiredFields = ["titulo", "asignatura", "nivel", "precio", "descripcion"];
  const requiredFilledCount = useMemo(() => {
    return requiredFields.filter(
      (field) => formData[field as keyof typeof formData].toString().trim().length > 0
    ).length;
  }, [formData]);

  const progressPercentage = Math.round((requiredFilledCount / requiredFields.length) * 100);
  const isReadyToSubmit = requiredFilledCount === requiredFields.length;
  const remainingFields = requiredFields.length - requiredFilledCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadyToSubmit) return;

    setLoading(true);
    setErrorText("");

    try {
      const numericPrice = formData.precio.replace(/\./g, "");
      const payload = {
        titulo: formData.titulo,
        asignatura: formData.asignatura,
        nivel: formData.nivel,
        precio: numericPrice ? Number(numericPrice) : null,
        descripcion: formData.descripcion,
      };

      const res = await fetch("/api/tutorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al crear la tutoría");

      // Redirigir al perfil del usuario
      router.push(`/usuarios/${userAuth.id}`);
      
    } catch (err: any) {
      setErrorText(err.message);
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#F8F9FB] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center justify-center"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#534AB7]/5 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-3xl" />

      <div className="w-full max-w-[800px] z-10">
        
        {/* Botón de regreso */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-[#534AB7] transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center group-hover:border-[#534AB7]/30 group-hover:bg-[#F8F7FF] transition-all shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-[14px] font-semibold">Volver</span>
          </button>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm overflow-hidden border border-slate-200">
          <form onSubmit={handleSubmit} className="px-10 py-10 space-y-9">
            
            {/* Encabezado */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6055D0] to-[#534AB7] flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Publicar una Tutoría</h1>
                  <p className="text-[15px] text-slate-500 mt-1">Comparte tus conocimientos y apoya a otros estudiantes de la comunidad.</p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="pt-2">
                <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                  <span>Progreso de la publicación</span>
                  <span className={progressPercentage === 100 ? "text-emerald-500" : "text-[#534AB7]"}>{progressPercentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`h-full rounded-full ${progressPercentage === 100 ? 'bg-emerald-500' : 'bg-[#534AB7]'}`}
                  />
                </div>
              </div>
            </div>

            {/* Alerta de Error */}
            <AnimatePresence>
              {errorText && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 shadow-sm">
                    {errorText}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-8">
              
              {/* Título de la tutoría */}
              <div className="space-y-2">
                <Label htmlFor="titulo" className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Título de la tutoría <span className="text-[#534AB7]">*</span></Label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <Input 
                    id="titulo" name="titulo"
                    placeholder="Ej: Asesoría de Álgebra Lineal y Matrices" 
                    value={formData.titulo} onChange={handleChange}
                    className="h-12 pl-12 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#534AB7]/20 focus-visible:border-[#534AB7] transition-all text-[15px] text-slate-800 placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              </div>

              {/* Asignatura y Nivel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Asignatura */}
                <div className="space-y-2">
                  <Label htmlFor="asignatura" className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Asignatura <span className="text-[#534AB7]">*</span></Label>
                  <Input 
                    id="asignatura" name="asignatura"
                    placeholder="Ej: Álgebra Lineal, Cálculo, Física" 
                    value={formData.asignatura} onChange={handleChange}
                    className="h-12 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#534AB7]/20 focus-visible:border-[#534AB7] transition-all text-[15px] text-slate-800 placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                {/* Nivel */}
                <div className="space-y-2">
                  <Label htmlFor="nivel" className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Nivel Académico <span className="text-[#534AB7]">*</span></Label>
                  <select 
                    id="nivel" name="nivel"
                    value={formData.nivel} onChange={handleChange}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-[15px] text-slate-800 font-medium focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all appearance-none"
                  >
                    <option value="">Selecciona el nivel...</option>
                    {NIVELES.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Precio */}
              <div className="space-y-2">
                <Label htmlFor="precio" className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Precio por Hora (COP) <span className="text-[#534AB7]">*</span></Label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 text-sm font-semibold pointer-events-none">$</span>
                  <Input 
                    id="precio" name="precio" type="text"
                    placeholder="0" 
                    value={formData.precio} onChange={handlePriceChange}
                    className="h-12 pl-8 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#534AB7]/20 focus-visible:border-[#534AB7] transition-all text-[15px] text-slate-800 placeholder:text-slate-400 font-medium shadow-sm"
                  />
                  <span className="absolute right-4 text-slate-400 text-xs font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> / hora
                  </span>
                </div>
              </div>

              {/* Descripción Textarea */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="descripcion" className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Descripción y Temas a Tratar <span className="text-[#534AB7]">*</span></Label>
                  <span className={`text-[10px] font-medium ${formData.descripcion.length >= 500 ? 'text-red-500' : 'text-slate-400'}`}>
                    {formData.descripcion.length} / 500
                  </span>
                </div>
                <Textarea 
                  id="descripcion" name="descripcion"
                  placeholder="Describe los temas que dominas, tu metodología, o requisitos previos..." 
                  value={formData.descripcion} onChange={handleChange}
                  className="min-h-[140px] rounded-xl border-slate-200 bg-white p-4 focus-visible:ring-2 focus-visible:ring-[#534AB7]/20 focus-visible:border-[#534AB7] resize-none transition-all text-[15px] text-slate-800 placeholder:text-slate-400 leading-relaxed shadow-sm block w-full"
                />
              </div>

            </div>

            {/* Botón de Envío */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left w-full sm:w-auto h-6 flex items-center">
                {!isReadyToSubmit ? (
                  <p className="text-[12px] text-slate-500 font-medium flex items-center gap-1">
                    Faltan 
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={remainingFields}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="font-bold text-[#534AB7] inline-block"
                      >
                        {remainingFields}
                      </motion.span>
                    </AnimatePresence> 
                    campos obligatorios
                  </p>
                ) : (
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="text-[12px] text-emerald-600 font-medium flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Listo para publicar
                  </motion.p>
                )}
              </div>

              <motion.button 
                type="submit" 
                disabled={loading || !isReadyToSubmit}
                animate={{ 
                  opacity: isReadyToSubmit && !loading ? 1 : 0.4,
                  scale: isReadyToSubmit && !loading ? 1 : 0.98
                }}
                whileHover={isReadyToSubmit && !loading ? { scale: 1.02 } : {}}
                whileTap={isReadyToSubmit && !loading ? { scale: 0.97 } : {}}
                transition={{ duration: 0.2 }}
                className={`w-full sm:w-auto h-12 rounded-xl px-10 font-bold tracking-wide transition-colors duration-300 border-0 flex items-center justify-center gap-2 ${
                  isReadyToSubmit 
                    ? "bg-gradient-to-r from-[#6055D0] to-[#534AB7] text-white cursor-pointer shadow-md" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publicando tutoría...
                  </>
                ) : (
                  "Crear Tutoría"
                )}
              </motion.button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
