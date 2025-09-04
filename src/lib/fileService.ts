import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  mime_type: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
  version: number;
  is_public: boolean;
  permissions: string[];
  folder_path: string;
  metadata?: {
    description?: string;
    tags?: string[];
    thumbnail_url?: string;
  };
}

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FileSearchFilters {
  name?: string;
  type?: string;
  folder?: string;
  created_by?: string;
  date_from?: string;
  date_to?: string;
  size_min?: number;
  size_max?: number;
}

class FileService {
  private bucketName = 'project-files';

  // Función simplificada - no verificar bucket
  async ensureBucketReady() {
    // No hacer nada - asumir que el bucket existe
    return true;
  }

  // Subir archivo
  async uploadFile(
    projectId: string,
    file: File,
    folderPath: string = '',
    metadata?: any,
    onProgress?: (progress: number) => void
  ): Promise<ProjectFile> {
    try {
      await this.ensureBucketReady();

      const fileName = this.generateUniqueFileName(file.name);
      const filePath = `${projectId}/${folderPath}/${fileName}`.replace(/\/+/g, '/');
      
      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      // Crear registro en la base de datos
      const fileRecord: Omit<ProjectFile, 'id'> = {
        name: file.name,
        path: filePath,
        size: file.size,
        type: this.getFileType(file.name),
        mime_type: file.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: (await supabase.auth.getUser()).data.user?.id || '',
        project_id: projectId,
        version: 1,
        is_public: false,
        permissions: ['read', 'write'],
        folder_path: folderPath,
        metadata: {
          description: metadata?.description || '',
          tags: metadata?.tags || [],
          thumbnail_url: this.generateThumbnailUrl(file.type, urlData.publicUrl)
        }
      };

      const { data: dbData, error: dbError } = await supabase
        .from('project_files')
        .insert(fileRecord)
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: '✅ Archivo subido',
        description: `${file.name} se ha subido correctamente.`
      });

      return dbData;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: '❌ Error al subir archivo',
        description: error.message || 'No se pudo subir el archivo',
        variant: 'destructive'
      });
      throw error;
    }
  }

  // Listar archivos del proyecto
  async getProjectFiles(
    projectId: string,
    folderPath: string = '',
    filters?: FileSearchFilters
  ): Promise<ProjectFile[]> {
    try {
      let query = supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (folderPath) {
        query = query.eq('folder_path', folderPath);
      }

      if (filters?.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters?.size_min) {
        query = query.gte('size', filters.size_min);
      }

      if (filters?.size_max) {
        query = query.lte('size', filters.size_max);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error getting project files:', error);
      toast({
        title: '❌ Error al cargar archivos',
        description: error.message || 'No se pudieron cargar los archivos',
        variant: 'destructive'
      });
      return [];
    }
  }

  // Descargar archivo
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      const { data: fileData, error: fileError } = await supabase
        .from('project_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError) throw fileError;

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(fileData.path);

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        title: '❌ Error al descargar archivo',
        description: error.message || 'No se pudo descargar el archivo',
        variant: 'destructive'
      });
      throw error;
    }
  }

  // Eliminar archivo
  async deleteFile(fileId: string): Promise<void> {
    try {
      const { data: fileData, error: fileError } = await supabase
        .from('project_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError) throw fileError;

      // Eliminar de Storage
      const { error: storageError } = await supabase.storage
        .from(this.bucketName)
        .remove([fileData.path]);

      if (storageError) throw storageError;

      // Eliminar de base de datos
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast({
        title: '✅ Archivo eliminado',
        description: `${fileData.name} se ha eliminado correctamente.`
      });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: '❌ Error al eliminar archivo',
        description: error.message || 'No se pudo eliminar el archivo',
        variant: 'destructive'
      });
      throw error;
    }
  }

  // Actualizar archivo (nueva versión)
  async updateFile(
    fileId: string,
    newFile: File,
    metadata?: any
  ): Promise<ProjectFile> {
    try {
      const { data: oldFile, error: oldFileError } = await supabase
        .from('project_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (oldFileError) throw oldFileError;

      // Subir nueva versión
      const newFileName = this.generateUniqueFileName(newFile.name);
      const newFilePath = oldFile.path.replace(oldFile.name, newFileName);

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(newFilePath, newFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Actualizar registro en base de datos
      const updateData = {
        name: newFile.name,
        path: newFilePath,
        size: newFile.size,
        mime_type: newFile.type,
        updated_at: new Date().toISOString(),
        version: oldFile.version + 1,
        metadata: {
          ...oldFile.metadata,
          description: metadata?.description || oldFile.metadata?.description,
          tags: metadata?.tags || oldFile.metadata?.tags,
          thumbnail_url: this.generateThumbnailUrl(newFile.type, data.path)
        }
      };

      const { data: updatedFile, error: updateError } = await supabase
        .from('project_files')
        .update(updateData)
        .eq('id', fileId)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: '✅ Archivo actualizado',
        description: `${newFile.name} se ha actualizado correctamente.`
      });

      return updatedFile;
    } catch (error: any) {
      console.error('Error updating file:', error);
      toast({
        title: '❌ Error al actualizar archivo',
        description: error.message || 'No se pudo actualizar el archivo',
        variant: 'destructive'
      });
      throw error;
    }
  }

  // Crear carpeta
  async createFolder(
    projectId: string,
    folderName: string,
    parentPath: string = ''
  ): Promise<void> {
    try {
      const folderPath = parentPath ? `${parentPath}/${folderName}` : folderName;
      
      // Crear archivo vacío para representar la carpeta
      const folderFile = new File([''], '.folder', { type: 'application/x-directory' });
      
      await this.uploadFile(projectId, folderFile, folderPath, {
        description: `Carpeta: ${folderName}`,
        tags: ['folder']
      });
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast({
        title: '❌ Error al crear carpeta',
        description: error.message || 'No se pudo crear la carpeta',
        variant: 'destructive'
      });
      throw error;
    }
  }

  // Obtener URL pública del archivo
  async getFileUrl(fileId: string): Promise<string> {
    try {
      const { data: fileData, error } = await supabase
        .from('project_files')
        .select('path')
        .eq('id', fileId)
        .single();

      if (error) throw error;

      const { data } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileData.path);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }

  // Buscar archivos
  async searchFiles(
    projectId: string,
    searchTerm: string,
    filters?: FileSearchFilters
  ): Promise<ProjectFile[]> {
    try {
      let query = supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .or(`name.ilike.%${searchTerm}%,metadata->description.ilike.%${searchTerm}%,metadata->tags.cs.{${searchTerm}}`)
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.folder) {
        query = query.eq('folder_path', filters.folder);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error searching files:', error);
      return [];
    }
  }

  // Obtener estadísticas de archivos
  async getFileStats(projectId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    recentUploads: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      const files = data || [];
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const fileTypes = files.reduce((acc, file) => {
        acc[file.type] = (acc[file.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentUploads = files.filter(file => 
        new Date(file.created_at) > oneWeekAgo
      ).length;

      return {
        totalFiles: files.length,
        totalSize,
        fileTypes,
        recentUploads
      };
    } catch (error: any) {
      console.error('Error getting file stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {},
        recentUploads: 0
      };
    }
  }

  // Utilidades privadas
  private generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_${timestamp}_${random}.${extension}`;
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const typeMap: Record<string, string> = {
      // Imágenes
      'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'webp': 'image', 'svg': 'image',
      // Documentos
      'pdf': 'document', 'doc': 'document', 'docx': 'document', 'txt': 'document', 'rtf': 'document',
      // Código
      'js': 'code', 'ts': 'code', 'jsx': 'code', 'tsx': 'code', 'html': 'code', 'css': 'code', 'scss': 'code',
      'php': 'code', 'py': 'code', 'java': 'code', 'cpp': 'code', 'c': 'code', 'json': 'code', 'xml': 'code',
      // Archivos comprimidos
      'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive', 'gz': 'archive',
      // Video
      'mp4': 'video', 'avi': 'video', 'mov': 'video', 'wmv': 'video', 'flv': 'video',
      // Audio
      'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio',
      // Otros
      'folder': 'folder'
    };

    return typeMap[extension || ''] || 'other';
  }

  private generateThumbnailUrl(mimeType: string, fileUrl: string): string | undefined {
    if (mimeType.startsWith('image/')) {
      return fileUrl;
    }
    return undefined;
  }
}

export const fileService = new FileService();
