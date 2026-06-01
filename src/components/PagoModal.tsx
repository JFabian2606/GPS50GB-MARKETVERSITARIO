"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CreditCard, Smartphone, Building2, Lock,
  CheckCircle2, XCircle, Loader2, Zap, Shield, Star
} from "lucide-react";

interface PagoModalProps {
  open: boolean;
  onClose: () => void;
  tipoItem: "publicacion" | "tutoria";
  idItem: number;
  tituloItem: string;
  onSuccess?: (referencia: string, destacadaHasta: string) => void;
}

type MetodoPago = "tarjeta" | "nequi" | "pse";
type EstadoPago = "idle" | "procesando" | "exito" | "error";

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 2) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

export default function PagoModal({
  open,
  onClose,
  tipoItem,
  idItem,
  tituloItem,
  onSuccess,
}: PagoModalProps) {
  const [metodo, setMetodo] = useState<MetodoPago>("tarjeta");
  const [estado, setEstado] = useState<EstadoPago>("idle");
  const [referencia, setReferencia] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [destacadaHasta, setDestacadaHasta] = useState("");

  // Tarjeta
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [nombreTarjeta, setNombreTarjeta] = useState("");
  const [fechaExpiracion, setFechaExpiracion] = useState("");
  const [cvv, setCvv] = useState("");

  // Nequi
  const [telefonoNequi, setTelefonoNequi] = useState("");

  // PSE
  const [banco, setBanco] = useState("");
  const [tipoCuenta, setTipoCuenta] = useState("ahorros");

  const handleClose = () => {
    if (estado === "procesando") return;
    setEstado("idle");
    setNumeroTarjeta("");
    setNombreTarjeta("");
    setFechaExpiracion("");
    setCvv("");
    setTelefonoNequi("");
    setBanco("");
    setErrorMsg("");
    onClose();
  };

  const handlePagar = async () => {
    setEstado("procesando");
    setErrorMsg("");

    const datosPago =
      metodo === "tarjeta"
        ? { numero: numeroTarjeta, nombre: nombreTarjeta, fecha: fechaExpiracion, cvv }
        : metodo === "nequi"
        ? { telefono: telefonoNequi }
        : { banco, tipoCuenta };

    try {
      // Simulamos una demora de 2-3 segundos como una pasarela real
      await new Promise((r) => setTimeout(r, 2500));

      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_item: tipoItem,
          id_item: idItem,
          metodo_pago: metodo,
          datos_pago: datosPago,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.message || json.error || "Transacción rechazada");
        setReferencia(json.referencia || "");
        setEstado("error");
        return;
      }

      setReferencia(json.referencia);
      setDestacadaHasta(json.destacada_hasta);
      setEstado("exito");
      onSuccess?.(json.referencia, json.destacada_hasta);
    } catch (err: any) {
      setErrorMsg("Error de conexión. Intenta de nuevo.");
      setEstado("error");
    }
  };

  const canSubmit = () => {
    if (metodo === "tarjeta") {
      return (
        numeroTarjeta.replace(/\s/g, "").length === 16 &&
        nombreTarjeta.trim().length > 2 &&
        fechaExpiracion.length === 5 &&
        cvv.length >= 3
      );
    }
    if (metodo === "nequi") return telefonoNequi.length === 10;
    if (metodo === "pse") return banco.trim().length > 0;
    return false;
  };

  const metodos = [
    { id: "tarjeta" as MetodoPago, label: "Tarjeta", icon: CreditCard },
    { id: "nequi" as MetodoPago, label: "Nequi", icon: Smartphone },
    { id: "pse" as MetodoPago, label: "PSE", icon: Building2 },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">

              {/* ── Estado: Procesando ── */}
              {estado === "procesando" && (
                <div className="flex flex-col items-center justify-center gap-5 p-12">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-[#534AB7]/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-[#534AB7] border-t-transparent animate-spin" />
                    <div className="absolute inset-3 rounded-full bg-[#F8F7FF] flex items-center justify-center">
                      <Lock className="w-5 h-5 text-[#534AB7]" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800 text-lg">Procesando pago...</p>
                    <p className="text-slate-500 text-sm mt-1">Por favor no cierres esta ventana</p>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-slate-400 bg-slate-50 px-4 py-2 rounded-full">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Conexión cifrada SSL/TLS 256-bit</span>
                  </div>
                </div>
              )}

              {/* ── Estado: Éxito ── */}
              {estado === "exito" && (
                <div className="flex flex-col items-center justify-center gap-5 p-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </motion.div>
                  <div className="text-center">
                    <h3 className="font-black text-xl text-slate-800">¡Pago Aprobado!</h3>
                    <p className="text-slate-500 text-sm mt-1">Tu publicación está siendo destacada</p>
                  </div>
                  <div className="w-full bg-slate-50 rounded-2xl p-4 space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Referencia</span>
                      <span className="font-mono font-bold text-slate-700">{referencia}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Monto</span>
                      <span className="font-bold text-slate-700">$10.000 COP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vigencia</span>
                      <span className="font-bold text-emerald-600">7 días</span>
                    </div>
                    {destacadaHasta && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Vence el</span>
                        <span className="font-bold text-slate-700">
                          {new Date(destacadaHasta).toLocaleDateString("es-CO", {
                            day: "2-digit", month: "long", year: "numeric"
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#6055D0] to-[#534AB7] text-white font-bold text-[14px] hover:from-[#5048C0] hover:to-[#4339a8] transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              )}

              {/* ── Estado: Error ── */}
              {estado === "error" && (
                <div className="flex flex-col items-center justify-center gap-5 p-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center"
                  >
                    <XCircle className="w-10 h-10 text-rose-500" />
                  </motion.div>
                  <div className="text-center">
                    <h3 className="font-black text-xl text-slate-800">Pago No Aprobado</h3>
                    <p className="text-slate-500 text-sm mt-1">{errorMsg}</p>
                  </div>
                  {referencia && (
                    <p className="text-[12px] text-slate-400 font-mono">Ref: {referencia}</p>
                  )}
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={handleClose}
                      className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 font-bold text-[14px] hover:bg-slate-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => setEstado("idle")}
                      className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-[#6055D0] to-[#534AB7] text-white font-bold text-[14px] hover:from-[#5048C0] hover:to-[#4339a8] transition-all"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              )}

              {/* ── Estado: Idle (Formulario) ── */}
              {estado === "idle" && (
                <>
                  {/* Header */}
                  <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md shadow-amber-500/20">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="font-black text-slate-800 text-[16px] leading-tight">Potenciar Publicación</h2>
                          <p className="text-[12px] text-slate-400">Destacada por 7 días en el feed</p>
                        </div>
                      </div>
                      <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Resumen de lo que se paga */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <div>
                          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">Destacado Premium</p>
                          <p className="text-[12px] text-slate-600 mt-0.5 truncate max-w-[180px]">{tituloItem}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[22px] font-black text-slate-800 leading-tight">$10.000</p>
                        <p className="text-[10px] text-slate-400 font-medium">COP · único pago</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-5 space-y-5">
                    {/* Selector de método */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Método de pago</p>
                      <div className="grid grid-cols-3 gap-2">
                        {metodos.map(({ id, label, icon: Icon }) => (
                          <button
                            key={id}
                            onClick={() => setMetodo(id)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-[12px] font-bold ${
                              metodo === id
                                ? "border-[#534AB7] bg-[#F8F7FF] text-[#534AB7]"
                                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${metodo === id ? "text-[#534AB7]" : "text-slate-400"}`} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Formulario Tarjeta */}
                    {metodo === "tarjeta" && (
                      <div className="space-y-3">
                        {/* Preview de tarjeta */}
                        <div className="h-28 bg-gradient-to-br from-[#534AB7] to-[#2e287a] rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -mr-10 -mt-10" />
                          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 -ml-8 -mb-8" />
                          <div className="flex justify-between items-start relative z-10">
                            <div className="flex gap-1">
                              <div className="w-7 h-5 rounded bg-amber-400/80" />
                              <div className="w-7 h-5 rounded bg-amber-600/60 -ml-2" />
                            </div>
                            <CreditCard className="w-5 h-5 text-white/60" />
                          </div>
                          <div className="relative z-10">
                            <p className="font-mono text-white/90 text-[14px] font-bold tracking-widest">
                              {numeroTarjeta || "•••• •••• •••• ••••"}
                            </p>
                            <div className="flex justify-between mt-1">
                              <p className="text-[10px] text-white/60 uppercase tracking-widest font-medium truncate max-w-[150px]">
                                {nombreTarjeta || "Nombre del titular"}
                              </p>
                              <p className="text-[10px] text-white/60 font-mono">
                                {fechaExpiracion || "MM/AA"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Número de tarjeta"
                          value={numeroTarjeta}
                          onChange={(e) => setNumeroTarjeta(formatCardNumber(e.target.value))}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400"
                        />
                        <input
                          type="text"
                          placeholder="Nombre del titular"
                          value={nombreTarjeta}
                          onChange={(e) => setNombreTarjeta(e.target.value.toUpperCase())}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all placeholder:text-slate-400"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="MM/AA"
                            value={fechaExpiracion}
                            onChange={(e) => setFechaExpiracion(formatExpiry(e.target.value))}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400"
                          />
                          <div className="relative">
                            <input
                              type="password"
                              placeholder="CVV"
                              value={cvv}
                              maxLength={4}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                              className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Shield className="w-3 h-3" />
                          Tarjeta de prueba exitosa: 4111 1111 1111 1111 · Declinada: 4000 0000 0000 0002
                        </p>
                      </div>
                    )}

                    {/* Formulario Nequi */}
                    {metodo === "nequi" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-pink-50 border border-pink-100 rounded-2xl p-4">
                          <div className="w-10 h-10 rounded-xl bg-[#e4097f] flex items-center justify-center shrink-0">
                            <Smartphone className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-[13px]">Pago con Nequi</p>
                            <p className="text-[12px] text-slate-500">Recibirás una notificación en tu app</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Número de celular Nequi</label>
                          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#534AB7] focus-within:ring-2 focus-within:ring-[#534AB7]/10 transition-all">
                            <span className="px-3 text-slate-500 text-[14px] font-medium border-r border-slate-200 h-11 flex items-center bg-slate-50">+57</span>
                            <input
                              type="tel"
                              inputMode="numeric"
                              placeholder="300 000 0000"
                              value={telefonoNequi}
                              maxLength={10}
                              onChange={(e) => setTelefonoNequi(e.target.value.replace(/\D/g, ""))}
                              className="flex-1 h-11 px-3 text-[14px] text-slate-700 outline-none bg-white placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Formulario PSE */}
                    {metodo === "pse" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-[13px]">Pago con PSE</p>
                            <p className="text-[12px] text-slate-500">Débito directo a tu cuenta bancaria</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Banco</label>
                          <select
                            value={banco}
                            onChange={(e) => setBanco(e.target.value)}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/10 transition-all bg-white"
                          >
                            <option value="">Selecciona tu banco</option>
                            <option value="bancolombia">Bancolombia</option>
                            <option value="davivienda">Davivienda</option>
                            <option value="bbva">BBVA Colombia</option>
                            <option value="bogota">Banco de Bogotá</option>
                            <option value="popular">Banco Popular</option>
                            <option value="itau">Itaú</option>
                            <option value="occidente">Banco de Occidente</option>
                            <option value="nequi_bank">Nequi (Bancolombia)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tipo de cuenta</label>
                          <div className="grid grid-cols-2 gap-2">
                            {["ahorros", "corriente"].map((tipo) => (
                              <button
                                key={tipo}
                                onClick={() => setTipoCuenta(tipo)}
                                className={`h-11 rounded-xl border-2 text-[13px] font-bold capitalize transition-all ${
                                  tipoCuenta === tipo
                                    ? "border-[#534AB7] bg-[#F8F7FF] text-[#534AB7]"
                                    : "border-slate-200 text-slate-500"
                                }`}
                              >
                                {tipo}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botón de pago */}
                    <button
                      onClick={handlePagar}
                      disabled={!canSubmit()}
                      className="w-full h-13 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-black text-[15px] transition-all shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Zap className="w-5 h-5 fill-white" />
                      Pagar $10.000 y Destacar
                    </button>

                    {/* Seguridad */}
                    <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Pago seguro</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>SSL 256-bit</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>Datos cifrados</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
