'use client';

import { useEffect, useRef, useCallback } from 'react';

export default function BackgroundEffects() {
  const cursorGlowRef = useRef<HTMLDivElement>(null);

  // Initialize card tilt effects
  const initCardTilt = useCallback(() => {
    const cards = document.querySelectorAll('.card-hover, .stat-card');

    cards.forEach((card) => {
      const element = card as HTMLElement;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
      };

      const handleMouseLeave = () => {
        element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
      };

      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseleave', handleMouseLeave);
    });
  }, []);

  // Initialize button ripple effects
  const initButtonRipple = useCallback(() => {
    const buttons = document.querySelectorAll('.btn-glow');

    buttons.forEach((btn) => {
      btn.addEventListener('click', function(e: Event) {
        const event = e as MouseEvent;
        const button = btn as HTMLElement;
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.style.cssText = `
          position: absolute;
          width: 20px;
          height: 20px;
          background: rgba(255,255,255,0.5);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          animation: ripple 0.6s ease-out;
          left: ${x}px;
          top: ${y}px;
          pointer-events: none;
        `;
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }, []);

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

    // Initialize card tilt and button ripple after a short delay
    // to ensure DOM elements are rendered
    const timer = setTimeout(() => {
      initCardTilt();
      initButtonRipple();
    }, 100);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
      clearTimeout(timer);
    };
  }, [initCardTilt, initButtonRipple]);

  return (
    <>
      {/* Cursor glow */}
      <div ref={cursorGlowRef} className="cursor-glow" />

      {/* Background grid */}
      <div className="bg-grid" />

      {/* Screen glow effects */}
      <div className="screen-glow" />
      <div className="screen-glow-bottom" />
      <div className="ambient-glow ambient-glow-left" />
      <div className="ambient-glow ambient-glow-right" />

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
      <div className="particle particle-lg" style={{ top: '25%', left: '75%', animationDelay: '9s' }} />
      <div className="particle particle-sm" style={{ top: '75%', left: '40%', animationDelay: '11s' }} />
    </>
  );
}
