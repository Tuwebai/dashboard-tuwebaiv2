import React from 'react';

interface FormattedMessageProps {
  content: string;
  className?: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ 
  content, 
  className = '' 
}) => {
  // Función para dividir el texto en párrafos y procesar cada uno
  const formatText = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = () => {
      if (currentList.length > 0) {
        const ListComponent = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListComponent key={elements.length} className="list-disc list-inside mb-4 space-y-2 ml-4">
            {currentList.map((item, index) => (
              <li key={index} className="text-foreground dark:text-slate-200 leading-relaxed">{formatInlineText(item)}</li>
            ))}
          </ListComponent>
        );
        currentList = [];
        listType = null;
      }
    };

    const processLine = (line: string) => {
      const trimmed = line.trim();
      
      // Títulos
      if (trimmed.startsWith('### ')) {
        flushList();
        return <h3 key={elements.length} className="text-lg font-semibold mb-3 mt-5 text-foreground dark:text-slate-100 border-l-4 border-primary pl-3">{trimmed.slice(4)}</h3>;
      }
      if (trimmed.startsWith('## ')) {
        flushList();
        return <h2 key={elements.length} className="text-xl font-bold mb-4 mt-6 text-foreground dark:text-slate-100 border-b border-border pb-2">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith('# ')) {
        flushList();
        return <h1 key={elements.length} className="text-2xl font-bold mb-5 mt-7 text-foreground dark:text-slate-100 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">{trimmed.slice(2)}</h1>;
      }
      
      // Listas
      if (trimmed.startsWith('- ')) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        currentList.push(trimmed.slice(2));
        return null;
      }
      if (/^\d+\. /.test(trimmed)) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        currentList.push(trimmed.replace(/^\d+\. /, ''));
        return null;
      }
      
      // Código en bloque
      if (trimmed.startsWith('```')) {
        flushList();
        return <div key={elements.length} className="bg-muted dark:bg-slate-800 p-4 rounded-lg overflow-x-auto mb-4 border border-border/50"><code className="text-sm font-mono text-foreground dark:text-slate-200">{trimmed.slice(3)}</code></div>;
      }
      
      // Párrafo normal
      if (trimmed) {
        flushList();
        return <p key={elements.length} className="mb-3 text-foreground dark:text-slate-200 leading-relaxed">{formatInlineText(trimmed)}</p>;
      }
      
      return null;
    };

    const formatInlineText = (text: string) => {
      // Convertir **texto** a <strong>texto</strong>
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground dark:text-slate-100">$1</strong>');
      
      // Convertir *texto* a <em>texto</em>
      text = text.replace(/\*(.*?)\*/g, '<em class="italic text-foreground dark:text-slate-200">$1</em>');
      
      // Convertir `código` a <code>código</code>
      text = text.replace(/`(.*?)`/g, '<code class="bg-muted dark:bg-slate-700 px-2 py-1 rounded text-sm font-mono text-foreground dark:text-slate-200 border border-border/50">$1</code>');
      
      // Convertir URLs a enlaces
      text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary/80 underline decoration-primary/50 hover:decoration-primary transition-colors">$1</a>');
      
      return <span dangerouslySetInnerHTML={{ __html: text }} />;
    };

    lines.forEach(line => {
      const element = processLine(line);
      if (element) {
        elements.push(element);
      }
    });

    flushList();

    return elements;
  };

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-li:text-foreground ${className}`}>
      {formatText(content)}
    </div>
  );
};
