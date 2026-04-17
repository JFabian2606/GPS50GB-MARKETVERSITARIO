"use client";
import React from "react";

export const LoaderOne = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Definimos los keyframes localmente para no depender del JS de React */}
      <style>{`
        @keyframes aceternity-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .dot {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background-color: #534AB7;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          animation: aceternity-bounce 1s infinite ease-in-out;
        }
        .dot-1 { animation-delay: 0s; }
        .dot-2 { animation-delay: 0.2s; }
        .dot-3 { animation-delay: 0.4s; }
      `}</style>

      <div className="flex items-center gap-2">
        <div className="dot dot-1" />
        <div className="dot dot-2" />
        <div className="dot dot-3" />
      </div>
      <span className="text-sm font-medium tracking-[0.2em] text-[#534AB7]/70">
        CARGANDO
      </span>
    </div>
  );
};
