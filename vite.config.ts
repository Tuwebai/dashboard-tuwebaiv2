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
    // Optimizaciones de build para producción
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    
    // Configuración de rollup para code splitting
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
        },
        // Code splitting manual para optimizar carga
        manualChunks: (id) => {
          // React core - asegurar que React esté en un chunk separado
          if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-dom/client')) {
            return 'react-vendor';
          }
          
          // React Router
          if (id.includes('react-router')) {
            return 'router-vendor';
          }
          
          // Radix UI components
          if (id.includes('@radix-ui')) {
            return 'radix-vendor';
          }
          
          // Charts libraries
          if (id.includes('echarts') || id.includes('recharts') || id.includes('chart.js')) {
            return 'charts-vendor';
          }
          
          // Monaco Editor
          if (id.includes('monaco-editor')) {
            return 'editor-vendor';
          }
          
          // Drag and drop
          if (id.includes('react-beautiful-dnd')) {
            return 'drag-vendor';
          }
          
          // Query management
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }
          
          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase-vendor';
          }
          
          // Utilities
          if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'utils-vendor';
          }
          
          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-vendor';
          }
          
          // PDF and file processing
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('file-saver')) {
            return 'file-vendor';
          }
          
          // Internationalization
          if (id.includes('i18next')) {
            return 'i18n-vendor';
          }
          
          // Large node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    
    // Configuración de terser para minificación avanzada
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 3,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        conditionals: true,
        dead_code: true,
        evaluate: true,
        if_return: true,
        join_vars: true,
        reduce_vars: true,
        sequences: true,
        unused: true
      },
      mangle: {
        safari10: true,
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false
      }
    },
    
    // Configuración de chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  
  // Optimizaciones de desarrollo
  server: {
    port: 8083,
    host: true,
    strictPort: true,
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
      'react-dom/client',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      'recharts',
      'date-fns',
      'clsx',
      'tailwind-merge',
      '@radix-ui/react-dialog',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-dropdown-menu',
      'echarts',
      'echarts-for-react',
      'chart.js',
      'react-chartjs-2',
      'i18next',
      'react-i18next',
      'zustand',
      'zod',
      'react-hook-form',
      '@hookform/resolvers'
    ],
    exclude: ['@vite/client', '@vite/env', 'monaco-editor']
  },
  
  // Configuración de assets
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ico'],
  
  // Configuración de define para variables de entorno
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  envPrefix: 'VITE_',
  
  // Configuración de CSS
  css: {
    devSourcemap: true
  }
})
