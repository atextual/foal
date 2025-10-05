export default defineNuxtConfig({
  compatibilityDate: '2025-10-04',

  devtools: { enabled: false },
  ssr: true, // Enable SSR for server API routes
  modules: ['@pinia/nuxt', '@nuxt/ui', '@vueuse/nuxt'],

  // Dev server configuration
  devServer: {
    port: parseInt(process.env.NUXT_PORT || '3000'),
  },

  // Performance optimizations
  experimental: {
    payloadExtraction: false,
  },

  // Build optimizations
  nitro: {
    minify: true,
    preset: process.env.NITRO_PRESET || 'vercel', // Use Vercel preset for serverless, or override for static builds
  },

  // Runtime config for API
  runtimeConfig: {
    public: {
      apiBaseUrl: 'https://api.neds.com.au/rest/v1/racing/',
    },
  },

  // App config
  app: {
    // GitHub Pages base path (set via environment variable)
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'foal',
      meta: [{ name: 'description', content: 'next up; money.' }],
    },
  },

  // Router configuration
  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
  },

  // Vite config for handling external APIs
  vite: {
    server: {
      proxy: {
        '/api/neds': {
          target: 'https://api.neds.com.au',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/neds/, ''),
        },
      },
    },
  },
});
