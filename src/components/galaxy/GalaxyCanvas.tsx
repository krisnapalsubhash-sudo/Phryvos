'use client';

import { useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────
// TYPES & DATA
// ─────────────────────────────────────────────
export interface GalaxyUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isOnline: boolean;
}

export type MatchState = 'idle' | 'scanning' | 'found' | 'connecting';

interface Props {
  users: GalaxyUser[];
  matchState: MatchState;
  matchedId: string | null;
  selectedId?: string | null;
  onUserClick?: (id: string) => void;
  onTriggerScan?: () => void;
}

interface GalacticParticle {
  dist: number;      // distance from galactic center (0 to 1)
  angle: number;     // orbital angle
  armOffset: number; // angle jitter
  speed: number;     // orbital speed
  z: number;         // vertical disk height (-1 to 1)
  size: number;
  cr: number;
  cg: number;
  cb: number;
  alpha: number;
  twinkleFreq: number;
  twinklePhase: number;
}

interface UserCelestialBody {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isOnline: boolean;
  dist: number;      // 0.2 to 0.85
  angle: number;
  speed: number;
  z: number;
  size: number;
  cr: number;
  cg: number;
  cb: number;
  pulsePhase: number;
}

interface WarpWave {
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

// Deterministic PRNG
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) | 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function GalaxyCanvas({
  users,
  matchState,
  matchedId,
  selectedId,
  onUserClick,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<GalacticParticle[]>([]);
  const bodiesRef = useRef<UserCelestialBody[]>([]);
  const wavesRef = useRef<WarpWave[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isDragging: false });
  const viewRotRef = useRef({ pitch: 0.95, yaw: 0 }); // 3D tilt angles
  const t0Ref = useRef(performance.now());
  const scanTimerRef = useRef(0);

  // Generate 3D Logarithmic Spiral Galaxy (3,200 stars + galactic core)
  useEffect(() => {
    const rng = mulberry32(1337);
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || (typeof navigator !== 'undefined' && ((navigator as any).hardwareConcurrency <= 4)));
    const particleCount = isMobile ? 700 : 1600;
    const arms = 3;
    const armSeparation = (Math.PI * 2) / arms;
    const list: GalacticParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Distribution: heavy concentration at center, tapering outwards
      const dist = Math.pow(rng(), 1.8);
      const armIndex = i % arms;
      // Logarithmic spiral curve
      const spiralAngle = dist * 4.8;
      // Gaussian scatter around arm
      const jitter = (rng() - 0.5) * (0.35 + dist * 0.4);
      const angle = armIndex * armSeparation + spiralAngle + jitter;

      // Vertical disk thickness (flatter near edges, bulged at center)
      const diskHeight = (1 - dist) * 0.35 + 0.08;
      const z = (rng() - 0.5) * diskHeight;

      // Color gradation: Center = Brilliant Golden White -> Mid = Electric Cyan / Indigo -> Edge = Magenta / Violet
      let cr = 255;
      let cg = 255;
      let cb = 255;
      if (dist < 0.15) {
        // Core bulge: Warm bright amber white
        cr = 255;
        cg = 240 + Math.floor(rng() * 15);
        cb = 210 + Math.floor(rng() * 45);
      } else if (dist < 0.45) {
        // Inner spiral arms: Bright cyan & icy blue
        cr = 120 + Math.floor(rng() * 60);
        cg = 210 + Math.floor(rng() * 45);
        cb = 255;
      } else if (dist < 0.75) {
        // Outer mid arms: Rich indigo / neon violet
        cr = 160 + Math.floor(rng() * 50);
        cg = 130 + Math.floor(rng() * 50);
        cb = 255;
      } else {
        // Outer fringe: Deep neon magenta / cosmic purple
        cr = 230 + Math.floor(rng() * 25);
        cg = 90 + Math.floor(rng() * 60);
        cb = 240 + Math.floor(rng() * 15);
      }

      list.push({
        dist,
        angle,
        armOffset: jitter,
        speed: (0.12 / (dist + 0.18)) * 0.45, // Keplerian-like differential rotation
        z,
        size: dist < 0.08 ? 1.2 + rng() * 1.8 : 0.6 + rng() * 1.2,
        cr,
        cg,
        cb,
        alpha: 0.25 + rng() * 0.7,
        twinkleFreq: 0.4 + rng() * 1.6,
        twinklePhase: rng() * Math.PI * 2,
      });
    }

    particlesRef.current = list;
  }, []);

  // Map users into orbit bodies
  useEffect(() => {
    const rng = mulberry32(8888);
    bodiesRef.current = users.map((u, i) => {
      const dist = 0.28 + (i / Math.max(1, users.length)) * 0.52;
      const angle = (i * ((Math.PI * 2) / users.length)) + rng() * 0.4;
      const speed = (0.05 / (dist + 0.2)) * (i % 2 === 0 ? 1 : 0.9);
      const isOnline = u.isOnline;

      return {
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatar: u.avatar,
        isOnline,
        dist,
        angle,
        speed,
        z: (rng() - 0.5) * 0.12,
        size: isOnline ? 18 : 15,
        cr: isOnline ? 34 : 129,
        cg: isOnline ? 197 : 140,
        cb: isOnline ? 94 : 248,
        pulsePhase: rng() * Math.PI * 2,
      };
    });
  }, [users]);

  // Handle Scanning Shockwaves
  useEffect(() => {
    if (matchState === 'scanning') {
      wavesRef.current.push({
        radius: 0.05,
        maxRadius: 1.2,
        alpha: 0.8,
        color: 'rgba(99, 102, 241, 0.7)',
      });
    } else if (matchState === 'found') {
      // Golden / emerald warp burst
      wavesRef.current.push(
        { radius: 0.02, maxRadius: 1.4, alpha: 1.0, color: 'rgba(52, 211, 153, 0.9)' },
        { radius: 0.01, maxRadius: 1.1, alpha: 0.7, color: 'rgba(167, 139, 250, 0.8)' }
      );
    }
  }, [matchState]);

  // Interactive mouse/touch parallax drag
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    mouseRef.current.isDragging = true;
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;

    mouseRef.current.targetX = normX * 0.4;
    mouseRef.current.targetY = normY * 0.25;

    if (mouseRef.current.isDragging) {
      const dx = (e.clientX - mouseRef.current.x) * 0.005;
      const dy = (e.clientY - mouseRef.current.y) * 0.005;
      viewRotRef.current.yaw += dx;
      viewRotRef.current.pitch = Math.max(0.4, Math.min(1.4, viewRotRef.current.pitch + dy));
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    }
  };

  const handlePointerUp = () => {
    mouseRef.current.isDragging = false;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check hit test against rendered bodies
    const minDim = Math.min(rect.width, rect.height);
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const pitch = viewRotRef.current.pitch;
    const yaw = viewRotRef.current.yaw;

    bodiesRef.current.forEach((b) => {
      const armR = b.dist * (minDim * 0.48);
      const theta = b.angle + yaw;
      const worldX = Math.cos(theta) * armR;
      const worldY = Math.sin(theta) * armR;
      const worldZ = b.z * (minDim * 0.3);

      // 3D perspective projection
      const projY = worldY * Math.cos(pitch) - worldZ * Math.sin(pitch);
      const projZ = worldY * Math.sin(pitch) + worldZ * Math.cos(pitch);
      const fov = 800;
      const scale = fov / (fov + projZ);

      const screenX = cx + worldX * scale;
      const screenY = cy + projY * scale;

      const dist = Math.hypot(clickX - screenX, clickY - screenY);
      if (dist < b.size * scale + 15) {
        onUserClick?.(b.id);
      }
    });
  };

  // Main 60FPS WebGL-grade Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let lastTime = performance.now();

    function render(now: number) {
      if (!ctx) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const elapsed = (now - t0Ref.current) / 1000;

      const rect = canvas?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      // Smooth mouse follow
      viewRotRef.current.yaw += (mouseRef.current.targetX - (viewRotRef.current.yaw % 0.4)) * 0.03;
      viewRotRef.current.pitch += (0.95 + mouseRef.current.targetY - viewRotRef.current.pitch) * 0.05;

      const W = rect.width;
      const H = rect.height;
      const cx = W / 2;
      const cy = H / 2;
      const minDim = Math.min(W, H);
      const baseGalaxyRadius = minDim * 0.52;

      // 1. SPACE VOID BACKGROUND
      ctx.fillStyle = '#05060A';
      ctx.fillRect(0, 0, W, H);

      // Ambient Deep Space Glow Mesh
      const spaceMesh = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.8);
      spaceMesh.addColorStop(0, 'rgba(30, 27, 75, 0.45)'); // Deep Indigo Center
      spaceMesh.addColorStop(0.35, 'rgba(15, 23, 42, 0.3)');
      spaceMesh.addColorStop(0.7, 'rgba(5, 6, 10, 0.85)');
      spaceMesh.addColorStop(1, '#05060A');
      ctx.fillStyle = spaceMesh;
      ctx.fillRect(0, 0, W, H);

      // Pitch and Yaw angles
      const pitch = viewRotRef.current.pitch;
      // Auto-rotation speed increases slightly during scanning
      const rotSpeed = matchState === 'scanning' ? 0.22 : 0.06;
      viewRotRef.current.yaw += dt * rotSpeed;
      const yaw = viewRotRef.current.yaw;

      const fov = 750;

      // 2. DRAW SHOCKWAVES
      if (matchState === 'scanning') {
        scanTimerRef.current += dt;
        if (scanTimerRef.current > 1.2) {
          scanTimerRef.current = 0;
          wavesRef.current.push({
            radius: 0.02,
            maxRadius: 1.15,
            alpha: 0.85,
            color: 'rgba(99, 102, 241, 0.65)',
          });
        }
      }

      wavesRef.current.forEach((w) => {
        w.radius += dt * 0.45;
        w.alpha -= dt * 0.4;
      });
      wavesRef.current = wavesRef.current.filter((w) => w.alpha > 0.01);

      wavesRef.current.forEach((w) => {
        const ringR = w.radius * baseGalaxyRadius;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, Math.cos(pitch)); // Elliptical projection matching galaxy tilt
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = w.color.replace(/[\d.]+\)$/, `${Math.max(0, w.alpha)})`);
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#6366f1';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.restore();
      });

      // 3. DRAW 3D SPIRAL STARDUST (Sort points by depth for true 3D translucency)
      const starParticles = particlesRef.current;
      const sortedStars: {
        sx: number;
        sy: number;
        depthZ: number;
        size: number;
        cr: number;
        cg: number;
        cb: number;
        alpha: number;
      }[] = [];

      for (let i = 0; i < starParticles.length; i++) {
        const p = starParticles[i];
        p.angle += p.speed * dt;

        const theta = p.angle + yaw;
        const armR = p.dist * baseGalaxyRadius;

        const worldX = Math.cos(theta) * armR;
        const worldY = Math.sin(theta) * armR;
        const worldZ = p.z * (minDim * 0.28);

        // 3D Matrix Rotation (Pitch around X axis)
        const rotY = worldY * Math.cos(pitch) - worldZ * Math.sin(pitch);
        const rotZ = worldY * Math.sin(pitch) + worldZ * Math.cos(pitch);

        const scale = fov / (fov + rotZ);
        const screenX = cx + worldX * scale;
        const screenY = cy + rotY * scale;

        const twinkle = Math.sin(elapsed * p.twinkleFreq + p.twinklePhase) * 0.2;
        const finalAlpha = Math.max(0.08, Math.min(1, (p.alpha + twinkle) * scale));

        sortedStars.push({
          sx: screenX,
          sy: screenY,
          depthZ: rotZ,
          size: p.size * scale,
          cr: p.cr,
          cg: p.cg,
          cb: p.cb,
          alpha: finalAlpha,
        });
      }

      // Sort back-to-front
      sortedStars.sort((a, b) => b.depthZ - a.depthZ);

      // Render stardust in batches for extreme performance
      ctx.save();
      for (let i = 0; i < sortedStars.length; i++) {
        const s = sortedStars[i];
        ctx.beginPath();
        ctx.arc(s.sx, s.sy, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.cr},${s.cg},${s.cb},${s.alpha})`;
        ctx.fill();
      }
      ctx.restore();

      // 4. DRAW ACCRETION DISK & GALACTIC CORE BLACK HOLE / QUASAR
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, Math.cos(pitch)); // Tilted perspective for the accretion ring

      // Outer core plasma glow
      const outerAura = ctx.createRadialGradient(0, 0, 5, 0, 0, minDim * 0.25);
      outerAura.addColorStop(0, 'rgba(255, 235, 170, 0.85)');
      outerAura.addColorStop(0.2, 'rgba(168, 85, 247, 0.45)');
      outerAura.addColorStop(0.6, 'rgba(99, 102, 241, 0.15)');
      outerAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = outerAura;
      ctx.beginPath();
      ctx.arc(0, 0, minDim * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Golden accretion accretion photon ring
      ctx.beginPath();
      ctx.arc(0, 0, minDim * 0.08 + Math.sin(elapsed * 4) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 240, 200, 0.75)';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 20;
      ctx.stroke();

      // Supermassive Event Horizon (Singularity Center)
      ctx.beginPath();
      ctx.arc(0, 0, minDim * 0.045, 0, Math.PI * 2);
      ctx.fillStyle = '#020204';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 25;
      ctx.fill();

      ctx.restore();

      // 5. DRAW USER CELESTIAL ORBITS & BODIES
      const bodies = bodiesRef.current;
      const sortedBodies: {
        body: UserCelestialBody;
        screenX: number;
        screenY: number;
        scale: number;
        depthZ: number;
      }[] = [];

      bodies.forEach((b) => {
        b.angle += b.speed * dt;
        const theta = b.angle + yaw;
        const armR = b.dist * baseGalaxyRadius;

        const worldX = Math.cos(theta) * armR;
        const worldY = Math.sin(theta) * armR;
        const worldZ = b.z * (minDim * 0.28);

        const rotY = worldY * Math.cos(pitch) - worldZ * Math.sin(pitch);
        const rotZ = worldY * Math.sin(pitch) + worldZ * Math.cos(pitch);

        const scale = fov / (fov + rotZ);
        const screenX = cx + worldX * scale;
        const screenY = cy + rotY * scale;

        sortedBodies.push({
          body: b,
          screenX,
          screenY,
          scale,
          depthZ: rotZ,
        });
      });

      sortedBodies.sort((a, b) => b.depthZ - a.depthZ);

      // If a match is found or scanning, draw celestial laser beam to the matched user
      if ((matchState === 'found' || matchState === 'connecting') && matchedId) {
        const target = sortedBodies.find((sb) => sb.body.id === matchedId);
        if (target) {
          ctx.save();
          // Luminous energy tether
          const beamGrad = ctx.createLinearGradient(cx, cy, target.screenX, target.screenY);
          beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          beamGrad.addColorStop(0.3, 'rgba(167, 139, 250, 0.85)');
          beamGrad.addColorStop(0.8, 'rgba(52, 211, 153, 0.9)');
          beamGrad.addColorStop(1, 'rgba(255, 255, 255, 1)');

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(target.screenX, target.screenY);
          ctx.strokeStyle = beamGrad;
          ctx.lineWidth = 3.5 + Math.sin(elapsed * 12) * 1.5;
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 24;
          ctx.stroke();

          // Particle pulses traversing the beam
          for (let p = 0; p < 4; p++) {
            const frac = ((elapsed * 1.5 + p * 0.25) % 1);
            const px = cx + (target.screenX - cx) * frac;
            const py = cy + (target.screenY - cy) * frac;
            ctx.beginPath();
            ctx.arc(px, py, 4 * target.scale, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 10;
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // Draw each user body
      sortedBodies.forEach(({ body: b, screenX, screenY, scale }) => {
        const isMatched = b.id === matchedId;
        const isSelected = b.id === selectedId;
        const pulse = Math.sin(elapsed * 3 + b.pulsePhase);
        const radius = (b.size * scale) * (isMatched ? 1.4 : isSelected ? 1.25 : 1);

        ctx.save();

        // 1. Orbital Aura / Atmosphere
        const auraRadius = radius * 2.8;
        const auraGrad = ctx.createRadialGradient(screenX, screenY, radius * 0.5, screenX, screenY, auraRadius);
        auraGrad.addColorStop(0, `rgba(${b.cr}, ${b.cg}, ${b.cb}, 0.5)`);
        auraGrad.addColorStop(0.6, `rgba(${b.cr}, ${b.cg}, ${b.cb}, 0.15)`);
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(screenX, screenY, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Celestial Core Orb
        const bodyGrad = ctx.createRadialGradient(
          screenX - radius * 0.35,
          screenY - radius * 0.35,
          radius * 0.1,
          screenX,
          screenY,
          radius
        );
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.35, `rgba(${b.cr}, ${b.cg}, ${b.cb}, 0.95)`);
        bodyGrad.addColorStop(1, '#07080f');

        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrad;
        ctx.shadowColor = isMatched ? '#34d399' : `rgb(${b.cr}, ${b.cg}, ${b.cb})`;
        ctx.shadowBlur = isMatched ? 25 : 12;
        ctx.fill();

        // 3. Online status beacon ring
        if (b.isOnline || isMatched) {
          ctx.beginPath();
          ctx.arc(screenX, screenY, radius + 4 + pulse * 2, 0, Math.PI * 2);
          ctx.strokeStyle = isMatched ? 'rgba(52, 211, 153, 0.85)' : 'rgba(34, 197, 94, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // 4. Emoji Avatar
        ctx.font = `${Math.floor(radius * 1.05)}px -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.avatar, screenX, screenY + 1);

        // 5. User Name Tag (crisp & legible)
        ctx.font = `600 ${Math.max(9, Math.floor(11 * scale))}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Text subtle glow backing
        ctx.fillStyle = isMatched ? '#34d399' : '#f8fafc';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.fillText(b.displayName, screenX, screenY + radius + 5);

        ctx.restore();
      });

      // 6. CINEMATIC VIGNETTE & CHROMATIC LENS FLARE
      const vignette = ctx.createRadialGradient(cx, cy, minDim * 0.35, cx, cy, minDim * 0.85);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.7, 'rgba(5, 6, 10, 0.45)');
      vignette.addColorStop(1, 'rgba(5, 6, 10, 0.95)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      if (isRunning && isIntersecting && !document.hidden) {
        animRef.current = requestAnimationFrame(render);
      }
    }

    let isRunning = true;
    let isIntersecting = true;

    function startLoop() {
      if (!isRunning && isIntersecting && !document.hidden) {
        isRunning = true;
        lastTime = performance.now();
        animRef.current = requestAnimationFrame(render);
      }
    }

    function stopLoop() {
      if (isRunning) {
        isRunning = false;
        cancelAnimationFrame(animRef.current);
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    }

    // Set canvas dimensions with DPR (capped on mobile to prevent GPU thermal throttling)
    function handleResize() {
      const isMobile = window.innerWidth < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      const r = canvas?.getBoundingClientRect();
      if (!canvas || !r) return;
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
    animRef.current = requestAnimationFrame(render);

    return () => {
      stopLoop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [matchState, matchedId, selectedId]);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleCanvasClick}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none select-none z-0"
    />
  );
}
