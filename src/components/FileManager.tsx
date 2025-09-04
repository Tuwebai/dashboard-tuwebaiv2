import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  Trash2, 
  Folder, 
  File, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Eye,
  Edit,
  Share,
  MoreVertical,
  Plus,
  RefreshCw,
  Image,
  FileText,
  Code,
  Archive,
  Video,
  Music,
  FolderPlus,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { fileService, ProjectFile, FileSearchFilters } from '@/lib/fileService';
import { supabase } from '@/lib/supabase';
import { formatBytes } from '@/utils/formatBytes';
import { formatDateSafe } from '@/utils/formatDateSafe';
import { useFilePreview } from '@/hooks/useFilePreview';
import FilePreview from './FilePreview';

interface FileManagerProps {
  projectId: string;
  isAdmin: boolean;
}

export default function FileManager({ projectId, isAdmin }: FileManagerProps) {
  // Función helper para detectar imágenes por extensión
  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.ico'];
    const lowerFileName = fileName.toLowerCase();
    return imageExtensions.some(ext => lowerFileName.endsWith(ext));
  };

  // Función para obtener el tipo real del archivo (por extensión)
  const getRealFileType = (file: ProjectFile | null | undefined): string => {
    // Validar que el archivo existe
    if (!file || !file.name) {
      return 'file'; // Tipo por defecto si no hay archivo válido
    }
    
    const fileName = file.name.toLowerCase();
    
    // Imágenes
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.ico'].some(ext => fileName.endsWith(ext))) {
      return 'image';
    }
    
    // Documentos
    if (['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'].some(ext => fileName.endsWith(ext))) {
      return 'document';
    }
    
    // Código
    if (['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.sass', '.json', '.xml', '.yaml', '.yml', '.md', '.py', '.java', '.cpp', '.c', '.php', '.rb', '.go', '.rs', '.swift', '.kt'].some(ext => fileName.endsWith(ext))) {
      return 'code';
    }
    
    // Archivos comprimidos
    if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].some(ext => fileName.endsWith(ext))) {
      return 'archive';
    }
    
    // Videos
    if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v'].some(ext => fileName.endsWith(ext))) {
      return 'video';
    }
    
    // Audio
    if (['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'].some(ext => fileName.endsWith(ext))) {
      return 'audio';
    }
    
    // Si no coincide con ninguna extensión conocida, usar el tipo de Supabase como fallback
    return file.type || 'file';
  };

  // Hook para manejar preview de archivos
  const {
    previewState,
    handleMouseEnter,
    handleMouseLeave,
    isPreviewSupported
  } = useFilePreview();

  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FileSearchFilters>({});
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showFileDetails, setShowFileDetails] = useState<ProjectFile | null>(null);
  const [showFilePreview, setShowFilePreview] = useState<ProjectFile | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [fileStats, setFileStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {} as Record<string, number>,
    recentUploads: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar archivos
  const loadFiles = async () => {
    try {
      setLoading(true);
      const projectFiles = await fileService.getProjectFiles(projectId, currentFolder, filters);
      setFiles(projectFiles);
      
      // Cargar estadísticas
      const stats = await fileService.getFileStats(projectId);
      setFileStats(stats);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar archivos
  const searchFiles = async () => {
    if (!searchTerm.trim()) {
      loadFiles();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await fileService.searchFiles(projectId, searchTerm, filters);
      setFiles(searchResults);
    } catch (error) {
      console.error('Error searching files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subir archivos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({});
    const uploadPromises: Promise<void>[] = [];

    Array.from(selectedFiles).forEach((file) => {
      // Inicializar progreso
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 0
      }));

      const uploadPromise = fileService.uploadFile(projectId, file, currentFolder)
        .then(() => {
          // Completar progreso
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
          
          // Limpiar progreso después de un delay
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[file.name];
              return newProgress;
            });
          }, 1000);
        })
        .catch((error) => {
          console.error(`Error uploading ${file.name}:`, error);
          // Limpiar progreso en caso de error
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        });

      uploadPromises.push(uploadPromise);
      
      // Simular progreso real
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 90) {
          clearInterval(progressInterval);
        }
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: Math.min(progress, 90)
        }));
      }, 300);
    });

    try {
      await Promise.all(uploadPromises);
      loadFiles();
      setShowUploadDialog(false);
    } catch (error) {
      console.error('Error in file upload:', error);
    } finally {
      setUploading(false);
      // Limpiar progreso después de un delay adicional
      setTimeout(() => {
        setUploadProgress({});
      }, 2000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Crear carpeta
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await fileService.createFolder(projectId, newFolderName, currentFolder);
      setNewFolderName('');
      setShowCreateFolderDialog(false);
      loadFiles();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  // Descargar archivo
  const handleDownloadFile = async (file: ProjectFile) => {
    try {
      const blob = await fileService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Eliminar archivo
  const handleDeleteFile = async (fileId: string) => {
    try {
      await fileService.deleteFile(fileId);
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  // Obtener URL del archivo para vista previa
  const getFilePreviewUrl = async (file: ProjectFile): Promise<string> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        console.error('VITE_SUPABASE_URL no está definida.');
        return '';
      }
      
      const projectId = file.project_id;
      if (!projectId) {
        console.error('ID de proyecto no definido para el archivo:', file.name);
        return '';
      }
      
      const bucketName = 'project-files';
      let filePath = file.path;
      
      // Si no hay path o está vacío, construir uno
      if (!filePath || filePath.trim() === '') {
        filePath = `${projectId}/${file.name}`;
      }
      
      // Limpiar path de valores undefined
      if (filePath && filePath.includes('undefined')) {
        filePath = filePath.replace(/undefined/g, '');
      }
      
      if (!filePath || filePath.trim() === '') {
        console.error('Ruta de archivo inválida:', filePath);
        return '';
      }
      
      // Construir URL pública directamente
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;

      
      return publicUrl;
    } catch (error) {
      console.error('Error al generar URL de vista previa:', error);
      return '';
    }
  };

  // Manejar apertura de vista previa
  const handleOpenPreview = async (file: ProjectFile) => {
    setShowFilePreview(file);
    setFilePreviewUrl('');
    
    try {
      const realType = getRealFileType(file);
      if (realType === 'image') {
        // Generar URL directamente sin pre-carga compleja
        const url = await getFilePreviewUrl(file);
        if (url) {

          setFilePreviewUrl(url);
        } else {
          console.error('❌ No se pudo obtener URL para la imagen');
        }
      }
    } catch (error) {
      console.error('❌ Error al abrir vista previa:', error);
    }
  };

  // Obtener icono del archivo
  const getFileIcon = (file: ProjectFile) => {
    const realType = getRealFileType(file);
    
    switch (realType) {
      case 'image':
        return <Image className="h-6 w-6 text-blue-400" />;
      case 'document':
        return <FileText className="h-6 w-6 text-green-400" />;
      case 'code':
        return <Code className="h-6 w-6 text-purple-400" />;
      case 'archive':
        return <Archive className="h-6 w-6 text-orange-400" />;
      case 'video':
        return <Video className="h-6 w-6 text-red-400" />;
      case 'audio':
        return <Music className="h-6 w-6 text-pink-400" />;
      case 'folder':
        return <Folder className="h-6 w-6 text-yellow-400" />;
      default:
        return <File className="h-6 w-6 text-gray-400" />;
    }
  };

  // Ordenar archivos
  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0;
    
         switch (sortBy) {
       case 'name':
         comparison = a.name.localeCompare(b.name);
         break;
       case 'size':
         comparison = a.size - b.size;
         break;
       case 'created_at':
         comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
         break;
     }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Efectos
  useEffect(() => {
    loadFiles();
  }, [projectId, currentFolder, filters, sortBy, sortOrder]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchFiles();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="space-y-6 p-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <File className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Total Archivos</p>
                <p className="text-2xl font-bold text-slate-800">{fileStats.totalFiles}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Folder className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Espacio Usado</p>
                <p className="text-2xl font-bold text-slate-800">{formatBytes(fileStats.totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Upload className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Recientes</p>
                <p className="text-2xl font-bold text-slate-800">{fileStats.recentUploads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Grid className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Tipos</p>
                <p className="text-2xl font-bold text-slate-800">{Object.keys(fileStats.fileTypes).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowUploadDialog(true)}
            disabled={!isAdmin}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir Archivos
          </Button>
          
          <Button
            onClick={() => setShowCreateFolderDialog(true)}
            disabled={!isAdmin}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Nueva Carpeta
          </Button>
          
          <Button
            onClick={loadFiles}
            variant="outline"
            disabled={loading}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}
          >
            <Grid className="h-4 w-4" />
          </Button>
          
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col gap-4">
        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar archivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-slate-200 text-slate-800 placeholder:text-slate-500 w-full"
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filters.type || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value }))}>
            <SelectTrigger className="w-full sm:w-40 bg-white border-slate-200 text-slate-800">
              <Filter className="h-4 w-4 mr-2 text-slate-500" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="image">Imágenes</SelectItem>
              <SelectItem value="document">Documentos</SelectItem>
              <SelectItem value="code">Código</SelectItem>
              <SelectItem value="archive">Archivos</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-40 bg-white border-slate-200 text-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="size">Tamaño</SelectItem>
              <SelectItem value="created_at">Fecha</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Lista de archivos */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">Cargando archivos...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="p-4 bg-slate-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
                <Folder className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <p className="text-slate-600 text-base sm:text-lg mb-2">No hay archivos en esta carpeta</p>
              <p className="text-slate-500 mb-4 sm:mb-6 text-sm sm:text-base">Comienza subiendo tu primer archivo para organizar tu proyecto</p>
              {isAdmin && (
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir primer archivo
                </Button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4' : 'space-y-2'}>
              {sortedFiles.map((file) => (
                                                   <div
                    key={file.id}
                    data-file-id={file.id}
                    className={`group relative p-3 sm:p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all ${
                      viewMode === 'grid' ? 'bg-white' : 'bg-slate-50'
                    }`}
                    onMouseEnter={handleMouseEnter(file)}
                    onMouseLeave={handleMouseLeave}
                  >
                  <div className="flex items-center gap-2 sm:gap-3">
                    {getFileIcon(file)}
                                         <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                         {isPreviewSupported(file.name) && (
                           <Badge variant="outline" className="text-xs border-blue-200 text-blue-600 bg-blue-50">
                             <Eye className="h-3 w-3" />
                           </Badge>
                         )}
                       </div>
                       <p className="text-xs text-slate-600">{formatBytes(file.size)}</p>
                       <p className="text-xs text-slate-500">{formatDateSafe(file.created_at)}</p>
                     </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPreview(file);
                        }}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-slate-200 text-slate-600"
                        title="Vista previa"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFileDetails(file);
                        }}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-slate-200 text-slate-600"
                      >
                        <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(file);
                        }}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-slate-200 text-slate-600"
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.id);
                          }}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-slate-200 text-slate-600"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {file.metadata?.tags && file.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {file.metadata.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progreso de subida */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-800">Subiendo archivos...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">{fileName}</span>
                  <span className="text-slate-600">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

             {/* Modal de subida de archivos */}
       <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
         <DialogContent className="bg-white border-slate-200" aria-describedby="upload-description">
           <DialogHeader>
             <DialogTitle className="text-slate-800">Subir archivos</DialogTitle>
             <p id="upload-description" className="text-sm text-slate-600">
               Selecciona los archivos que deseas subir al proyecto
             </p>
           </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
              <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 mb-2">Arrastra archivos aquí o haz clic para seleccionar</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Seleccionar archivos
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de crear carpeta */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent className="bg-white border-slate-200" aria-describedby="create-folder-description">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Crear nueva carpeta</DialogTitle>
            <p id="create-folder-description" className="text-sm text-slate-600">
              Ingresa el nombre de la nueva carpeta que deseas crear
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nombre de la carpeta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-500"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateFolderDialog(false)}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Crear carpeta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

             {/* Modal de detalles del archivo */}
       <Dialog open={!!showFileDetails} onOpenChange={() => setShowFileDetails(null)}>
         <DialogContent className="bg-white border-slate-200 max-w-2xl" aria-describedby="file-details-description">
           <DialogHeader>
             <DialogTitle className="text-slate-800">Detalles del archivo</DialogTitle>
             <p id="file-details-description" className="text-sm text-slate-600">
               Información detallada del archivo seleccionado
             </p>
           </DialogHeader>
          {showFileDetails && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {getFileIcon(showFileDetails)}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{showFileDetails.name}</h3>
                  <p className="text-sm text-slate-600">{showFileDetails.type}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Tamaño</p>
                  <p className="text-slate-800 font-medium">{formatBytes(showFileDetails.size)}</p>
                </div>
                <div>
                  <p className="text-slate-600">Versión</p>
                  <p className="text-slate-800 font-medium">{showFileDetails.version}</p>
                </div>
                <div>
                  <p className="text-slate-600">Creado</p>
                  <p className="text-slate-800 font-medium">{formatDateSafe(showFileDetails.created_at)}</p>
                </div>
                <div>
                  <p className="text-slate-600">Actualizado</p>
                  <p className="text-slate-800 font-medium">{formatDateSafe(showFileDetails.updated_at)}</p>
                </div>
              </div>
              
              {showFileDetails.metadata?.description && (
                <div>
                  <p className="text-slate-600 text-sm">Descripción</p>
                  <p className="text-slate-800">{showFileDetails.metadata.description}</p>
                </div>
              )}
              
              {showFileDetails.metadata?.tags && showFileDetails.metadata.tags.length > 0 && (
                <div>
                  <p className="text-slate-600 text-sm mb-2">Etiquetas</p>
                  <div className="flex flex-wrap gap-1">
                    {showFileDetails.metadata.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadFile(showFileDetails)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteFile(showFileDetails.id)}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

        {/* Modal de vista previa del archivo */}
        <Dialog open={!!showFilePreview} onOpenChange={() => {
          setShowFilePreview(null);
          setFilePreviewUrl('');
        }}>
          <DialogContent className="bg-white border-slate-200 max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogDescription className="sr-only">
              Vista previa del archivo seleccionado
            </DialogDescription>
            <DialogHeader>
              <DialogTitle className="text-slate-800">Vista previa: {showFilePreview?.name}</DialogTitle>
              <p id="file-preview-description" className="text-sm text-slate-600">
                Vista previa del archivo seleccionado
              </p>
                             {(getRealFileType(showFilePreview) === 'image') && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className={`w-2 h-2 rounded-full ${filePreviewUrl ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span>{filePreviewUrl ? 'Imagen cargada' : 'Cargando imagen...'}</span>
                </div>
              )}
            </DialogHeader>
            {showFilePreview && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                {getFileIcon(showFilePreview)}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{showFilePreview.name}</h3>
                                     <p className="text-sm text-slate-600">{formatBytes(showFilePreview.size)} • {getRealFileType(showFilePreview)}</p>
                </div>
              </div>
              
                             <div className="flex-1 overflow-auto">
                                   {(getRealFileType(showFilePreview) === 'image') ? (
                  <div className="flex justify-center">
                    {filePreviewUrl ? (
                      <div className="relative">
                                                 <img
                          src={filePreviewUrl}
                          alt={showFilePreview.name}
                          className="max-w-full max-h-[60vh] object-contain rounded-lg"
                          onError={(e) => {
                            console.error('❌ Error al cargar imagen en modal desde:', filePreviewUrl);
                            console.error('📁 Archivo:', showFilePreview.name);
                            console.error('🔗 URL:', filePreviewUrl);
                            console.error('📊 Tipo detectado:', getRealFileType(showFilePreview));
                          }}
                          onLoad={() => {

                          }}
                        />

                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 text-slate-500">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
                          <p>Cargando imagen...</p>
                        </div>
                      </div>
                    )}
                                                               
                  </div>
                                 ) : getRealFileType(showFilePreview) === 'document' ? (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-2" />
                      <p>Vista previa no disponible para este tipo de archivo</p>
                      <Button
                        onClick={() => handleDownloadFile(showFilePreview)}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar archivo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    <div className="text-center">
                      <File className="h-12 w-12 mx-auto mb-2" />
                      <p>Vista previa no disponible para este tipo de archivo</p>
                      <Button
                        onClick={() => handleDownloadFile(showFilePreview)}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar archivo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadFile(showFilePreview)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFilePreview(null)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
                 </DialogContent>
       </Dialog>

       {/* Preview de archivos al hacer hover */}
       {previewState.isVisible && previewState.file && (
         <FilePreview
           file={previewState.file}
           isVisible={previewState.isVisible}
           position={previewState.position}
           onClose={() => {}}
         />
       )}
     </div>
   );
 }
