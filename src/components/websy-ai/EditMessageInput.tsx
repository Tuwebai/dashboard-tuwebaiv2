import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface EditMessageInputProps {
  message: string;
  onSave: (newMessage: string) => void;
  onCancel: () => void;
  className?: string;
}

export const EditMessageInput: React.FC<EditMessageInputProps> = ({
  message,
  onSave,
  onCancel,
  className = ''
}) => {
  const [editText, setEditText] = useState(message);

  useEffect(() => {
    setEditText(message);
  }, [message]);

  const handleSave = () => {
    if (editText.trim() && editText !== message) {
      onSave(editText.trim());
    }
  };

  const handleCancel = () => {
    setEditText(message);
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[60px] p-0 border-none resize-none focus:outline-none bg-transparent text-primary-foreground placeholder:text-primary-foreground/70 pr-32"
          placeholder="Edita tu mensaje..."
          autoFocus
        />
        <div className="absolute bottom-0 right-0 flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="bg-background/90 hover:bg-background text-foreground h-6 px-2 text-xs"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!editText.trim() || editText === message}
            className="bg-background/90 hover:bg-background text-foreground h-6 px-2 text-xs"
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
};
