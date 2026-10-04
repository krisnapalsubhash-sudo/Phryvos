'use client';

import React, { useEffect, useRef } from 'react';

interface TiltedSolarCanvasProps {
  isMatching: boolean;
}

interface PlanetConfig {
  rx: number;            // Semi-major radius (horizontal distance)
  baseSpeed: number;     // Speed in radians per sec
  size: number;          // Dot radius in px
  color: string;         // Hex color
  glowColor: string;     // rgba for glow
  startAngle: number;    // Phase offset
  matchingTilt: number;  // Plane tilt angle in radians during matchmaking
}

export function TiltedSolarCanvas({ isMatching }: TiltedSolarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const stateRef = useRef({ isMatching });
  stateRef.current = { isMatching };

  // 6 orbiting dots with distinct distances, colors, and speeds
  const planetsRef = useRef<PlanetConfig[]>([
    {
      rx: 55,
      baseSpeed: 1.1,
      size: 5.5,
      color: '#818cf8', // Indigo
      glowColor: 'rgba(129, 140, 248, 0.8)',
      startAngle: 0.4,
      matchingTilt: -0.45, // -26 deg
    },
    {
      rx: 82,
      baseSpeed: 0.85,
      size: 7.5,
      color: '#38bdf8', // Sky Blue
      glowColor: 'rgba(56, 189, 248, 0.8)',
      startAngle: 2.1,
      matchingTilt: 0.65, // +37 deg
    },
    {
      rx: 110,
      baseSpeed: 0.7,
      size: 5,
      color: '#fbbf24', // Amber
      glowColor: 'rgba(251, 191, 36, 0.8)',
      startAngle: 4.3,
      matchingTilt: -0.85, // -49 deg
    },
    {
      rx: 138,
      baseSpeed: 0.55,
      size: 8,
      color: '#c084fc', // Purple
      glowColor: 'rgba(192, 132, 252, 0.85)',
      startAngle: 1.2,
      matchingTilt: 0.95, // +54 deg
    },
    {
      rx: 168,
      baseSpeed: 0.45,
      size: 6.5,
      color: '#34d399', // Emerald
      glowColor: 'rgba(52, 211, 153, 0.8)',
      startAngle: 3.5,
      matchingTilt: -0.35, // -20 deg
    },
    {
      rx: 195,
      baseSpeed: 0.38,
      size: 7,
      color: '#f43f5e', // Rose
      glowColor: 'rgba(244, 63, 94, 0.8)',
      startAngle: 5.6,
      matchingTilt: 0.55, // +31 deg
    },
  ]);

  // Trail history for high-speed matchmaking motion blur
  const trailsRef = useRef<Array<Array<{ x: number; y: number; alpha: number }>>>([
    [], [], [], [], [], []
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();
    let currentSunY = 0;
    let targetSunY = 0;
    let currentTiltFactor = 0.24; // 76 degree tilt -> sin(14deg) ≈ 0.24

    // Dynamic scale factor according to canvas size
    function getScale() {
      if (!canvas) return 1;
      const w = canvas.clientWidth || 360;
      return Math.min(1.2, Math.max(0.75, w / 400));
    }

    function render(now: number) {
      if (!ctx || !canvas) return;
      const time = (now - startTime) / 1000;
      const matching = stateRef.current.isMatching;

      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      if (W === 0 || H === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const scale = getScale();

      // 1. CENTER SUN DYNAMICS:
      // Idle: Bobs up & down softly (sinusoidal float).
      // Matching: Uchhalna band kar deta hai! Immediately locks at center y = 0.
      if (matching) {
        targetSunY = 0;
      } else {
        targetSunY = Math.sin(time * 2.4) * (14 * scale);
      }
      currentSunY += (targetSunY - currentSunY) * 0.08;

      const sunRadius = 26 * scale;

      // 2. CALCULATE PLANET POSITIONS (75° SIDE-VIEW ELLIPSE)
      // When matching: speed increases by 4.5x, and orbits tilt into non-symmetrical individual planes.
      const planetPositions = planetsRef.current.map((p, idx) => {
        const speedMult = matching ? 4.5 : 1.0;
        const currentAngle = p.startAngle + time * (p.baseSpeed * speedMult);

        const rx = p.rx * scale;
        // In 75 deg side view, height ratio is ~0.24
        const ry = rx * currentTiltFactor;

        // Base horizontal orbit position relative to center
        let relX = Math.cos(currentAngle) * rx;
        let relY = Math.sin(currentAngle) * ry;

        // Depth (z): positive = in front of sun, negative = behind sun
        let depthZ = Math.sin(currentAngle);

        // When matching: Rotate the orbit plane by planet's unique matchingTilt angle!
        if (matching) {
          const tilt = p.matchingTilt;
          const cosT = Math.cos(tilt);
          const sinT = Math.sin(tilt);
          const tiltedX = relX * cosT - relY * sinT;
          const tiltedY = relX * sinT + relY * cosT;
          relX = tiltedX;
          relY = tiltedY;
          // Z shifts with tilt as well
          depthZ = Math.sin(currentAngle) * cosT;
        }

        const posX = cx + relX;
        const posY = (cy + currentSunY) + relY;

        // Size adjusts with depth perspective (slightly larger when in front)
        const currentSize = p.size * scale * (1 + depthZ * 0.22);

        return {
          idx,
          x: posX,
          y: posY,
          z: depthZ,
          size: currentSize,
          color: p.color,
          glowColor: p.glowColor,
        };
      });

      // 3. SEPARATE INTO BACK (BEHIND SUN) AND FRONT (IN FRONT OF SUN)
      const backPlanets = planetPositions.filter((p) => p.z < 0);
      const frontPlanets = planetPositions.filter((p) => p.z >= 0);

      // Helper function to draw a glowing dot
      const drawPlanet = (p: typeof planetPositions[0]) => {
        // Record trail for fast matching
        if (matching) {
          const trailList = trailsRef.current[p.idx];
          trailList.push({ x: p.x, y: p.y, alpha: 0.6 });
          if (trailList.length > 8) trailList.shift();

          // Draw motion blur trail
          for (let t = 0; t < trailList.length; t++) {
            const pt = trailList[t];
            const tRatio = (t + 1) / trailList.length;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, Math.max(1, p.size * 0.6 * tRatio), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.25 * tRatio;
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }
        }

        // Outer Atmospheric Aura
        const auraGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.8);
        auraGrad.addColorStop(0, p.glowColor);
        auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = auraGrad;
        ctx.fill();

        // Solid Dot Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = matching ? 16 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      };

      // ─── STEP A: DRAW BACK PLANETS (Passing BEHIND Sun) ───
      backPlanets.forEach(drawPlanet);

      // ─── STEP B: DRAW CENTER BIG SUN DOT ───
      const sunCenterY = cy + currentSunY;

      // Pulsing outer corona
      const sunPulse = matching ? Math.sin(time * 8) * 4 : Math.sin(time * 3) * 2;
      const coronaRadius = (sunRadius * 2.2) + sunPulse;
      const coronaGrad = ctx.createRadialGradient(cx, sunCenterY, sunRadius * 0.4, cx, sunCenterY, coronaRadius);
      coronaGrad.addColorStop(0, matching ? 'rgba(99, 102, 241, 0.7)' : 'rgba(99, 102, 241, 0.45)');
      coronaGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)');
      coronaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(cx, sunCenterY, coronaRadius, 0, Math.PI * 2);
      ctx.fillStyle = coronaGrad;
      ctx.fill();

      // Main Sun Body Gradient
      const sunGrad = ctx.createRadialGradient(
        cx - sunRadius * 0.35,
        sunCenterY - sunRadius * 0.35,
        sunRadius * 0.1,
        cx,
        sunCenterY,
        sunRadius
      );
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.3, '#818cf8'); // Indigo core
      sunGrad.addColorStop(0.7, '#6366f1');
      sunGrad.addColorStop(1, '#4338ca'); // Deep Indigo

      ctx.beginPath();
      ctx.arc(cx, sunCenterY, sunRadius, 0, Math.PI * 2);
      ctx.fillStyle = sunGrad;
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = matching ? 35 : 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // White Hot Center Core Glow
      ctx.beginPath();
      ctx.arc(cx - sunRadius * 0.2, sunCenterY - sunRadius * 0.2, sunRadius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fill();

      // ─── STEP C: DRAW FRONT PLANETS (Passing IN FRONT of Sun) ───
      frontPlanets.forEach(drawPlanet);

      if (isRunning && isIntersecting && !document.hidden) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    }

    let isRunning = true;
    let isIntersecting = true;

    function startLoop() {
      if (!isRunning && isIntersecting && !document.hidden) {
        isRunning = true;
        startTime = performance.now();
        animFrameRef.current = requestAnimationFrame(render);
      }
    }

    function stopLoop() {
      if (isRunning) {
        isRunning = false;
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    }

    function handleResize() {
      if (!canvas) return;
      const isMobile = window.innerWidth < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx?.scale(dpr, dpr);
    }

    // IntersectionObserver to pause rendering when scrolled out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    document.addEventListener('visibilitychange', onVisibilityChange);
    handleResize();
    window.addEventListener('resize', handleResize);
    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      stopLoop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[420px] md:max-w-[480px] aspect-[4/3] flex items-center justify-center select-none overflow-hidden mx-auto">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}
