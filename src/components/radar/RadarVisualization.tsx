'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface RadarNode {
  id: string;
  angle: number;
  distance: number;
  avatar: string;
  name: string;
  isOnline: boolean;
  isActive?: boolean;
}

interface RadarVisualizationProps {
  nodes?: RadarNode[];
  centerAvatar?: string;
  centerName?: string;
  isScanning?: boolean;
  isMatching?: boolean;
  size?: number;
}

export function RadarVisualization({
  nodes = [],
  centerAvatar = '😊',
  centerName = 'You',
  isScanning = false,
  isMatching = false,
  size = 320,
}: RadarVisualizationProps) {
  const [sweepAngle, setSweepAngle] = useState(0);
  
  const center = size / 2;
  const maxRadius = size / 2 - 20;
  const ring3Radius = maxRadius * 0.75;
  const ring2Radius = maxRadius * 0.5;
  const ring1Radius = maxRadius * 0.25;
  
  const rings = [
    { radius: ring1Radius },
    { radius: ring2Radius },
    { radius: ring3Radius },
  ];

  // Generate node positions using trigonometry
  const nodePositions = useMemo(() => {
    return nodes.map((node) => {
      const radians = (node.angle * Math.PI) / 180;
      const distance = node.distance * maxRadius;
      const x = center + Math.cos(radians) * distance;
      const y = center + Math.sin(radians) * distance;
      return { x, y, node };
    });
  }, [nodes, center, maxRadius]);

  // Radar sweep animation (~3 seconds per full rotation)
  useEffect(() => {
    if (!isScanning) return;
    
    const sweepInterval = setInterval(() => {
      setSweepAngle((prev) => (prev + 6) % 360); // 60 steps per 360deg = ~3s per rotation at 50ms interval
    }, 50);
    
    return () => clearInterval(sweepInterval);
  }, [isScanning]);

  // During matching state, synchronize nodes
  const synchronizedNodes = useMemo(() => {
    if (isMatching) {
      return nodePositions.filter((_, i) => i % 2 === 0); // Show fewer nodes during sync
    }
    return nodePositions;
  }, [nodePositions, isMatching]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Radar canvas */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        style={{ shapeRendering: 'geometricPrecision' }}
      >
        <defs>
          {/* Radial gradient for glow effect */}
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>
          
          {/* Sweep gradient */}
          <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Background glow */}
        {isScanning && (
          <circle
            cx={center}
            cy={center}
            r={ring3Radius + 8}
            fill="url(#radarGlow)"
            className="animate-radar-glow"
            style={{
              animation: 'radar-glow 3s ease-in-out infinite'
            }}
          />
        )}

        {/* Concentric rings */}
        {rings.map((ring, index) => (
          <circle
            key={index}
            cx={center}
            cy={center}
            r={ring.radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            className="opacity-60"
          />
        ))}

        {/* Sweep beam */}
        {isScanning && (
          <motion.g
            style={{
              rotate: sweepAngle,
              transformOrigin: 'center center',
            }}
            transition={{ duration: 0.05, ease: 'linear' }}
          >
            <line
              x1={center}
              y1={center}
              x2={center}
              y2={center - ring3Radius - 8}
              stroke="url(#sweepGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Sweep trail */}
            <path
              d={`M ${center} ${center} L ${center - ring3Radius - 8} ${center} A ${ring3Radius + 8} ${ring3Radius + 8} 0 0 1 ${center} ${center - ring3Radius - 8} Z`}
              fill="url(#sweepGradient)"
              opacity="0.05"
              transform={`rotate(${sweepAngle}, ${center}, ${center})`}
            />
          </motion.g>
        )}

        {/* Center point */}
        <circle
          cx={center}
          cy={center}
          r="6"
          fill="var(--primary)"
          className="animate-pulse"
        />
      </svg>

      {/* Center avatar */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative z-10">
          <Avatar size="lg" fallback={centerAvatar} className="bg-background border-2 border-primary/20" />
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs font-medium">{centerName}</span>
          </div>
        </div>
      </div>

      {/* Radar nodes */}
      <AnimatePresence mode="wait">
        {synchronizedNodes.map(({ x, y, node }, index) => (
          <motion.div
            key={`${node.id}-${isMatching}`} // Key changes during matching for sync effect
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x,
              y,
              transition: { delay: index * 0.05, type: 'spring', stiffness: 300, damping: 20 }
            }}
            exit={{ scale: 0, opacity: 0, transition: { delay: index * 0.03 } }}
            whileHover={{ scale: 1.25, zIndex: 10 }}
            className={cn(
              'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer',
              node.isActive && 'ring-2 ring-primary/30 bg-primary/5 rounded-full'
            )}
            style={{ width: size < 300 ? 28 : 36, height: size < 300 ? 28 : 36 }}
          >
            <div className="relative w-full h-full">
              {/* Node pulse */}
              {node.isOnline && (
                <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              )}
              {/* Node center dot */}
              <div className="absolute inset-0 rounded-full bg-primary/40 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>
              {/* Avatar (shown on hover or active) */}
              {(node.isActive) && (
                <div className="absolute inset-0 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden">
                  <Avatar size="sm" fallback={node.avatar} className="bg-muted" />
                </div>
              )}
            </div>
            
            {/* Node label */}
            {node.isActive && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
              >
                <span className="text-xs font-medium bg-background/80 backdrop-blur px-2 py-1 rounded-full border border-border">
                  {node.name}
                </span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Matchmaking overlay */}
      {isMatching && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm rounded-full"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"
            />
            <p className="text-xs font-medium">Synchronizing...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
