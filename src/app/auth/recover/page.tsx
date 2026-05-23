"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { createClient } from "@/lib/supabase/client";

export default function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    // Se muestra estado de éxito siempre para prevenir fuga de enumeración de emails
    setSuccess(true);
    setLoading(false);
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
        }

        .recover-wrapper {
          position: relative;
          width: 100%;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          z-index: 10;
        }

        .auth-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 950px;
          min-height: 500px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1fr;
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
          border-radius: 50%;
          z-index: 0;
        }

        .forms-container {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem;
          grid-column: 2 / 3;
        }

        .panel-container {
          position: relative;
          z-index: 5;
          grid-column: 1 / 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
          color: white;
        }

        form {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          width: 100%;
        }

        .title {
          font-size: 1.8rem;
          color: #1f2937;
          margin-bottom: 25px;
          font-weight: 800;
          text-align: center;
        }

        .subtitle {
          color: #6b7280;
          font-size: 0.95rem;
          text-align: center;
          margin-bottom: 30px;
          line-height: 1.5;
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

        .input-field input {
          background: none;
          outline: none;
          border: none;
          line-height: 1;
          font-weight: 500;
          font-size: 1rem;
          color: #374151;
          width: 100%;
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
          margin: 25px 0 15px 0;
          cursor: pointer;
          transition: 0.5s;
          font-size: 0.9rem;
          letter-spacing: 1px;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(83, 74, 183, 0.3);
        }

        .btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .panel-container h3 {
          font-weight: 700;
          line-height: 1.2;
          font-size: 1.8rem;
          margin-bottom: 15px;
        }

        .panel-container p {
          font-size: 1rem;
          padding: 0.7rem 0;
          opacity: 0.9;
        }

        .btn-outline-white {
          margin-top: 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
          border: 2px solid #fff;
          width: auto;
          padding: 0 20px;
          height: 45px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.85rem;
          color: white;
          cursor: pointer;
          transition: 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-outline-white:hover {
          background: #fff;
          color: #534AB7;
          transform: translateY(-2px);
        }

        .success-message {
          color: #059669;
          background: #d1fae5;
          padding: 1rem;
          border-radius: 12px;
          text-align: center;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 20px;
          width: 100%;
          max-width: 380px;
          border: 1px solid #34d399;
        }

        @media (max-width: 870px) {
          .auth-container {
            grid-template-columns: 1fr;
            min-height: auto;
            border-radius: 0;
          }
          .auth-container:before {
            width: 1500px;
            height: 1500px;
            transform: translateX(-50%);
            left: 30%;
            bottom: 68%;
            right: initial;
            top: initial;
          }
          .panel-container {
            padding: 3rem 1.5rem;
          }
          .forms-container {
            grid-column: 1 / 2;
            padding: 3rem 1.5rem;
          }
        }
      `}</style>

      <div className="recover-wrapper">
        <div className="auth-container">
          
          {/* Panel decorativo izquierdo */}
          <div className="panel-container">
            <h3>¿Recordaste la clave?</h3>
            <p>Tranquilo, suele pasar. Si tu memoria volvió o ya lograste acceder, puedes volver a la pantalla de entrada.</p>
            <Link href="/auth/register?mode=login">
              <button className="btn-outline-white">
                <ArrowLeft size={18} />
                Volver a Iniciar Sesión
              </button>
            </Link>
          </div>

          {/* Formulario blanco derecho */}
          <div className="forms-container">
            <form onSubmit={handleRecover}>
              <h2 className="title">¿Olvidaste tu contraseña?</h2>
              
              {!success ? (
                <>
                  <p className="subtitle">
                    Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace mágico para restablecer tu contraseña.
                  </p>

                  <div className="input-field">
                    <i><Mail size={20} /></i>
                    <input 
                      type="email" 
                      placeholder="Correo electrónico" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Enviar Enlace"}
                  </button>
                </>
              ) : (
                <div className="success-message">
                  ¡Listo! Si hay una cuenta asociada a <b>{email}</b>, recibirás un correo con las instrucciones en breve. Revisa tu bandeja de entrada o spam.
                </div>
              )}
            </form>
          </div>

        </div>
      </div>
    </>
  );
}
