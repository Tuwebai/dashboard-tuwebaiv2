import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3 justify-start">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src="/websy-ai-avatar.png" alt="Websy AI" />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
          WA
        </AvatarFallback>
      </Avatar>
      
      <Card className="bg-muted/50 border-muted-foreground/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
            </div>
            <span className="text-sm text-muted-foreground ml-2">
              Websy AI está escribiendo...
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
