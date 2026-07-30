/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF8A3D',
          yellow: '#FFD54A',
          cream: '#FAF6F0',
          peach: '#FFEAD2',
          darkBg: '#0F172A',
          darkCard: '#1E293B',
        }
      },
      animation: {
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'drift-blob1': 'driftBlob1 25s infinite alternate ease-in-out',
        'drift-blob2': 'driftBlob2 20s infinite alternate ease-in-out',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        driftBlob1: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(40px, -60px) scale(1.15)' },
          '100%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        driftBlob2: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(-50px, 40px) scale(0.9)' },
          '100%': { transform: 'translate(30px, -30px) scale(1.1)' },
        }
      }
    },
  },
  plugins: [],
}
