"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { User, Mail, Lock, CreditCard } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { createClient } from "@/lib/supabase/client";

export default function AuthSwitch() {
  // Render modes
  const [isSignUp, setIsSignUp] = useState(true);

  // Formularios de Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Formularios de Registro
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  useEffect(() => {
    // Interceptar parámetros por URL para cargar estado log in
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("mode") === "login") {
        setIsSignUp(false);
      }
    }
  }, []);

  useEffect(() => {
    const container = document.querySelector(".auth-container");
    if (!container) return;
    if (isSignUp) container.classList.add("sign-up-mode");
    else container.classList.remove("sign-up-mode");
  }, [isSignUp]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");
      
      window.location.href = "/";
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    try {
      const parts = nombreCompleto.trim().split(" ");
      const nombres = parts[0] || "";
      const apellidos = parts.slice(1).join(" ") || "N/A"; // Backend requiere apellidos

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          nombres,
          apellidos,
          tipo_documento: docType,
          documento_identidad: docNumber
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrarse");
      
      setIsSignUp(false);
      setLoginEmail(regEmail); // Pre-fill para el login
      alert("Registro exitoso. Ya puedes iniciar sesión.");
    } catch (err: any) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };


  return (
    <>
      {/* ── FONDO INTERACTIVO DE PARTÍCULAS ── */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-slate-50">
        <Particles
          className="absolute inset-0"
          quantity={150}
          ease={80}
          color="#534AB7"
          refresh
        />
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .auth-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 950px;
          min-height: 660px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .forms-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .signin-signup {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          left: 75%;
          width: 50%;
          transition: 1s 0.7s ease-in-out;
          display: grid;
          grid-template-columns: 1fr;
          z-index: 5;
        }

        form {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 5rem;
          transition: all 0.2s 0.7s;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
        }

        form.sign-up-form {
          opacity: 0;
          z-index: 1;
        }

        form.sign-in-form {
          z-index: 2;
        }

        .title {
          font-size: 2.2rem;
          color: #333;
          margin-bottom: 20px;
          font-weight: 800;
        }

        .input-field {
          max-width: 380px;
          width: 100%;
          background-color: #f3f4f6;
          margin: 6px 0;
          height: 48px;
          border-radius: 12px;
          display: grid;
          grid-template-columns: 15% 85%;
          padding: 0 0.4rem;
          position: relative;
          transition: 0.3s;
          border: 1px solid transparent;
        }

        .input-field:focus-within {
          background-color: #ffffff;
          border-color: #534AB7;
          box-shadow: 0 0 0 4px rgba(83, 74, 183, 0.1);
        }

        .input-field i {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          transition: 0.5s;
        }

        .input-field:focus-within i {
          color: #534AB7;
        }

        .input-field input, .input-field select {
          background: none;
          outline: none;
          border: none;
          line-height: 1;
          font-weight: 500;
          font-size: 1rem;
          color: #374151;
          width: 100%;
        }

        .input-field select {
          cursor: pointer;
          color: #374151;
        }

        .input-field select.placeholder-select {
          color: #9ca3af;
          font-weight: 400;
        }

        .input-field input::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }

        .btn {
          width: 160px;
          background: linear-gradient(to right, #6055D0, #534AB7);
          border: none;
          outline: none;
          height: 50px;
          border-radius: 12px;
          color: #fff;
          text-transform: uppercase;
          font-weight: 700;
          margin: 15px 0;
          cursor: pointer;
          transition: 0.5s;
          font-size: 0.9rem;
          letter-spacing: 1px;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(83, 74, 183, 0.3);
        }

        .btn.transparent {
          margin: 10px 0 0 0;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
          border: 2px solid #fff;
          width: 140px;
          height: 45px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .btn.transparent:hover {
          background: #fff;
          color: #534AB7;
          transform: translateY(-2px);
        }

        .panels-container {
          position: absolute;
          height: 100%;
          width: 100%;
          top: 0;
          left: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        .panel {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-around;
          text-align: center;
          z-index: 6;
        }

        .left-panel {
          pointer-events: all;
          padding: 3rem 17% 2rem 12%;
        }

        .right-panel {
          pointer-events: none;
          padding: 3rem 12% 2rem 17%;
        }

        .panel .content {
          color: #fff;
          transition: transform 0.9s ease-in-out;
          transition-delay: 0.6s;
        }

        .panel h3 {
          font-weight: 700;
          line-height: 1;
          font-size: 1.8rem;
          margin-bottom: 15px;
        }

        .panel p {
          font-size: 1rem;
          padding: 0.7rem 0;
          opacity: 0.9;
        }

        .right-panel .content {
          transform: translateX(800px);
        }

        /* ----- CIRCULO GIGANTE DE FONDO ----- */
        .auth-container.sign-up-mode:before {
          transform: translate(100%, -50%);
          right: 52%;
        }

        .auth-container.sign-up-mode .left-panel .content {
          transform: translateX(-800px);
        }

        .auth-container.sign-up-mode .signin-signup {
          left: 25%;
        }

        .auth-container.sign-up-mode form.sign-up-form {
          opacity: 1;
          z-index: 2;
        }

        .auth-container.sign-up-mode form.sign-in-form {
          opacity: 0;
          z-index: 1;
        }

        .auth-container.sign-up-mode .right-panel .content {
          transform: translateX(0%);
        }

        .auth-container.sign-up-mode .left-panel {
          pointer-events: none;
        }

        .auth-container.sign-up-mode .right-panel {
          pointer-events: all;
        }

        .auth-container:before {
          content: "";
          position: absolute;
          height: 2000px;
          width: 2000px;
          top: -10%;
          right: 48%;
          transform: translateY(-50%);
          background: linear-gradient(-45deg, #291D73 0%, #534AB7 100%);
          transition: 1.8s ease-in-out;
          border-radius: 50%;
          z-index: 6;
        }

        .social-text {
          padding: 1rem 0;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .social-media {
          display: flex;
          justify-content: center;
          gap: 15px;
        }

        .social-icon {
          height: 50px;
          width: 50px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          color: #4b5563;
          transition: 0.3s;
          cursor: pointer;
          filter: grayscale(100%) opacity(0.8);
        }

        .social-icon:hover {
          border-color: #534AB7;
          background: #f8f9fa;
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          filter: grayscale(0%) opacity(1);
        }

        .social-text {
          padding: 1rem 0;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .social-media {
          display: flex;
          justify-content: center;
          gap: 15px;
        }

        .social-icon {
          height: 46px;
          width: 46px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid #e5e7eb;
          border-radius: 50%;
          color: #4b5563;
          transition: 0.3s;
          cursor: pointer;
        }

        .social-icon:hover {
          border-color: #534AB7;
          background: #f8f9fa;
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 870px) {
          .auth-container {
            min-height: 800px;
            height: 100vh;
            border-radius: 0;
          }
          .signin-signup {
            width: 100%;
            top: 95%;
            transform: translate(-50%, -100%);
            transition: 1s 0.8s ease-in-out;
          }
          .signin-signup,
          .auth-container.sign-up-mode .signin-signup {
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
          .panels-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 2fr 1fr;
          }
          .panel {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            padding: 2.5rem 8%;
            grid-column: 1 / 2;
          }
          .right-panel {
            grid-row: 3 / 4;
          }
          .left-panel {
            grid-row: 1 / 2;
          }
          .panel .content {
            padding-right: 15%;
            transition: transform 0.9s ease-in-out;
            transition-delay: 0.8s;
          }
          .panel h3 {
            font-size: 1.4rem;
          }
          .panel p {
            font-size: 0.9rem;
            padding: 0.5rem 0;
          }
          .auth-container:before {
            width: 1500px;
            height: 1500px;
            transform: translateX(-50%);
            left: 30%;
            bottom: 68%;
            right: initial;
            top: initial;
            transition: 2s ease-in-out;
          }
          .auth-container.sign-up-mode:before {
            transform: translate(-50%, 100%);
            bottom: 32%;
            right: initial;
            top: initial;
          }
          .auth-container.sign-up-mode .left-panel .content {
            transform: translateY(-300px);
          }
          .auth-container.sign-up-mode .right-panel .content {
            transform: translateY(0px);
          }
          .right-panel .content {
            transform: translateY(300px);
          }
        }

        @media (max-width: 570px) {
          form {
            padding: 0 1.5rem;
          }
          .panel .content {
            padding: 0.5rem 1rem;
          }
        }
      `}</style>

      <div className="auth-container sign-up-mode">
        <div className="forms-container">
          <div className="signin-signup">
            
            {/* ── FORMULARIO DE LOG IN ── */}
            <form className="sign-in-form" onSubmit={handleLogin}>
              <h2 className="title" style={{ marginBottom: '25px', marginTop: '40px' }}>
                Bienvenido a <span style={{ color: '#534AB7' }}>MarketVersitario</span>
              </h2>

              {loginError && <p className="error-text">{loginError}</p>}

              <div className="input-field">
                <i><Mail size={20} /></i>
                <input 
                  type="email" 
                  placeholder="Correo electrónico" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-field">
                <i><Lock size={20} /></i>
                <input 
                  type="password" 
                  placeholder="Contraseña" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <div style={{ width: '100%', maxWidth: '380px', textAlign: 'center', marginTop: '10px' }}>
                <Link href="/auth/recover" style={{ fontSize: '0.85rem', color: '#534AB7', fontWeight: 600, textDecoration: 'none' }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <button type="submit" className="btn solid" disabled={loginLoading}>
                {loginLoading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            {/* ── FORMULARIO DE REGISTRO ── */}
            <form className="sign-up-form" onSubmit={handleRegister}>
              <h2 className="title" style={{ marginBottom: '25px', marginTop: '40px' }}>Crear cuenta</h2>
              
              {regError && <p className="error-text">{regError}</p>}

              <div className="input-field">
                <i><User size={20} /></i>
                <input 
                  type="text" 
                  placeholder="Nombre completo" 
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  required
                />
              </div>

              <div className="input-field">
                <i><CreditCard size={20} /></i>
                <select 
                  value={docType} 
                  onChange={(e) => setDocType(e.target.value)}
                  className={docType === "" ? "placeholder-select" : ""}
                  required
                >
                  <option value="" disabled>Tipo de documento</option>
                  <option value="CC">Cédula de Ciudadanía (CC)</option>
                  <option value="TI">Tarjeta de Identidad (TI)</option>
                  <option value="CE">Cédula de Extranjería (CE)</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="NIT">NIT</option>
                </select>
              </div>

              <div className="input-field">
                <i><CreditCard size={20} /></i>
                <input 
                  type="text" 
                  placeholder="Número de documento" 
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  required
                />
              </div>

              <div className="input-field">
                <i><Mail size={20} /></i>
                <input 
                  type="email" 
                  placeholder="Correo electrónico" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="input-field">
                <i><Lock size={20} /></i>
                <input 
                  type="password" 
                  placeholder="Contraseña" 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn" style={{ margin: '10px 0' }} disabled={regLoading}>
                {regLoading ? "Registrando..." : "Registrarse"}
              </button>
            </form>

          </div>
        </div>

        <div className="panels-container">
          <div className="panel left-panel">
            <div className="content">
              <h3>¿Nuevo por aquí?</h3>
              <p>Únete a la mejor plataforma de Marketplace para tu comunidad universitaria en segundos.</p>
              <button className="btn transparent" onClick={() => setIsSignUp(true)}>
                Crear Cuenta
              </button>
            </div>
          </div>

          <div className="panel right-panel">
            <div className="content">
              <h3>¿Ya eres uno de nuestros estudiantes?</h3>
              <p>Inicia sesión y sigue descubriendo productos increíbles de otros estudiantes.</p>
              <button className="btn transparent" onClick={() => setIsSignUp(false)}>
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


