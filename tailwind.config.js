/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/design-system/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
          hover: 'var(--surface-hover)',
          active: 'var(--surface-active)',
        },
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '2xl': '1rem',
        xl: 'var(--radius)',
        lg: 'calc(var(--radius) - 2px)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 6px)',
        'br-xs': '0 0 4px 0',
        'bl-xs': '0 0 0 4px',
        'tr-none': '0 0 0 0',
        'tl-none': '0 0 0 0',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 20px -5px rgba(99, 102, 241, 0.25)',
        'glow-md': '0 0 35px -5px rgba(99, 102, 241, 0.35)',
        'glow-lg': '0 0 50px -5px rgba(99, 102, 241, 0.45)',
        'card-soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'phryvos-gradient': 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)',
        'phryvos-gradient-subtle': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'phryvos-gradient-text': 'linear-gradient(180deg, #09090B 0%, #52525B 100%)',
        'phryvos-gradient-text-dark': 'linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.phryvos-gradient': {
          'background-image': 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)',
        },
        '.dark .phryvos-gradient': {
          'background-image': 'linear-gradient(135deg, #27272A 0%, #3F3F46 100%)',
        },
        '.phryvos-gradient-subtle': {
          'background-image': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        },
        '.phryvos-gradient-text': {
          'background-image': 'linear-gradient(180deg, #09090B 0%, #52525B 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.dark .phryvos-gradient-text': {
          'background-image': 'linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.phryvos-glow': {
          'box-shadow': '0 0 30px rgba(255, 255, 255, 0.06)',
        },
        '.phryvos-glow-strong': {
          'box-shadow': '0 0 40px rgba(255, 255, 255, 0.12)',
        },
        '.glass-panel': {
          'background': 'var(--glass-bg)',
          'backdrop-filter': 'blur(16px)',
          '-webkit-backdrop-filter': 'blur(16px)',
          'border': '1px solid var(--glass-border)',
        },
        '.glass-surface': {
          'background': 'var(--glass-bg)',
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          'border': '1px solid var(--border)',
        },
        '.interactive-surface': {
          'background': 'var(--card)',
          'border': '1px solid var(--border)',
          'border-radius': 'var(--radius)',
          'transition': 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        },
        '.interactive-surface:hover': {
          'border-color': 'rgba(99, 102, 241, 0.35)',
          'box-shadow': '0 8px 30px -4px var(--atmos-glow)',
          'transform': 'translateY(-2px)',
        },
        '.hero-glow-mesh': {
          'position': 'absolute',
          'top': '0',
          'left': '50%',
          'transform': 'translateX(-50%)',
          'width': '100%',
          'max-width': '1200px',
          'height': '600px',
          'background': 'radial-gradient(circle 450px at 50% 100px, rgba(99, 102, 241, 0.15), transparent 70%), radial-gradient(circle 350px at 80% 250px, rgba(139, 92, 246, 0.1), transparent 70%), radial-gradient(circle 350px at 20% 250px, rgba(6, 182, 212, 0.1), transparent 70%)',
          'pointer-events': 'none',
          'z-index': '0',
        },
        '.dark .hero-glow-mesh': {
          'background': 'radial-gradient(circle 450px at 50% 100px, rgba(99, 102, 241, 0.25), transparent 70%), radial-gradient(circle 350px at 80% 250px, rgba(139, 92, 246, 0.18), transparent 70%), radial-gradient(circle 350px at 20% 250px, rgba(6, 182, 212, 0.15), transparent 70%)',
        },
        '.btn-icon': {
          'width': '2.25rem',
          'height': '2.25rem',
          'border-radius': '0.75rem',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'color': 'var(--muted-foreground)',
          'background': 'transparent',
          'transition': 'all 0.15s ease-out',
          'cursor': 'pointer',
        },
        '.btn-icon:hover': {
          'color': 'var(--foreground)',
          'background-color': 'var(--surface-hover)',
        },
        '.btn-icon:active': {
          'transform': 'scale(0.95)',
        },
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.no-scrollbar::-webkit-scrollbar': {
          'display': 'none',
        },
        '.rounded-br-xs': {
          'border-radius': '0 0 4px 0',
        },
        '.rounded-bl-xs': {
          'border-radius': '0 0 0 4px',
        },
        '.rounded-tr-none': {
          'border-radius': '0 0 0 0',
        },
        '.rounded-tl-none': {
          'border-radius': '0 0 0 0',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};