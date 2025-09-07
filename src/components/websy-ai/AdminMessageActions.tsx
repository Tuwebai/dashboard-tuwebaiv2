import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminMessageActionsProps {
  message: string;
  onEdit?: (newMessage: string) => void;
  onStartEdit?: () => void;
  className?: string;
}

export const AdminMessageActions: React.FC<AdminMessageActionsProps> = ({
  message,
  onEdit,
  onStartEdit,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Mensaje copiado al portapapeles');
    } catch (error) {
      console.error('Error al copiar:', error);
      toast.error('Error al copiar el mensaje');
    }
  };

  const handleEdit = () => {
    if (onStartEdit) {
      onStartEdit();
    } else {
      setIsEditing(true);
      setEditText(message);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message) {
      onEdit?.(editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(message);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-background border border-border rounded-lg p-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[80px] p-0 border-none resize-none focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
            placeholder="Edita tu mensaje..."
            autoFocus
          />
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelEdit}
            className="bg-background hover:bg-muted"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSaveEdit}
            disabled={!editText.trim() || editText === message}
            className="bg-primary hover:bg-primary/90"
          >
            Enviar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`touch:-me-2 touch:-ms-3.5 -ms-2.5 -me-1 flex flex-wrap items-center gap-y-4 p-1 select-none focus-within:transition-none hover:transition-none duration-300 group-hover/turn-messages:delay-300 pointer-events-none opacity-0 motion-safe:transition-opacity group-hover/turn-messages:pointer-events-auto group-hover/turn-messages:opacity-100 group-focus-within/turn-messages:pointer-events-auto group-focus-within/turn-messages:opacity-100 has-data-[state=open]:pointer-events-auto has-data-[state=open]:opacity-100 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="text-token-text-secondary hover:bg-token-bg-secondary rounded-lg h-8 w-8 p-0"
        aria-label="Copiar"
      >
        <Copy className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEdit}
        className="text-token-text-secondary hover:bg-token-bg-secondary rounded-lg h-8 w-8 p-0"
        aria-label="Editar mensaje"
      >
        <Edit3 className="h-4 w-4" />
      </Button>
    </div>
  );
};
