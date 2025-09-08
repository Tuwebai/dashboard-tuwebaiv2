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
  Mic,
  Plus,
  Volume2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CalendarScheduler } from './CalendarScheduler';
import { EmailReporter } from './EmailReporter';
import { useAdminIntegrations } from '@/hooks/useAdminIntegrations';
import { useApp } from '@/contexts/AppContext';

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
  const [showCalendar, setShowCalendar] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const { user } = useApp();
  const { scheduleMeeting, sendReport, isReady } = useAdminIntegrations();

  // Manejar comando de calendario automáticamente
  const handleCalendarCommand = useCallback(async (message: string) => {
    // NO interceptar - dejar que el AI maneje los comandos de calendario
    // Solo enviar el mensaje al AI para que lo procese correctamente
    onSendMessage(message.trim(), []);
    setMessage('');
  }, [onSendMessage]);

  // Manejar comando de email automáticamente
  const handleEmailCommand = useCallback(async (message: string) => {
    // NO interceptar - dejar que el AI maneje los comandos de email
    // Solo enviar el mensaje al AI para que lo procese correctamente
    onSendMessage(message.trim(), []);
    setMessage('');
  }, [onSendMessage]);

  const handleSend = useCallback(() => {
    if (!message.trim() && attachments.length === 0) return;
    if (disabled) return;

    // Enviar mensaje directamente al AI - NO interceptar comandos
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
          <div 
            className="bg-token-bg-primary cursor-text overflow-clip bg-clip-padding p-2.5 contain-inline-size dark:bg-[#303030] grid grid-cols-[auto_1fr_auto] [grid-template-areas:'header_header_header'_'leading_primary_trailing'_'._footer_.'] group-data-expanded/composer:[grid-template-areas:'header_header_header'_'primary_primary_primary'_'leading_footer_trailing'] shadow-short"
            style={{borderRadius: '28px'}}
          >
            <div className="[grid-area:leading]">
              <span className="flex" data-state="closed">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="composer-btn"
                  data-testid="composer-plus-btn"
                  disabled={disabled}
                  onMouseDown={(e) => e.preventDefault()}
                  onBlur={(e) => e.target.blur()}
                  style={{ width: '36px', height: '36px' }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="icon">
                    <path d="M9.33496 16.5V10.665H3.5C3.13273 10.665 2.83496 10.3673 2.83496 10C2.83496 9.63273 3.13273 9.33496 3.5 9.33496H9.33496V3.5C9.33496 3.13273 9.63273 2.83496 10 2.83496C10.3673 2.83496 10.665 3.13273 10.665 3.5V9.33496H16.5L16.6338 9.34863C16.9369 9.41057 17.165 9.67857 17.165 10C17.165 10.3214 16.9369 10.5894 16.6338 10.6514L16.5 10.665H10.665V16.5C10.665 16.8673 10.3673 17.165 10 17.165C9.63273 17.165 9.33496 16.8673 9.33496 16.5Z"></path>
                  </svg>
                </button>
              </span>
            </div>
            
            <div className="-my-2.5 flex min-h-14 items-start overflow-x-hidden px-1.5 [grid-area:primary] group-data-expanded/composer:mb-0 group-data-expanded/composer:px-2.5">
              <div className="_prosemirror-parent_ebv8s_2 text-token-text-primary max-h-[max(35svh,5rem)] max-h-52 flex-1 overflow-auto [scrollbar-width:thin] default-browser vertical-scroll-fade-mask flex items-start">
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
                  placeholder={attachments.length > 0 ? "Escribe un mensaje..." : "Pregunta lo que quieras"}
                  disabled={disabled}
                  maxLength={maxLength}
                  className="chatgpt-input w-full min-h-[32px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base text-white"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 [grid-area:trailing]">
              <div className="ms-auto flex items-center gap-1.5">
                <span className="" data-state="closed">
                  <button 
                    aria-label="Botón de dictado" 
                    type="button" 
                    className="composer-btn"
                    onClick={handleVoiceToggle}
                    disabled={!isVoiceSupported || disabled}
                    onMouseDown={(e) => e.preventDefault()}
                    onBlur={(e) => e.target.blur()}
                    style={{ width: '36px', height: '36px' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="" className="icon">
                      <path d="M15.7806 10.1963C16.1326 10.3011 16.3336 10.6714 16.2288 11.0234L16.1487 11.2725C15.3429 13.6262 13.2236 15.3697 10.6644 15.6299L10.6653 16.835H12.0833L12.2171 16.8486C12.5202 16.9106 12.7484 17.1786 12.7484 17.5C12.7484 17.8214 12.5202 18.0894 12.2171 18.1514L12.0833 18.165H7.91632C7.5492 18.1649 7.25128 17.8672 7.25128 17.5C7.25128 17.1328 7.5492 16.8351 7.91632 16.835H9.33527L9.33429 15.6299C6.775 15.3697 4.6558 13.6262 3.84992 11.2725L3.76984 11.0234L3.74445 10.8906C3.71751 10.5825 3.91011 10.2879 4.21808 10.1963C4.52615 10.1047 4.84769 10.2466 4.99347 10.5195L5.04523 10.6436L5.10871 10.8418C5.8047 12.8745 7.73211 14.335 9.99933 14.335C12.3396 14.3349 14.3179 12.7789 14.9534 10.6436L15.0052 10.5195C15.151 10.2466 15.4725 10.1046 15.7806 10.1963ZM12.2513 5.41699C12.2513 4.17354 11.2437 3.16521 10.0003 3.16504C8.75675 3.16504 7.74835 4.17343 7.74835 5.41699V9.16699C7.74853 10.4104 8.75685 11.418 10.0003 11.418C11.2436 11.4178 12.2511 10.4103 12.2513 9.16699V5.41699ZM13.5814 9.16699C13.5812 11.1448 11.9781 12.7479 10.0003 12.748C8.02232 12.748 6.41845 11.1449 6.41828 9.16699V5.41699C6.41828 3.43889 8.02221 1.83496 10.0003 1.83496C11.9783 1.83514 13.5814 3.439 13.5814 5.41699V9.16699Z"></path>
                    </svg>
                  </button>
                </span>
                <button 
                  id="composer-submit-button" 
                  aria-label="Enviar indicación" 
                  data-testid="send-button" 
                  className="composer-submit-btn composer-submit-button-color h-9 w-9"
                  onClick={handleSend}
                  disabled={disabled || (!message.trim() && attachments.length === 0)}
                  onMouseDown={(e) => e.preventDefault()}
                  onBlur={(e) => e.target.blur()}
                >
                  {disabled ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="icon">
                      <path d="M8.99992 16V6.41407L5.70696 9.70704C5.31643 10.0976 4.68342 10.0976 4.29289 9.70704C3.90237 9.31652 3.90237 8.6835 4.29289 8.29298L9.29289 3.29298L9.36907 3.22462C9.76184 2.90427 10.3408 2.92686 10.707 3.29298L15.707 8.29298L15.7753 8.36915C16.0957 8.76192 16.0731 9.34092 15.707 9.70704C15.3408 10.0732 14.7618 10.0958 14.3691 9.7754L14.2929 9.70704L10.9999 6.41407V16C10.9999 16.5523 10.5522 17 9.99992 17C9.44764 17 8.99992 16.5523 8.99992 16Z"></path>
                    </svg>
                  )}
                </button>
              </div>
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

      {/* Modal de Calendario */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CalendarScheduler
              onEventCreated={(event) => {
                setShowCalendar(false);
                toast({
                  title: "Evento creado",
                  description: `"${event.title}" se ha programado exitosamente.`
                });
              }}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de Email */}
      {showEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <EmailReporter
              onEmailSent={(recipients) => {
                setShowEmail(false);
                toast({
                  title: "Reporte enviado",
                  description: `Reporte enviado a ${recipients.length} destinatario(s).`
                });
              }}
              onClose={() => setShowEmail(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
