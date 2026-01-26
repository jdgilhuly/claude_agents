/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Factorio-inspired color palette
        factory: {
          bg: '#1a1a1a',
          panel: '#2a2a2a',
          border: '#3a3a3a',
          accent: '#ff9f1c',
          success: '#2ecc71',
          warning: '#f39c12',
          danger: '#e74c3c',
          info: '#3498db',
          conveyor: '#4a4a4a',
          metal: '#5a5a5a',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'conveyor-move': 'conveyorMove 2s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'arm-extend': 'armExtend 0.5s ease-out forwards',
        'arm-retract': 'armRetract 0.5s ease-in forwards',
      },
      keyframes: {
        conveyorMove: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 0' },
        },
        armExtend: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'top' },
        },
        armRetract: {
          '0%': { transform: 'scaleY(1)', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(0)', transformOrigin: 'top' },
        },
      },
    },
  },
  plugins: [],
}
