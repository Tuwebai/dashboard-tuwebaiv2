import { useState, useRef, useCallback, useEffect } from 'react';
import { ProjectFile } from '@/lib/fileService';

interface FilePreviewState {
  isVisible: boolean;
  file: ProjectFile | null;
  position: { x: number; y: number };
}

interface UseFilePreviewReturn {
  previewState: FilePreviewState;
  showPreview: (file: ProjectFile, event: React.MouseEvent) => void;
  hidePreview: () => void;
  handleMouseEnter: (file: ProjectFile) => (event: React.MouseEvent) => void;
  handleMouseLeave: () => void;
  isPreviewSupported: (fileName: string) => boolean;
}

// Archivos soportados para preview
const PREVIEW_SUPPORTED_EXTENSIONS = [
  // Code files
  '.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.sass', '.html', '.json', 
  '.md', '.yml', '.yaml', '.xml', '.sql', '.php', '.py', '.java', '.c', '.cpp', 
  '.cs', '.go', '.rs', '.rb',
  
  // Config files
  '.env', '.env.local', '.env.production', '.env.development',
  'Dockerfile', '.dockerignore', '.gitignore', '.gitattributes',
  'package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.ts',
  'tailwind.config.js', 'next.config.js',
  
  // Image files (para preview rápido)
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.ico',
  
  // Others
  '.txt', '.log', '.csv', '.ini', '.conf', '.sh', '.bat', '.ps1'
];

export function useFilePreview(): UseFilePreviewReturn {
  const [previewState, setPreviewState] = useState<FilePreviewState>({
    isVisible: false,
    file: null,
    position: { x: 0, y: 0 }
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const currentFileRef = useRef<ProjectFile | null>(null);

  // Verificar si un archivo soporta preview
  const isPreviewSupported = useCallback((fileName: string): boolean => {
    const lowerFileName = fileName.toLowerCase();
    
    // Buscar coincidencia exacta
    if (PREVIEW_SUPPORTED_EXTENSIONS.includes(lowerFileName)) {
      return true;
    }
    
    // Buscar por extensión
    return PREVIEW_SUPPORTED_EXTENSIONS.some(ext => 
      lowerFileName.endsWith(ext)
    );
  }, []);

  // Mostrar preview con delay
  const showPreview = useCallback((file: ProjectFile, event: React.MouseEvent) => {
    // Solo mostrar preview para archivos soportados
    if (!isPreviewSupported(file.name)) {
      return;
    }
    
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Actualizar archivo actual
    currentFileRef.current = file;
    
    // Delay de 300ms antes de mostrar
    timeoutRef.current = setTimeout(() => {
      // Verificar que el archivo sigue siendo el mismo
      if (currentFileRef.current === file) {
        setPreviewState(prev => ({
          isVisible: true,
          file,
          position: { x: event.clientX, y: event.clientY }
        }));
      }
    }, 300);
  }, [isPreviewSupported]);

  // Ocultar preview
  const hidePreview = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setPreviewState(prev => ({
      ...prev,
      isVisible: false
    }));
    
    currentFileRef.current = null;
  }, []);

  // Handler para mouse enter
  const handleMouseEnter = useCallback((file: ProjectFile) => {
    return (event: React.MouseEvent) => {
      showPreview(file, event);
    };
  }, [showPreview]);

  // Handler para mouse leave
  const handleMouseLeave = useCallback(() => {
    hidePreview();
  }, [hidePreview]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Ocultar preview solo cuando sea necesario
  useEffect(() => {
    const handleMouseLeaveWindow = () => {
      hidePreview();
    };

    const handleScroll = () => {
      hidePreview();
    };

    const handleResize = () => {
      hidePreview();
    };

    document.addEventListener('mouseleave', handleMouseLeaveWindow);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [hidePreview]);

  return {
    previewState,
    showPreview,
    hidePreview,
    handleMouseEnter,
    handleMouseLeave,
    isPreviewSupported
  };
}
