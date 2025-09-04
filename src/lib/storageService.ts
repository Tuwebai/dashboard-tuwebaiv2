import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

export interface FileData {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  userId: string;
  projectId?: string;
  phaseKey?: string;
  description?: string;
  tags?: string[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class StorageService {
  private static readonly DEFAULT_BUCKET = 'project-files';
  private static readonly AVATARS_BUCKET = 'avatars';
  private static readonly TEMP_BUCKET = 'temp';

  // Subir archivo al bucket de proyectos
  static async uploadProjectFile(
    file: File, 
    userId: string, 
    projectId: string,
    phaseKey?: string,
    description?: string,
    tags?: string[]
  ): Promise<FileData> {
    try {
      const timestamp = Date.now();
      const fileName = `${userId}/${projectId}/${timestamp}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from(this.DEFAULT_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(this.DEFAULT_BUCKET)
        .getPublicUrl(fileName);

      const fileData: FileData = {
        id: data.path,
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        userId,
        projectId,
        phaseKey,
        description,
        tags
      };

      return fileData;
    } catch (error) {
      console.error('Error uploading project file:', error);
      throw new Error('Error al subir el archivo del proyecto');
    }
  }

  // Subir avatar de usuario
  static async uploadAvatar(file: File, userId: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `avatar_${timestamp}.${file.name.split('.').pop()}`;
      
      // Intentar subir al bucket avatars primero
      let bucketName = this.AVATARS_BUCKET;
      let filePath = `${userId}/${fileName}`;
      let uploadError = null;
      
      const { error: avatarsError } = await supabase.storage
        .from(this.AVATARS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (avatarsError && avatarsError.message.includes('Bucket not found')) {
        // Si el bucket avatars no existe, usar project-files con carpeta avatars
        bucketName = this.DEFAULT_BUCKET;
        filePath = `avatars/${userId}/${fileName}`;
        const { error: projectError } = await supabase.storage
          .from(this.DEFAULT_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
        uploadError = projectError;
      } else {
        uploadError = avatarsError;
      }

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      // console.error('Error uploading avatar:', error);
      throw new Error('Error al subir el avatar');
    }
  }

  // Eliminar avatar de usuario
  static async deleteAvatar(userId: string, avatarUrl: string): Promise<void> {
    try {
      // Extraer el path del archivo de la URL
      const url = new URL(avatarUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const filePath = `${userId}/${fileName}`;

      // Determinar el bucket basado en la URL
      let bucketName = this.AVATARS_BUCKET;
      if (avatarUrl.includes('project-files')) {
        bucketName = this.DEFAULT_BUCKET;
      }

      // Eliminar archivo del storage
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        // console.error('Error deleting avatar:', error);
        // No lanzar error si el archivo no existe
        if (!error.message.includes('Object not found')) {
          throw error;
        }
      }
    } catch (error) {
      // console.error('Error deleting avatar:', error);
      // No lanzar error para no interrumpir el flujo
    }
  }

  // Subir archivo temporal
  static async uploadTempFile(file: File, userId: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `${userId}/temp_${timestamp}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from(this.TEMP_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(this.TEMP_BUCKET)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading temp file:', error);
      throw new Error('Error al subir el archivo temporal');
    }
  }

  // Eliminar archivo
  static async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Error al eliminar el archivo');
    }
  }

  // Obtener URL pública de un archivo
  static getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // Listar archivos en un directorio
  static async listFiles(bucket: string, path?: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path);

      if (error) throw error;

      return data?.map(item => item.name) || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Error al listar archivos');
    }
  }

  // Descargar archivo
  static async downloadFile(bucket: string, path: string): Promise<Blob> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Error al descargar el archivo');
    }
  }

  // Copiar archivo
  static async copyFile(
    sourceBucket: string, 
    sourcePath: string, 
    destBucket: string, 
    destPath: string
  ): Promise<void> {
    try {
      // Descargar archivo fuente
      const sourceBlob = await this.downloadFile(sourceBucket, sourcePath);
      
      // Subir a nueva ubicación
      const { error } = await supabase.storage
        .from(destBucket)
        .upload(destPath, sourceBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error copying file:', error);
      throw new Error('Error al copiar el archivo');
    }
  }

  // Mover archivo (copiar y eliminar original)
  static async moveFile(
    sourceBucket: string, 
    sourcePath: string, 
    destBucket: string, 
    destPath: string
  ): Promise<void> {
    try {
      await this.copyFile(sourceBucket, sourcePath, destBucket, destPath);
      await this.deleteFile(sourceBucket, sourcePath);
    } catch (error) {
      console.error('Error moving file:', error);
      throw new Error('Error al mover el archivo');
    }
  }

  // Obtener metadatos del archivo
  static async getFileMetadata(bucket: string, path: string): Promise<any> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'));

      if (error) throw error;

      const file = data?.find(item => item.name === path.split('/').pop());
      return file;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error('Error al obtener metadatos del archivo');
    }
  }

  // Limpiar archivos temporales antiguos (más de 24 horas)
  static async cleanupTempFiles(): Promise<void> {
    try {
      const { data, error } = await supabase.storage
        .from(this.TEMP_BUCKET)
        .list();

      if (error) throw error;

      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      const oldFiles = data?.filter(item => {
        const timestamp = parseInt(item.name.split('_')[1]);
        return timestamp < oneDayAgo;
      });

      if (oldFiles && oldFiles.length > 0) {
        const paths = oldFiles.map(item => item.name);
        await this.deleteFile(this.TEMP_BUCKET, paths.join(','));
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  // Validar tipo de archivo
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  // Validar tamaño de archivo
  static validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  // Generar nombre único para archivo
  static generateUniqueFileName(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const baseName = originalName.split('.').slice(0, -1).join('.');
    return `${userId}_${baseName}_${timestamp}.${extension}`;
  }

  // Obtener extensión del archivo
  static getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  // Verificar si es imagen
  static isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  // Verificar si es documento
  static isDocument(file: File): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];
    return documentTypes.includes(file.type);
  }

  // Verificar si es código
  static isCode(file: File): boolean {
    const codeExtensions = [
      'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'sass',
      'php', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'swift',
      'kt', 'dart', 'r', 'sql', 'sh', 'bash', 'ps1', 'bat'
    ];
    const extension = this.getFileExtension(file.name);
    return codeExtensions.includes(extension);
  }

  // Formatear tamaño de archivo
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Crear bucket si no existe
  static async createBucketIfNotExists(bucketName: string, isPublic: boolean = false): Promise<void> {
    try {
      // Nota: La creación de buckets requiere permisos de administrador
      // En producción, los buckets deben crearse manualmente en el dashboard de Supabase
      // console.log(`Bucket ${bucketName} debe existir en Supabase. Verificando acceso...`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list();

      if (error) {
        console.warn(`Bucket ${bucketName} no existe o no tienes acceso. Contacta al administrador.`);
      }
    } catch (error) {
      console.error(`Error verificando bucket ${bucketName}:`, error);
    }
  }

  // Inicializar buckets necesarios
  static async initializeBuckets(): Promise<void> {
    try {
      await this.createBucketIfNotExists(this.DEFAULT_BUCKET, true);
      await this.createBucketIfNotExists(this.AVATARS_BUCKET, true);
      await this.createBucketIfNotExists(this.TEMP_BUCKET, false);
    } catch (error) {
      console.error('Error initializing buckets:', error);
    }
  }
}

// Exportar instancia única
export const storageService = new StorageService();

// Inicializar buckets al importar
StorageService.initializeBuckets();
