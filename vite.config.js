import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  // Base path for GitHub Pages
  base: '/OnAirMulTiMedia/',
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['firebase'],
          utils: ['tsx']
        }
      }
    }
  },
  
  // Development server
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    cors: true,
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:; connect-src 'self' wss://* https://* http://localhost:*;"
    }
  },
  
  // Preview server
  preview: {
    host: '0.0.0.0',
    port: 4173,
    open: true
  },
  
  // Plugins
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  
  // CSS configuration
  css: {
    devSourcemap: true
  },
  
  // Asset handling
  assetsInclude: ['**/*.md', '**/*.txt'],
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['firebase', 'tsx']
  },
  
  // Environment variables
  envPrefix: ['VITE_', 'FIREBASE_'],
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@modules': '/modules',
      '@scripts': '/scripts',
      '@assets': '/assets'
    }
  }
})
