import React, { useState, useEffect } from 'react';
import { FormattedMessage } from './FormattedMessage';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  onProgress?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 1,
  className = '',
  onComplete,
  onProgress
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        // Llamar al callback de progreso para activar scroll
        onProgress?.();
      }, speed);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, isComplete, onComplete, onProgress]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return (
    <div className={`${className} ${!isComplete ? 'opacity-90' : 'opacity-100'}`}>
      <FormattedMessage content={displayedText} />
      {!isComplete && (
        <span className="animate-pulse text-primary ml-1">|</span>
      )}
    </div>
  );
};
