import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimizaciones de build
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    
    // Configuración de rollup simplificada para evitar problemas de exportación
    rollupOptions: {
      output: {
        // Optimizar nombres de archivos
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]'
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      }
    },
    
    // Configuración de terser para minificación
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      }
    },
    
    // Configuración de chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  
  // Optimizaciones de desarrollo
  server: {
    port: 8083,
    host: true,
    strictPort: true, // Evitar que Vite cambie el puerto automáticamente
    // Configuración de HMR optimizada
    hmr: {
      overlay: false,
      port: 8083,
      host: 'localhost'
    }
  },
  
  // Optimizaciones de preview
  preview: {
    port: 4173,
    host: true
  },
  
  // Optimizaciones de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      'recharts',
      'date-fns',
      'clsx',
      'tailwind-merge'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // Configuración de assets
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ico'],
  
  // Configuración de define para variables de entorno
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Configuración de variables de entorno
  envPrefix: 'VITE_',
  
  // Configuración de CSS
  css: {
    devSourcemap: true
  }
})
