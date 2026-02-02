'use client';

import { useEffect, useRef } from 'react';

export default function BackgroundEffects() {
  const cursorGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursorGlow = cursorGlowRef.current;
    if (!cursorGlow) return;

    let mouseX = 0;
    let mouseY = 0;
    let glowX = 0;
    let glowY = 0;
    let animationId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorGlow.style.opacity = '0.15';
    };

    const handleMouseLeave = () => {
      cursorGlow.style.opacity = '0';
    };

    const animateGlow = () => {
      glowX += (mouseX - glowX) * 0.1;
      glowY += (mouseY - glowY) * 0.1;
      cursorGlow.style.left = `${glowX}px`;
      cursorGlow.style.top = `${glowY}px`;
      animationId = requestAnimationFrame(animateGlow);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    animationId = requestAnimationFrame(animateGlow);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      {/* Cursor glow */}
      <div ref={cursorGlowRef} className="cursor-glow" />

      {/* Background grid */}
      <div className="bg-grid" />

      {/* Screen glow effects */}
      <div className="screen-glow" />
      <div className="screen-glow-bottom" />

      {/* Floating particles */}
      <div className="particle" style={{ top: '20%', left: '10%', animationDelay: '0s' }} />
      <div className="particle" style={{ top: '60%', left: '85%', animationDelay: '2s' }} />
      <div className="particle particle-lg" style={{ top: '40%', left: '70%', animationDelay: '4s' }} />
      <div className="particle" style={{ top: '80%', left: '20%', animationDelay: '6s' }} />
      <div className="particle particle-sm" style={{ top: '30%', left: '90%', animationDelay: '8s' }} />
      <div className="particle" style={{ top: '70%', left: '5%', animationDelay: '10s' }} />
      <div className="particle particle-lg" style={{ top: '15%', left: '50%', animationDelay: '3s' }} />
      <div className="particle particle-sm" style={{ top: '85%', left: '60%', animationDelay: '7s' }} />
      <div className="particle particle-sm" style={{ top: '45%', left: '25%', animationDelay: '1s' }} />
      <div className="particle" style={{ top: '55%', left: '45%', animationDelay: '5s' }} />
    </>
  );
}
