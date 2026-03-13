"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/hello`)
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        html, body { height: 100%; }

        .uarc-root {
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(135deg, #1a3a8f 0%, #1565c0 30%, #0288d1 65%, #00bcd4 100%);
          font-family: 'Inter', sans-serif;
          display: grid;
          grid-template-rows: auto 1fr auto;
          position: relative;
          overflow: hidden;
          color: white;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(90px);
          opacity: 0.2;
        }
        .blob-1 { width: 650px; height: 650px; background: #90caf9; top: -200px; right: -150px; }
        .blob-2 { width: 500px; height: 500px; background: #0d47a1; bottom: -150px; left: -100px; }
        .blob-3 { width: 300px; height: 300px; background: #e0f7fa; top: 50%; left: 40%; opacity: 0.08; }

        .dot-pattern {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        nav {
          position: relative;
          z-index: 20;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 3rem;
          border-bottom: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(4px);
          background: rgba(255,255,255,0.05);
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-logo-img {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid rgba(255,255,255,0.35);
        }

        .nav-brand {
          display: flex;
          flex-direction: column;
        }

        .nav-brand-name {
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          line-height: 1;
          color: white;
        }

        .nav-brand-sub {
          font-size: 0.65rem;
          font-weight: 400;
          color: rgba(255,255,255,0.65);
          letter-spacing: 0.04em;
          margin-top: 2px;
        }

        .btn-nav-login {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.5rem;
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.4);
          color: white;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.18s;
          cursor: pointer;
          backdrop-filter: blur(4px);
        }

        .btn-nav-login:hover {
          background: rgba(255,255,255,0.25);
        }

        .hero {
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 3rem;
          padding: 4rem 3rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          animation: fadeLeft 0.6s ease forwards;
        }

        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.75);
          font-weight: 500;
        }

        .eyebrow-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #7ee8fa;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }

        .hero-title {
          font-size: clamp(2.4rem, 4.5vw, 3.8rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.02em;
          color: white;
        }

        .hero-title span {
          display: block;
          color: rgba(255,255,255,0.55);
          font-weight: 300;
          font-size: 0.6em;
          letter-spacing: 0.01em;
          margin-bottom: 0.2rem;
        }

        .hero-desc {
          font-size: 1rem;
          font-weight: 300;
          line-height: 1.75;
          color: rgba(255,255,255,0.7);
          max-width: 440px;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.9rem 2.2rem;
          background: white;
          color: #1565c0;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          border-radius: 10px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.25);
        }

        .btn-primary svg {
          width: 16px; height: 16px;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.8);
          backdrop-filter: blur(4px);
        }

        .status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse 2s ease-in-out infinite;
        }

        .hero-right {
          animation: fadeRight 0.6s ease forwards 0.2s;
          opacity: 0;
        }

        @keyframes fadeRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .features-card {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          padding: 2rem;
          backdrop-filter: blur(12px);
        }

        .features-card-title {
          font-size: 0.7rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          margin-bottom: 1.4rem;
          font-weight: 500;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .feature-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.2rem;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          transition: background 0.15s;
        }

        .feature-row:hover {
          background: rgba(255,255,255,0.14);
        }

        .feat-icon {
          width: 42px; height: 42px;
          border-radius: 10px;
          background: rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .feat-icon svg {
          width: 18px; height: 18px;
          stroke: white;
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .feat-body { flex: 1; }

        .feat-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: white;
          margin-bottom: 0.15rem;
        }

        .feat-desc {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.55);
          font-weight: 400;
        }

        .feat-arrow {
          color: rgba(255,255,255,0.35);
          font-size: 1rem;
        }

        .stats-bar {
          position: relative;
          z-index: 20;
          display: flex;
          align-items: stretch;
          border-top: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.5s ease forwards 0.6s;
          opacity: 0;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .stat {
          flex: 1;
          padding: 1.2rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
          border-right: 1px solid rgba(255,255,255,0.1);
        }

        .stat:last-child { border-right: none; }

        .stat-num {
          font-size: 1.6rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.62rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          font-weight: 400;
        }

        @media (max-width: 768px) {
          nav { padding: 1rem 1.5rem; }
          .nav-brand-sub { display: none; }
          .hero {
            grid-template-columns: 1fr;
            padding: 2.5rem 1.5rem;
            gap: 2.5rem;
          }
          .stats-bar { flex-wrap: wrap; }
          .stat { flex: 1 1 50%; border-bottom: 1px solid rgba(255,255,255,0.1); }
        }
      `}</style>

      <div className="uarc-root">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="dot-pattern" />

        <nav>
          <div className="nav-left">
            <div className="nav-logo-img">
              <Image
                src="/UarcLogo.png"
                alt="UARC"
                width={44}
                height={44}
                style={{ objectFit: "contain" }}
              />
            </div>
            <div className="nav-brand">
              <span className="nav-brand-name">UARC</span>
              <span className="nav-brand-sub">Unión de Árbitros de Río Cuarto</span>
            </div>
          </div>
          <Link href="/login" className="btn-nav-login">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Iniciar Sesión
          </Link>
        </nav>

        <div className="hero">
          <div className="hero-left">
            <div className="eyebrow">
              <div className="eyebrow-dot" />
              Sistema de gestión institucional
            </div>

            <h1 className="hero-title">
              <span>Gestión Integral</span>
              UARC
            </h1>

            <p className="hero-desc">
              La plataforma oficial para árbitros asociados a la Unión de Árbitros de Río Cuarto.
              Gestioná cuotas, Cobranzas y el historial de ingresos e egresos.
            </p>

            <div className="hero-actions">
              <Link href="/login" className="btn-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Acceder al sistema
              </Link>
              {message && (
                <div className="status-pill">
                  <div className="status-dot" />
                  {message}
                </div>
              )}
            </div>
          </div>

          <div className="hero-right">
            <div className="features-card">
              <p className="features-card-title">¿Qué podés gestionar?</p>
              <div className="feature-list">
                <div className="feature-row">
                  <div className="feat-icon">
                    <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                  </div>
                  <div className="feat-body">
                    <div className="feat-name">Tesorería</div>
                    <div className="feat-desc">Cuotas societarias, pagos y estado de cuenta</div>
                  </div>
                  <span className="feat-arrow">›</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-bar">
          <div className="stat">
            <span className="stat-num">UARC</span>
            <span className="stat-label">Afiliada</span>
          </div>
          <div className="stat">
            <span className="stat-num">+50</span>
            <span className="stat-label">Árbitros activos</span>
          </div>
          <div className="stat">
            <span className="stat-num">Rio cuarto</span>
            <span className="stat-label">Sede Rio cuarto</span>
          </div>
          <div className="stat">
            <span className="stat-num">2026</span>
            <span className="stat-label">Temporada</span>
          </div>
        </div>
      </div>
    </>
  );
}