import { supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class StorageService {
  private static readonly BUCKET_NAME = 'project-files';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff'
  ];

  /**
   * Sube una imagen al storage de Supabase
   */
  static async uploadImage(
    file: File, 
    projectId: string,
    userId: string
  ): Promise<UploadResult> {
    try {
      // Validar el archivo
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Generar nombre único para el archivo
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${projectId}-${Date.now()}.${fileExtension}`;
      const filePath = `development-images/${userId}/${fileName}`;

      // Subir el archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading to Supabase Storage:', error);
        return {
          success: false,
          error: `Error al subir la imagen: ${error.message}`
        };
      }

      // Obtener la URL pública de la imagen
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl
      };

    } catch (error: any) {
      console.error('Error in uploadImage:', error);
      return {
        success: false,
        error: `Error inesperado: ${error.message}`
      };
    }
  }

  /**
   * Elimina una imagen del storage
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extraer el path del archivo de la URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf(this.BUCKET_NAME);
      
      if (bucketIndex === -1) {
        console.error('No se pudo extraer el path del archivo');
        return false;
      }

      const filePath = pathParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteImage:', error);
      return false;
    }
  }

  /**
   * Valida el archivo antes de subirlo
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    // Verificar tamaño
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `El archivo es demasiado grande. Máximo permitido: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    // Verificar tipo de archivo
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Tipos permitidos: ${this.ALLOWED_TYPES.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Crea el bucket si no existe (solo para administradores)
   */
  static async ensureBucketExists(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.getBucket(this.BUCKET_NAME);
      
      if (error && error.message.includes('not found')) {
        // Crear el bucket
        const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: this.ALLOWED_TYPES,
          fileSizeLimit: this.MAX_FILE_SIZE
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      return false;
    }
  }
}