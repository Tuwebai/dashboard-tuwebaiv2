import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, RotateCcw } from 'lucide-react';

interface MessageActionsProps {
  message: string;
  onCopy?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  onCopy,
  onRetry,
  className = ''
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    onCopy?.();
  };

  return (
    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
        title="Copiar mensaje"
      >
        <Copy className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onRetry}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
        title="Reintentar respuesta"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};
