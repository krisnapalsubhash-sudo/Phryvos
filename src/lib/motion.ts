import { Variants } from 'framer-motion';

/**
 * Phryvos Spring Physics & Animation Presets
 * Tuned for premium, weightless micro-interactions (Awwwards-level polish).
 */

export const springPhysics = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 30,
};

export const gentleSpring = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 24,
};

export const bouncySpring = {
  type: 'spring' as const,
  stiffness: 450,
  damping: 22,
};

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: gentleSpring 
  },
  exit: { 
    opacity: 0, 
    y: -12, 
    filter: 'blur(4px)',
    transition: { duration: 0.15 } 
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, filter: 'blur(4px)' },
  visible: { 
    opacity: 1, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: bouncySpring 
  },
  exit: { 
    opacity: 0, 
    scale: 0.94, 
    transition: { duration: 0.12 } 
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const cardHoverVariants = {
  rest: { y: 0, scale: 1 },
  hover: { 
    y: -4, 
    scale: 1.01,
    transition: gentleSpring 
  },
  tap: { 
    scale: 0.98,
    transition: { type: 'spring', stiffness: 500, damping: 25 }
  },
};
