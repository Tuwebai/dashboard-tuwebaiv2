import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Loader2,
  PlusCircle,
  Mic
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
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

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

  // Verificar soporte y permisos de micrófono
  const checkMicrophoneSupport = useCallback(async () => {
    if (typeof window === 'undefined') return false;
    
    // Verificar soporte de Speech Recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return false;
    }

    // Verificar si estamos en HTTPS o localhost
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      toast({
        title: "HTTPS requerido",
        description: "El reconocimiento de voz requiere HTTPS. Usa localhost o despliega en HTTPS.",
        variant: "destructive"
      });
      return false;
    }

    // Verificar permisos de micrófono
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (permission.state === 'denied') {
        toast({
          title: "Micrófono bloqueado",
          description: "El acceso al micrófono está bloqueado. Permite el acceso en la configuración del navegador.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      // Si no se puede verificar permisos, continuar
      console.log('No se pudo verificar permisos de micrófono:', error);
    }

    return true;
  }, []);

  // Inicializar reconocimiento de voz
  useEffect(() => {
    const initVoiceRecognition = async () => {
      const isSupported = await checkMicrophoneSupport();
      
      if (isSupported) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = 'es-ES';

          recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setMessage(prev => prev + (prev ? ' ' : '') + transcript);
            toast({
              title: "Audio transcrito",
              description: "El audio se ha convertido a texto correctamente."
            });
          };

          recognitionRef.current.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current.onerror = (event: any) => {
            console.error('Error en reconocimiento de voz:', event.error);
            setIsListening(false);
            
            let errorMessage = "Error desconocido en el reconocimiento de voz.";
            
            switch (event.error) {
              case 'not-allowed':
                errorMessage = "No tienes micrófono o los permisos están bloqueados. Verifica que tengas un micrófono conectado y permite el acceso en el navegador.";
                break;
              case 'no-speech':
                errorMessage = "No se detectó audio. Asegúrate de hablar cerca del micrófono.";
                break;
              case 'audio-capture':
                errorMessage = "No se pudo acceder al micrófono. Verifica que esté conectado y funcionando.";
                break;
              case 'network':
                errorMessage = "Error de red. Verifica tu conexión a internet.";
                break;
              default:
                errorMessage = `Error: ${event.error}. Inténtalo de nuevo.`;
            }
            
            toast({
              title: "Error de reconocimiento",
              description: errorMessage,
              variant: "destructive"
            });
          };

          setIsVoiceSupported(true);
        }
      } else {
        setIsVoiceSupported(false);
      }
    };

    initVoiceRecognition();
  }, [checkMicrophoneSupport]);

  // Limpiar reconocimiento al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Solicitar permisos de micrófono
  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Detener el stream inmediatamente, solo necesitamos el permiso
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Error solicitando permisos de micrófono:', error);
      return false;
    }
  }, []);

  // Manejar inicio/parada de grabación
  const handleVoiceToggle = useCallback(async () => {
    if (!isVoiceSupported) {
      toast({
        title: "Reconocimiento de voz no disponible",
        description: "Tu navegador no soporta reconocimiento de voz o no tienes micrófono.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      // Solicitar permisos antes de iniciar
      const hasPermission = await requestMicrophonePermission();
      
      if (!hasPermission) {
        toast({
          title: "Permisos de micrófono requeridos",
          description: "Necesitas permitir el acceso al micrófono. Haz clic en el ícono de micrófono en la barra de direcciones y selecciona 'Permitir'.",
          variant: "destructive"
        });
        return;
      }

      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast({
          title: "Escuchando...",
          description: "Habla ahora. El audio se transcribirá a texto."
        });
      } catch (error) {
        console.error('Error iniciando reconocimiento:', error);
        toast({
          title: "Error",
          description: "No se pudo iniciar el reconocimiento de voz. Verifica que tengas un micrófono conectado.",
          variant: "destructive"
        });
      }
    }
  }, [isListening, isVoiceSupported, requestMicrophonePermission]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Input Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Vista previa de archivos adjuntos */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 px-2 max-w-3xl w-full">
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

        {/* Indicador de grabación */}
        {isListening && (
          <div className="flex items-center gap-2 mb-3 px-2 max-w-3xl w-full">
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                Escuchando... Habla ahora
              </span>
            </div>
          </div>
        )}

        <div className="w-full max-w-3xl">
          <div className="relative flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-3xl px-4 py-2 shadow-lg">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full flex-shrink-0 focus:outline-none focus:ring-0 focus:ring-offset-0"
              title="Adjuntar archivo"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onBlur={(e) => e.target.blur()}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
            
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
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              placeholder={attachments.length > 0 ? "Escribe un mensaje..." : placeholder}
              disabled={disabled}
              maxLength={maxLength}
              className="flex-1 min-h-[32px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-gray-500 dark:placeholder:text-slate-400 text-gray-900 dark:text-slate-100"
            />
            
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleVoiceToggle}
                disabled={!isVoiceSupported || disabled}
                className={`h-8 w-8 p-0 rounded-full transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 ${
                  isListening 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                } ${!isVoiceSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isListening ? "Detener grabación" : "Iniciar dictado por voz"}
                onMouseDown={(e) => e.preventDefault()}
                onBlur={(e) => e.target.blur()}
              >
                <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
              </Button>
              
              <Button
                type="button"
                size="sm"
                onClick={handleSend}
                disabled={disabled || (!message.trim() && attachments.length === 0)}
                className="h-8 w-8 p-0 bg-gray-900 dark:bg-slate-100 hover:bg-gray-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-full disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-0 focus:ring-offset-0"
                onMouseDown={(e) => e.preventDefault()}
                onBlur={(e) => e.target.blur()}
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
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      <div className="text-gray-500 dark:text-slate-400 text-center text-xs py-3 px-4">
        Websy AI puede cometer errores. Considera verificar la información importante.
      </div>
    </div>
  );
};
