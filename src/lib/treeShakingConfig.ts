// =====================================================
// CONFIGURACIÓN DE TREE SHAKING OPTIMIZADO
// =====================================================

// Configuración para importaciones específicas y tree shaking
export const treeShakingImports = {
  // Lucide React - importar solo iconos necesarios
  lucide: {
    // Iconos más comunes
    common: [
      'Home', 'User', 'Settings', 'Search', 'Menu', 'X', 'Plus', 'Minus',
      'Edit', 'Trash2', 'Save', 'Download', 'Upload', 'Eye', 'EyeOff',
      'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight',
      'Check', 'AlertCircle', 'Info', 'Warning', 'Error'
    ],
    // Iconos de navegación
    navigation: [
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'ExternalLink', 'Link', 'Share', 'Copy'
    ],
    // Iconos de archivos
    files: [
      'File', 'FileText', 'Image', 'Video', 'Music', 'Archive',
      'Folder', 'FolderOpen', 'FilePlus', 'FolderPlus'
    ],
    // Iconos de UI
    ui: [
      'Calendar', 'Clock', 'Bell', 'Mail', 'Phone', 'MapPin',
      'Globe', 'Lock', 'Unlock', 'Key', 'Shield', 'ShieldCheck'
    ]
  },

  // Radix UI - importar solo componentes necesarios
  radix: {
    // Componentes principales
    core: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-accordion'
    ],
    // Componentes secundarios
    secondary: [
      '@radix-ui/react-popover',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-navigation-menu'
    ]
  },

  // Charts - importar solo librerías necesarias
  charts: {
    // ECharts - importar solo módulos necesarios
    echarts: [
      'echarts/core',
      'echarts/charts',
      'echarts/components',
      'echarts/renderers'
    ],
    // Recharts - importar solo componentes necesarios
    recharts: [
      'recharts/LineChart',
      'recharts/BarChart',
      'recharts/PieChart',
      'recharts/AreaChart',
      'recharts/ResponsiveContainer'
    ]
  }
};

// Función para importar iconos de Lucide de forma optimizada
export const importLucideIcon = (iconName: string) => {
  return import(`lucide-react/dist/esm/icons/${iconName}`);
};

// Función para importar componentes de Radix de forma optimizada
export const importRadixComponent = (componentName: string) => {
  return import(`@radix-ui/${componentName}`);
};

// Configuración de lazy loading para componentes pesados
export const lazyComponents = {
  // Editor de código
  codeEditor: () => import('@monaco-editor/react'),
  
  // Charts complejos
  advancedCharts: () => import('../components/AdvancedCharts/AdvancedChart'),
  
  // PDF viewer
  pdfViewer: () => import('../components/FilePreview'),
  
  // Drag and drop
  dragDrop: () => import('@hello-pangea/dnd'),
  
  // File processing
  fileProcessing: () => import('html2canvas'),
  
  // Internationalization
  i18n: () => import('../lib/i18n')
};

// Configuración de preload para recursos críticos
export const preloadConfig = {
  // Preload de fuentes críticas
  fonts: [
    'Inter',
    'Inter-Bold',
    'Inter-Medium'
  ],
  
  // Preload de imágenes críticas
  images: [
    '/logo.svg',
    '/favicon.ico'
  ],
  
  // Preload de scripts críticos
  scripts: [
    '/src/main.tsx',
    '/src/App.tsx'
  ]
};

export default {
  treeShakingImports,
  importLucideIcon,
  importRadixComponent,
  lazyComponents,
  preloadConfig
};
