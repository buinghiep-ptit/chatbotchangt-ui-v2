import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Noto Sans'", 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        status: {
          pending: 'hsl(var(--status-pending))',
          running: 'hsl(var(--status-running))',
          done: 'hsl(var(--status-done))',
        },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 4px)', sm: 'calc(var(--radius) - 8px)' },
      keyframes: {
        blink: { '0%,60%,100%': { opacity: '.25', transform: 'translateY(0)' }, '30%': { opacity: '1', transform: 'translateY(-3px)' } },
        'drift': { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(-3%, 2%)' } },
      },
      animation: { blink: 'blink 1.2s infinite', drift: 'drift 18s ease-in-out infinite' },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
