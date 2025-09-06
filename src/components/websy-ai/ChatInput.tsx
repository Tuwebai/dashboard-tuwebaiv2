import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  Image, 
  FileText, 
  X,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
  data?: string; // Base64 para imágenes
  content?: string; // Contenido de texto para archivos
  mimeType?: string; // Tipo MIME del archivo
}

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Escribe tu mensaje a Websy AI...",
  maxLength = 4000
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!message.trim() && attachments.length === 0) return;
    if (disabled) return;

    onSendMessage(message.trim(), attachments);
    setMessage('');
    setAttachments([]);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, attachments, onSendMessage, disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const newAttachments: Attachment[] = [];
    
    for (const file of Array.from(files)) {
      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} es demasiado grande. Máximo 10MB.`,
          variant: "destructive"
        });
        continue;
      }

      // Validar tipo de archivo
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no soportado",
          description: `${file.name} no es un tipo de archivo soportado.`,
          variant: "destructive"
        });
        continue;
      }

      try {
        let data = null;
        let content = null;

        if (file.type.startsWith('image/')) {
          // Convertir imagen a base64
          data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Remover el prefijo data:image/...;base64,
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } else {
          // Leer archivo de texto
          content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
          });
        }

        newAttachments.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          size: file.size,
          file,
          data,
          content,
          mimeType: file.type
        });
      } catch (error) {
        toast({
          title: "Error procesando archivo",
          description: `No se pudo procesar ${file.name}.`,
          variant: "destructive"
        });
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="relative">
      {/* Vista previa de archivos adjuntos - Posicionada absolutamente arriba */}
      {attachments.length > 0 && (
        <div className="absolute -top-20 left-0 right-0 flex flex-wrap gap-2 z-10">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="relative group">
              {attachment.type === 'image' && attachment.file && (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(attachment.file)}
                    alt={attachment.name}
                    className="w-16 h-16 object-cover rounded-lg border border-border/50 bg-background shadow-lg"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(attachment.id)}
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {attachment.type === 'file' && (
                <div className="relative">
                  <div className="w-16 h-16 bg-muted rounded-lg border border-border/50 flex items-center justify-center bg-background shadow-lg">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(attachment.id)}
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input Area - Estilo ChatGPT */}
      <div className={`relative transition-all duration-200 ${
        isDragging ? 'scale-[1.02]' : ''
      }`}>
        <div className="relative flex items-end gap-2 p-3 bg-muted/30 rounded-2xl border border-border/50 hover:border-border focus-within:border-primary/50 focus-within:bg-muted/50 transition-all duration-200">
          {/* Botón de adjuntar archivos */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
            title="Adjuntar archivo"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Textarea principal */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder={attachments.length > 0 ? "Escribe un mensaje..." : placeholder}
              disabled={disabled}
              maxLength={maxLength}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base placeholder:text-muted-foreground"
            />
            
            {/* Contador de caracteres */}
            <div className="absolute bottom-1 right-1 text-xs text-muted-foreground/70">
              {message.length}/{maxLength}
            </div>
          </div>
          
          {/* Botón de enviar */}
          <Button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && attachments.length === 0)}
            className={`h-8 w-8 p-0 rounded-full transition-all duration-200 ${
              (!message.trim() && attachments.length === 0) || disabled
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
            }`}
            title="Enviar mensaje"
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
