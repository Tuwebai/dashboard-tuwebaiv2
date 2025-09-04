import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Code, 
  Image, 
  File, 
  Download,
  Eye
} from 'lucide-react';
import { ProjectFile } from '@/lib/fileService';

// Configuración de archivos soportados para preview
const PREVIEW_SUPPORTED: Record<string, string> = {
  // Code files
  '.js': 'javascript',
  '.jsx': 'javascript', 
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.html': 'html',
  '.json': 'json',
  '.md': 'markdown',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.xml': 'xml',
  '.sql': 'sql',
  '.php': 'php',
  '.py': 'python',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.cs': 'csharp',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  
  // Config files
  '.env': 'bash',
  '.env.local': 'bash',
  '.env.production': 'bash',
  '.env.development': 'bash',
  'Dockerfile': 'dockerfile',
  '.dockerignore': 'text',
  '.gitignore': 'text',
  '.gitattributes': 'text',
  'package.json': 'json',
  'tsconfig.json': 'json',
  'webpack.config.js': 'javascript',
  'vite.config.ts': 'typescript',
  'tailwind.config.js': 'javascript',
  'next.config.js': 'javascript',
  
  // Others
  '.txt': 'text',
  '.log': 'text',
  '.csv': 'text',
  '.ini': 'ini',
  '.conf': 'conf',
  '.sh': 'bash',
  '.bat': 'batch',
  '.ps1': 'powershell'
};

interface FilePreviewProps {
  file: ProjectFile;
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

interface FilePreviewState {
  content: string;
  isLoading: boolean;
  error: string | null;
  language: string;
}

export default function FilePreview({ file, isVisible, position, onClose }: FilePreviewProps) {
  const [previewState, setPreviewState] = useState<FilePreviewState>({
    content: '',
    isLoading: false,
    error: null,
    language: 'text'
  });
  
  const [syntaxHighlighted, setSyntaxHighlighted] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const contentRef = useRef<HTMLDivElement>(null);

  // Detectar lenguaje del archivo
  const detectLanguage = useCallback((fileName: string): string => {
    const extension = fileName.toLowerCase();
    
    // Buscar coincidencia exacta primero
    if (PREVIEW_SUPPORTED[extension]) {
      return PREVIEW_SUPPORTED[extension];
    }
    
    // Buscar por extensión
    for (const [ext, lang] of Object.entries(PREVIEW_SUPPORTED)) {
      if (extension.endsWith(ext)) {
        return lang;
      }
    }
    
    return 'text';
  }, []);

  // Cargar contenido del archivo
  const loadFileContent = useCallback(async () => {
    if (!file || !isVisible) return;
    
    setPreviewState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simular carga del archivo (aquí deberías implementar la lógica real)
      // Por ahora usamos un delay para demostrar el loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Contenido de ejemplo basado en el tipo de archivo
      let content = '';
      const language = detectLanguage(file.name);
      
      switch (language) {
        case 'javascript':
        case 'typescript':
          content = `import React from 'react';
import { useState, useEffect } from 'react';

interface ComponentProps {
  title: string;
  children: React.ReactNode;
}

export default function Component({ title, children }: ComponentProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  return (
    <div className="component">
      <h2>{title}</h2>
      {children}
    </div>
  );
}`;
          break;
          
        case 'css':
        case 'scss':
          content = `.component {
  padding: 1rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.component h2 {
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.component:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
  transition: all 0.2s ease;
}`;
          break;
          
        case 'html':
          content = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Component</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>Dashboard Administrativo</h1>
      <nav class="nav">
        <ul>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#projects">Proyectos</a></li>
          <li><a href="#users">Usuarios</a></li>
        </ul>
      </nav>
    </header>
    
    <main class="main-content">
      <section class="dashboard-stats">
        <h2>Estadísticas</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Total Proyectos</h3>
            <p class="stat-number">24</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</body>
</html>`;
          break;
          
        case 'json':
          content = `{
  "name": "dashboard-tuwebai",
  "version": "1.0.0",
  "description": "Dashboard administrativo moderno y responsive",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@tanstack/react-query": "^4.29.0",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0"
  }
}`;
          break;
          
        case 'markdown':
          content = `# Dashboard TuWebAI

## Descripción
Dashboard administrativo moderno y responsive construido con React, TypeScript y Tailwind CSS.

## Características
- 🎨 Diseño limpio y moderno
- 📱 Completamente responsive
- ⚡ Performance optimizada
- 🔒 Sistema de autenticación
- 📊 Gráficos y estadísticas
- 📁 Gestión de archivos
- 👥 Administración de usuarios

## Tecnologías
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Routing**: React Router DOM
- **Build Tool**: Vite

## Instalación
\`\`\`bash
npm install
npm run dev
\`\`\`

## Scripts Disponibles
- \`npm run dev\` - Servidor de desarrollo
- \`npm run build\` - Build de producción
- \`npm run preview\` - Preview del build
- \`npm run lint\` - Linting del código`;
          break;
          
        default:
          content = `Este es un archivo de texto plano.
Contiene información general sobre el proyecto.

El contenido puede incluir:
- Descripciones
- Instrucciones
- Notas
- Configuraciones
- Logs
- Cualquier texto sin formato

Para archivos de código, se recomienda usar la extensión apropiada
que permita syntax highlighting y mejor legibilidad.`;
      }
      
      // Limitar a 30 líneas máximo
      const lines = content.split('\n');
      const limitedContent = lines.slice(0, 30).join('\n');
      const hasMoreContent = lines.length > 30;
      
      setPreviewState({
        content: hasMoreContent ? limitedContent + '\n...' : limitedContent,
        isLoading: false,
        error: null,
        language
      });
      
    } catch (error) {
      setPreviewState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al cargar el contenido del archivo'
      }));
    }
  }, [file, isVisible, detectLanguage]);

  // Aplicar syntax highlighting
  useEffect(() => {
    if (previewState.content && previewState.language !== 'text') {
      // Aquí implementarías Prism.js para syntax highlighting
      // Por ahora solo aplicamos estilos básicos
      setSyntaxHighlighted(previewState.content);
    } else {
      setSyntaxHighlighted(previewState.content);
    }
  }, [previewState.content, previewState.language]);

  // Cargar contenido solo una vez cuando se hace visible
  useEffect(() => {
    if (isVisible && !previewState.content && !previewState.isLoading) {
      timeoutRef.current = setTimeout(() => {
        loadFileContent();
      }, 300); // Delay de 300ms
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, previewState.content, previewState.isLoading, loadFileContent]);

  // Cerrar preview al presionar Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  // Posicionamiento fijo arriba de la card del archivo
  const getPosition = () => {
    // Obtener el elemento del archivo para calcular su posición
    const fileElement = document.querySelector(`[data-file-id="${file.id}"]`);
    
    if (!fileElement) {
      // Fallback: usar posición del cursor
      return { 
        x: position.x - 200, 
        y: position.y - 320, 
        width: 400, 
        height: 300 
      };
    }
    
    const fileRect = fileElement.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Mismo ancho que la card del archivo (aproximadamente)
    const previewWidth = Math.min(400, Math.max(300, fileRect.width));
    const previewHeight = 300;
    const margin = 20;
    
    // Posición: arriba de la card, centrado horizontalmente
    let x = fileRect.left + (fileRect.width / 2) - (previewWidth / 2);
    let y = fileRect.top - previewHeight - margin;
    
    // Ajustar si se sale por la izquierda
    if (x < margin) {
      x = margin;
    }
    
    // Ajustar si se sale por la derecha
    if (x + previewWidth > viewport.width - margin) {
      x = viewport.width - previewWidth - margin;
    }
    
    // Si no hay espacio arriba, mostrar abajo
    if (y < margin) {
      y = fileRect.bottom + margin;
    }
    
    // Ajustar si se sale por abajo
    if (y + previewHeight > viewport.height - margin) {
      y = viewport.height - previewHeight - margin;
    }
    
    return { x, y, width: previewWidth, height: previewHeight };
  };

  if (!isVisible) return null;

  const finalPosition = getPosition();
  const isCodeFile = previewState.language !== 'text';
  const fileIcon = isCodeFile ? <Code className="h-4 w-4" /> : <FileText className="h-4 w-4" />;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: finalPosition.x,
        top: finalPosition.y,
        width: `${finalPosition.width}px`,
        maxHeight: `${finalPosition.height}px`
      }}
    >
      <Card className="bg-white border-slate-200 shadow-lg pointer-events-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {fileIcon}
            <CardTitle className="text-sm font-medium text-slate-800 truncate">
              {file.name}
            </CardTitle>
            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
              {previewState.language}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {previewState.isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-slate-500">Cargando preview...</span>
            </div>
          ) : previewState.error ? (
            <div className="text-center py-8">
              <File className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-600">{previewState.error}</p>
            </div>
          ) : (
            <div className="relative">
              <div
                ref={contentRef}
                className={`text-xs font-mono leading-relaxed overflow-auto max-h-48 ${
                  isCodeFile ? 'bg-slate-50 p-3 rounded border' : 'text-slate-700'
                }`}
                style={{ 
                  fontFamily: isCodeFile ? 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' : 'inherit'
                }}
              >
                {isCodeFile ? (
                  <pre className="whitespace-pre-wrap break-words">
                    <code className={`language-${previewState.language}`}>
                      {syntaxHighlighted}
                    </code>
                  </pre>
                ) : (
                  <div className="whitespace-pre-wrap break-words">
                    {syntaxHighlighted}
                  </div>
                )}
              </div>
              
              {/* Indicador de más contenido */}
              {previewState.content.includes('...') && (
                <div className="absolute bottom-0 right-0 bg-gradient-to-l from-white via-white to-transparent w-8 h-6"></div>
              )}
            </div>
          )}
          
          {/* Footer con acciones */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {file.size > 1024 * 1024 
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                : `${(file.size / 1024).toFixed(1)} KB`
              }
            </div>
            
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
