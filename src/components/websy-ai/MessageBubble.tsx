import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Download, FileText, Image, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChatMessage } from '@/hooks/useChatHistory';
import { TypewriterText } from './TypewriterText';
import { FormattedMessage } from './FormattedMessage';
import { MessageActions } from './MessageActions';
import { AdminMessageActions } from './AdminMessageActions';
import { EditMessageInput } from './EditMessageInput';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import websyAvatar from '@/assets/websyavatar.png';
import websyAvatarDark from '@/assets/websyparamodooscuro.png';

interface MessageBubbleProps {
  message: ChatMessage;
  onCopy?: (text: string) => void;
  onDownload?: (attachment: any) => void;
  onRetry?: () => void;
  onEditMessage?: (messageId: string, newMessage: string) => void;
  onStartEdit?: (messageId: string) => void;
  onCancelEdit?: () => void;
  isEditing?: boolean;
  isNewMessage?: boolean;
  onTypewriterProgress?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onCopy,
  onDownload,
  onRetry,
  onEditMessage,
  onStartEdit,
  onCancelEdit,
  isEditing = false,
  isNewMessage = false,
  onTypewriterProgress
}) => {
  const [localEditText, setLocalEditText] = useState(message.message);
  const { user } = useApp();
  const { theme } = useTheme();

  // Actualizar el texto local cuando cambie el mensaje
  useEffect(() => {
    setLocalEditText(message.message);
  }, [message.message]);
  const isAI = message.isAI;
  const isAdmin = user?.email === 'tuwebai@gmail.com';
  const [showTypewriter, setShowTypewriter] = useState(false);
  
  // Seleccionar avatar según el tema
  const websyAvatarSrc = theme === 'dark' ? websyAvatarDark : websyAvatar;
  const timestamp = formatDistanceToNow(message.timestamp, { 
    addSuffix: true, 
    locale: es 
  });

  // Mostrar efecto de escritura solo para mensajes de IA nuevos
  useEffect(() => {
    if (isAI && isNewMessage) {
      setShowTypewriter(true);
    }
  }, [isAI, isNewMessage]);

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.message);
    } else {
      navigator.clipboard.writeText(message.message);
    }
  };

  const handleEditMessage = (newMessage: string) => {
    if (onEditMessage) {
      onEditMessage(message.id, newMessage);
    }
  };

  const handleStartEdit = () => {
    if (onStartEdit) {
      onStartEdit(message.id);
    }
  };

  const handleCancelEdit = () => {
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="mb-2 space-y-2">
        {message.attachments.map((attachment, index) => (
          <div key={index} className="space-y-1">
            {attachment.type === 'image' ? (
              <div className="relative group">
                {attachment.file && attachment.file instanceof File ? (
                  <img
                    src={URL.createObjectURL(attachment.file)}
                    alt={attachment.name}
                    className="max-w-xs rounded-lg border border-border/50 shadow-sm"
                  />
                ) : attachment.data ? (
                  <img
                    src={`data:image/${attachment.mimeType?.split('/')[1] || 'jpeg'};base64,${attachment.data}`}
                    alt={attachment.name}
                    className="max-w-xs rounded-lg border border-border/50 shadow-sm"
                  />
                ) : null}
                <div className="mt-1 text-xs text-muted-foreground">
                  {attachment.name}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground flex-1 truncate">
                  {attachment.name}
                </span>
                {onDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(attachment)}
                    className="h-6 w-6 p-0"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };


  return (
    <div className={`flex gap-3 group ${isAI ? 'justify-start' : 'justify-end'}`}>
      {isAI && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={websyAvatarSrc} alt="Websy AI" />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
            WA
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col ${isAI ? 'items-start' : 'items-end'} group/turn-messages`}>
        {/* Vista previa de archivos adjuntos - Arriba del mensaje */}
        {renderAttachments()}
        
        {/* Burbuja de mensaje estilo ChatGPT */}
        <div className={`relative chatgpt-message-bubble ${
          isAI 
            ? 'chatgpt-ai-bubble' 
            : 'chatgpt-user-bubble'
        }`} data-multiline={message.message.includes('\n')}>
          <div className="whitespace-pre-wrap">
            {!isAI && isAdmin && isEditing ? (
              <div className="relative">
                <textarea
                  value={localEditText}
                  onChange={(e) => setLocalEditText(e.target.value)}
                  className="w-full min-h-[60px] p-0 border-none resize-none focus:outline-none bg-transparent text-primary-foreground placeholder:text-primary-foreground/70 pr-32"
                  placeholder="Edita tu mensaje..."
                  autoFocus
                />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <button
                    onClick={handleCancelEdit}
                    className="bg-white/90 hover:bg-white text-gray-800 h-6 px-2 text-xs rounded border border-gray-300 shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleEditMessage(message.id, localEditText)}
                    className="bg-white/90 hover:bg-white text-gray-800 h-6 px-2 text-xs rounded border border-gray-300 shadow-sm"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            ) : isAI && showTypewriter ? (
              <TypewriterText 
                text={message.message} 
                speed={1}
                onComplete={() => setShowTypewriter(false)}
                onProgress={onTypewriterProgress}
              />
            ) : (
              <FormattedMessage content={message.message} />
            )}
          </div>
        </div>
        
        
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{timestamp}</span>
          </div>
          
          {isAI && (
            <MessageActions
              message={message.message}
              onCopy={() => onCopy?.(message.message)}
              onRetry={onRetry}
              className="ml-2"
            />
          )}
        </div>
        
         {/* Botones de acción para el admin - Abajo del mensaje - Solo cuando NO está editando */}
         {!isAI && isAdmin && !isEditing && (
           <AdminMessageActions
             message={message.message}
             onStartEdit={handleStartEdit}
             className="mt-2"
           />
         )}
      </div>
      
      {!isAI && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage 
            src={user?.avatar_url || user?.avatar} 
            alt={user?.name || 'Usuario'} 
          />
          <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
