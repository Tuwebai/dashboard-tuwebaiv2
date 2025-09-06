import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Users, 
  Clock,
  Activity,
  Zap,
  Shield,
  Target
} from 'lucide-react';
import { useAdvancedAI, SentimentAnalysis, PatternPrediction, ProactiveSuggestion } from '@/hooks/useAdvancedAI';

interface AdvancedAIPanelProps {
  recentMessages?: any[];
  systemMetrics?: any;
  userBehavior?: any[];
}

export const AdvancedAIPanel: React.FC<AdvancedAIPanelProps> = ({
  recentMessages = [],
  systemMetrics = {},
  userBehavior = []
}) => {
  const [sentimentData, setSentimentData] = useState<SentimentAnalysis[]>([]);
  const [patternData, setPatternData] = useState<PatternPrediction | null>(null);
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    analyzeSentiment,
    predictPatterns,
    generateProactiveSuggestions,
    isAnalyzing
  } = useAdvancedAI();

  // Analizar sentimientos de mensajes recientes
  useEffect(() => {
    const analyzeRecentMessages = async () => {
      if (recentMessages.length === 0) return;
      
      setIsLoading(true);
      const analyses = [];
      
      for (const message of recentMessages.slice(-5)) { // Últimos 5 mensajes
        try {
          const analysis = await analyzeSentiment(message.content, message.context);
          analyses.push(analysis);
        } catch (error) {
          console.error('Error analizando mensaje:', error);
        }
      }
      
      setSentimentData(analyses);
      setIsLoading(false);
    };

    analyzeRecentMessages();
  }, [recentMessages, analyzeSentiment]);

  // Predecir patrones
  useEffect(() => {
    const predictPatternsData = async () => {
      if (recentMessages.length === 0) return;
      
      const prediction = await predictPatterns(recentMessages, 'Análisis de patrones recientes');
      setPatternData(prediction);
    };

    predictPatternsData();
  }, [recentMessages, predictPatterns]);

  // Generar sugerencias proactivas
  useEffect(() => {
    const generateSuggestions = async () => {
      const newSuggestions = await generateProactiveSuggestions(systemMetrics, userBehavior);
      setSuggestions(newSuggestions);
    };

    generateSuggestions();
  }, [systemMetrics, userBehavior, generateProactiveSuggestions]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'negative': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      default: return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      default: return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Análisis de Sentimientos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análisis de Sentimientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Activity className="h-6 w-6 animate-spin mr-2" />
              <span>Analizando mensajes...</span>
            </div>
          ) : sentimentData.length > 0 ? (
            <div className="space-y-4">
              {sentimentData.map((analysis, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getSentimentColor(analysis.sentiment)}>
                      {analysis.sentiment.toUpperCase()}
                    </Badge>
                    <Badge className={getUrgencyColor(analysis.urgency)}>
                      {analysis.urgency.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Confianza:</span>
                      <Progress value={analysis.confidence * 100} className="flex-1" />
                      <span className="text-sm text-muted-foreground">
                        {Math.round(analysis.confidence * 100)}%
                      </span>
                    </div>
                    {analysis.emotions.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Emociones detectadas:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysis.emotions.map((emotion, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {emotion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.suggestedActions.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Acciones sugeridas:</span>
                        <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                          {analysis.suggestedActions.map((action, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-500">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay mensajes recientes para analizar
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predicción de Patrones */}
      {patternData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Predicción de Patrones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Nivel de Riesgo:</span>
                <Badge className={getUrgencyColor(patternData.riskLevel)}>
                  {patternData.riskLevel.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Confianza:</span>
                <Progress value={patternData.confidence * 100} className="flex-1" />
                <span className="text-sm text-muted-foreground">
                  {Math.round(patternData.confidence * 100)}%
                </span>
              </div>

              {patternData.predictedIssues.length > 0 && (
                <div>
                  <span className="font-medium mb-2 block">Problemas Predichos:</span>
                  <div className="space-y-2">
                    {patternData.predictedIssues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {patternData.recommendations.length > 0 && (
                <div>
                  <span className="font-medium mb-2 block">Recomendaciones:</span>
                  <div className="space-y-2">
                    {patternData.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sugerencias Proactivas */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Sugerencias Proactivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {suggestion.type === 'optimization' && <Target className="h-4 w-4 text-blue-500" />}
                      {suggestion.type === 'prevention' && <Shield className="h-4 w-4 text-green-500" />}
                      {suggestion.type === 'improvement' && <Users className="h-4 w-4 text-purple-500" />}
                      <h4 className="font-medium">{suggestion.title}</h4>
                    </div>
                    <Badge className={getPriorityColor(suggestion.priority)}>
                      {suggestion.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Impacto estimado: {suggestion.estimatedImpact}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
