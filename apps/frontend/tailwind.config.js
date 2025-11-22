/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                background: "#030014", // Deep space black
                surface: "rgba(255, 255, 255, 0.03)",
                "neon-purple": "#b026ff",
                "neon-cyan": "#00f3ff",
                "neon-pink": "#ff00ff",
                glass: "rgba(255, 255, 255, 0.05)",
                "glass-border": "rgba(255, 255, 255, 0.1)",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
                display: ['Outfit', 'sans-serif'],
            },
            boxShadow: {
                'neon-purple': '0 0 5px #b026ff, 0 0 20px rgba(176, 38, 255, 0.5)',
                'neon-cyan': '0 0 5px #00f3ff, 0 0 20px rgba(0, 243, 255, 0.5)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                glow: {
                    'from': { boxShadow: '0 0 5px #b026ff, 0 0 10px #b026ff' },
                    'to': { boxShadow: '0 0 10px #b026ff, 0 0 20px #b026ff' },
                }
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
