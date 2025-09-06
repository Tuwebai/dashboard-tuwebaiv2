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
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import websyAvatar from '@/assets/websyavatar.png';
import websyAvatarDark from '@/assets/websyparamodooscuro.png';

interface MessageBubbleProps {
  message: ChatMessage;
  onCopy?: (text: string) => void;
  onDownload?: (attachment: any) => void;
  isNewMessage?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onCopy,
  onDownload,
  isNewMessage = false
}) => {
  const { user } = useApp();
  const { theme } = useTheme();
  const isAI = message.isAI;
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
    <div className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}>
      {isAI && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={websyAvatarSrc} alt="Websy AI" />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
            WA
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col max-w-[80%] ${isAI ? 'items-start' : 'items-end'}`}>
        {/* Vista previa de archivos adjuntos - Arriba del mensaje */}
        {renderAttachments()}
        
        <Card className={`${
          isAI 
            ? 'bg-muted/50 border-muted-foreground/20' 
            : 'bg-primary text-primary-foreground border-primary/20'
        }`}>
          <CardContent className="p-3">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {isAI && showTypewriter ? (
                <TypewriterText 
                  text={message.message} 
                  speed={1}
                  onComplete={() => setShowTypewriter(false)}
                />
              ) : (
                <FormattedMessage content={message.message} />
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{timestamp}</span>
          {isAI && (
            <Badge variant="secondary" className="text-xs">
              Websy AI
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
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
