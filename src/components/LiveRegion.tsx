import React, { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
  autoClear?: boolean;
  clearDelay?: number;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'polite',
  className = '',
  autoClear = true,
  clearDelay = 3000
}) => {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && regionRef.current) {
      // Anunciar el mensaje a lectores de pantalla
      regionRef.current.textContent = message;
      
      // Limpiar automáticamente si está habilitado
      if (autoClear) {
        const timer = setTimeout(() => {
          if (regionRef.current) {
            regionRef.current.textContent = '';
          }
        }, clearDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [message, priority, autoClear, clearDelay]);

  if (!message) return null;

  return (
    <div
      ref={regionRef}
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
      role="status"
      aria-label={`Región de anuncios: ${message}`}
    />
  );
};

// Hook para usar LiveRegion
export const useLiveRegion = () => {
  const [message, setMessage] = React.useState('');
  const [priority, setPriority] = React.useState<'polite' | 'assertive'>('polite');

  const announce = React.useCallback((msg: string, pri: 'polite' | 'assertive' = 'polite') => {
    setPriority(pri);
    setMessage(msg);
  }, []);

  const clear = React.useCallback(() => {
    setMessage('');
  }, []);

  return {
    message,
    priority,
    announce,
    clear
  };
};

export default LiveRegion;
