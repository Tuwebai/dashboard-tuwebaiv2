import React from 'react';
import { FormattedMessage } from './FormattedMessage';
import { MessageActions } from './MessageActions';

interface CleanResponseProps {
  content: string;
  isStreaming?: boolean;
  streamingText?: string;
  onRetry?: () => void;
}

export const CleanResponse: React.FC<CleanResponseProps> = ({
  content,
  isStreaming = false,
  streamingText,
  onRetry
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Contenido de la respuesta */}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {isStreaming && streamingText ? (
          <div className="relative">
            <FormattedMessage content={streamingText} />
            <div className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />
          </div>
        ) : (
          <FormattedMessage content={content} />
        )}
      </div>
      
      {/* Botones de acción siempre visibles */}
      <div className="mt-4">
        <MessageActions
          message={content}
          onCopy={() => navigator.clipboard.writeText(content)}
          onRetry={onRetry}
          className="opacity-100"
        />
      </div>
    </div>
  );
};
