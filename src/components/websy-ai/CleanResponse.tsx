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
          <FormattedMessage content={streamingText} />
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
