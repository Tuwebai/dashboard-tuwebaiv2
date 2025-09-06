import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  MessageSquare, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';

interface Ticket {
  id: string;
  title: string;
  description?: string;
  priority?: number;
  urgency?: string;
  status?: string;
  createdAt: string;
  customer?: {
    name?: string;
    email?: string;
    tier?: string;
  };
  category?: string;
  tags?: string[];
}

interface TicketAnalysisProps {
  tickets: Ticket[];
  onUpdateTicket?: (ticketId: string, updates: any) => void;
}

export const TicketAnalysis: React.FC<TicketAnalysisProps> = ({
  tickets = [],
  onUpdateTicket
}) => {
  const [analyzedTickets, setAnalyzedTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [suggestedResponse, setSuggestedResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { analyzeTicketUrgency, isAnalyzing: isAIAnalyzing } = useAdvancedAI();

  // Analizar urgencia de tickets
  useEffect(() => {
    const analyzeTickets = async () => {
      if (!tickets || tickets.length === 0) {
        setAnalyzedTickets([]);
        return;
      }
      
      setIsAnalyzing(true);
      const analyses = [];
      
      for (const ticket of tickets.slice(-10)) { // Últimos 10 tickets
        if (!ticket) continue;
        try {
          const analysis = await analyzeTicketUrgency(ticket.description || ticket.title || 'Sin contenido');
          analyses.push({
            ...ticket,
            aiAnalysis: analysis
          });
        } catch (error) {
          console.error('Error analizando ticket:', error);
          analyses.push({
            ...ticket,
            aiAnalysis: {
              urgency: 'low',
              priority: 5,
              suggestedResponse: 'Gracias por contactarnos. Revisaremos tu consulta.'
            }
          });
        }
      }
      
      setAnalyzedTickets(analyses);
      setIsAnalyzing(false);
    };

    analyzeTickets();
  }, [tickets, analyzeTicketUrgency]);

  const getUrgencyColor = (urgency?: string) => {
    if (!urgency) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    switch (urgency.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      default: return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    }
  };

  const getPriorityColor = (priority?: number) => {
    if (!priority || priority < 0) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    if (priority >= 8) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
    if (priority >= 6) return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';
    if (priority >= 4) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return <MessageSquare className="h-4 w-4 text-gray-500" />;
    switch (status.toLowerCase()) {
      case 'open': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in_progress': return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleApplySuggestion = (ticketId: string) => {
    if (onUpdateTicket && suggestedResponse) {
      onUpdateTicket(ticketId, {
        suggestedResponse,
        aiAnalyzed: true
      });
      setSuggestedResponse('');
      setSelectedTicket(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Lista de Tickets Analizados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análisis Inteligente de Tickets
            {isAnalyzing && <Activity className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Analizando {tickets.length} tickets reales de la base de datos
          </p>
        </CardHeader>
        <CardContent>
          {analyzedTickets && analyzedTickets.length > 0 ? (
            <div className="space-y-4">
              {analyzedTickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setSuggestedResponse(ticket.aiAnalysis?.suggestedResponse || '');
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status || 'unknown')}
                      <h4 className="font-medium">{ticket.title || 'Sin título'}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getUrgencyColor(ticket.aiAnalysis?.urgency || 'low')}>
                        {ticket.aiAnalysis?.urgency?.toUpperCase() || 'LOW'}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.aiAnalysis?.priority || 5)}>
                        P{ticket.aiAnalysis?.priority || 5}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.customer?.name || 'Usuario desconocido'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {ticket.customer?.tier || 'Standard'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.description || 'Sin descripción'}
                    </p>
                    
                    {ticket.tags && ticket.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ticket.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {isAnalyzing ? (
                <div>
                  <Activity className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p>Analizando tickets...</p>
                </div>
              ) : (
                <div>
                  <p>No hay tickets para analizar</p>
                  <p className="text-sm mt-2">
                    Los tickets aparecerán aquí cuando se creen en el sistema.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel de Respuesta Sugerida */}
      {selectedTicket && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Respuesta Sugerida por IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">{selectedTicket.title || 'Sin título'}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedTicket.description || 'Sin descripción'}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <Badge className={getUrgencyColor(selectedTicket.aiAnalysis?.urgency || 'low')}>
                    {selectedTicket.aiAnalysis?.urgency?.toUpperCase() || 'LOW'}
                  </Badge>
                  <Badge className={getPriorityColor(selectedTicket.aiAnalysis?.priority || 5)}>
                    Prioridad: {selectedTicket.aiAnalysis?.priority || 5}/10
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Respuesta Sugerida:
                </label>
                <Textarea
                  value={suggestedResponse}
                  onChange={(e) => setSuggestedResponse(e.target.value)}
                  placeholder="La IA generará una respuesta sugerida..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => handleApplySuggestion(selectedTicket.id)}
                  disabled={!suggestedResponse.trim()}
                  size="sm"
                >
                  Aplicar Sugerencia
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTicket(null)}
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
