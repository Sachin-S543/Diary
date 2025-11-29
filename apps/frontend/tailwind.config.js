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
                // Base
                background: "#f8fafc", // Slate 50
                foreground: "#0f172a", // Slate 900

                // Glass System
                glass: {
                    100: "rgba(255, 255, 255, 0.1)",
                    200: "rgba(255, 255, 255, 0.2)",
                    300: "rgba(255, 255, 255, 0.3)",
                    400: "rgba(255, 255, 255, 0.4)",
                    border: "rgba(255, 255, 255, 0.5)",
                },

                // Accents (Soft & Premium)
                primary: {
                    DEFAULT: "#6366f1", // Indigo 500
                    soft: "#818cf8",
                    vibrant: "#4f46e5",
                },
                secondary: {
                    DEFAULT: "#ec4899", // Pink 500
                    soft: "#f472b6",
                },
                accent: {
                    cyan: "#06b6d4",
                    purple: "#8b5cf6",
                    rose: "#f43f5e",
                    amber: "#f59e0b",
                    emerald: "#10b981",
                }
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'], // Main UI font
                body: ['Inter', 'sans-serif'],   // Long text
                mono: ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                'glass-sm': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'glass-md': '0 8px 30px rgba(0, 0, 0, 0.04)',
                'glass-lg': '0 20px 40px rgba(0, 0, 0, 0.08)',
                'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    'from': { backgroundPosition: '0 0' },
                    'to': { backgroundPosition: '-200% 0' },
                },
                'scale-in': {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                }
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
