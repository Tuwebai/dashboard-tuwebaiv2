import React from 'react';

export const ThinkingIndicator: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Indicador de pensamiento */}
      <div className="flex items-center gap-2 text-muted-foreground py-2">
        <span className="text-sm font-medium">Pensando</span>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
