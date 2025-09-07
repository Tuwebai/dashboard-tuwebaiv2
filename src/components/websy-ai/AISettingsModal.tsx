import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAISettings, AISettings } from '@/hooks/useAISettings';
import { Loader2, Save, RotateCcw, Info, User, Brain, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { UserProfilePanel } from './UserProfilePanel';
import { ConversationMemories } from './ConversationMemories';

interface AISettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  open,
  onOpenChange
}) => {
  const {
    settings,
    loading,
    error,
    saveSettings,
    resetSettings,
    updateSetting
  } = useAISettings();

  const [localSettings, setLocalSettings] = React.useState<AISettings>(settings);
  const [saving, setSaving] = React.useState(false);

  // Sincronizar settings locales cuando cambien los settings del hook
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(localSettings);
      toast({
        title: "Configuración guardada",
        description: "Las configuraciones de AI se han actualizado correctamente"
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings();
      toast({
        title: "Configuración reseteada",
        description: "Se han restaurado las configuraciones por defecto"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo resetear la configuración",
        variant: "destructive"
      });
    }
  };

  const updateLocalSetting = <K extends keyof AISettings>(
    key: K,
    value: AISettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando configuración...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Websy AI
          </DialogTitle>
          <DialogDescription>
            Personaliza el comportamiento, memoria y respuestas de Websy AI
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Memoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
          {/* Configuración de Respuesta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Configuración de Respuesta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">
                  Creatividad (Temperatura): {localSettings.temperature}
                </Label>
                <Slider
                  id="temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[localSettings.temperature]}
                  onValueChange={([value]) => updateLocalSetting('temperature', value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Más preciso</span>
                  <span>Más creativo</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">
                  Longitud máxima de respuesta: {localSettings.maxTokens} tokens
                </Label>
                <Slider
                  id="maxTokens"
                  min={100}
                  max={4096}
                  step={100}
                  value={[localSettings.maxTokens]}
                  onValueChange={([value]) => updateLocalSetting('maxTokens', value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Respuestas cortas</span>
                  <span>Respuestas largas</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responseStyle">Estilo de respuesta</Label>
                <Select
                  value={localSettings.responseStyle}
                  onValueChange={(value: 'concise' | 'detailed' | 'balanced') => 
                    updateLocalSetting('responseStyle', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concisa</SelectItem>
                    <SelectItem value="balanced">Equilibrada</SelectItem>
                    <SelectItem value="detailed">Detallada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Funcionalidades */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Funcionalidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Análisis de contexto</Label>
                  <p className="text-xs text-muted-foreground">
                    Permite a Websy AI acceder a datos de proyectos y usuarios
                  </p>
                </div>
                <Switch
                  checked={localSettings.enableContextAnalysis}
                  onCheckedChange={(checked) => updateLocalSetting('enableContextAnalysis', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Análisis predictivo</Label>
                  <p className="text-xs text-muted-foreground">
                    Habilita predicciones y análisis de tendencias
                  </p>
                </div>
                <Switch
                  checked={localSettings.enablePredictiveAnalysis}
                  onCheckedChange={(checked) => updateLocalSetting('enablePredictiveAnalysis', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reportes automáticos</Label>
                  <p className="text-xs text-muted-foreground">
                    Genera reportes automáticamente cuando sea apropiado
                  </p>
                </div>
                <Switch
                  checked={localSettings.enableAutoReports}
                  onCheckedChange={(checked) => updateLocalSetting('enableAutoReports', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones</Label>
                  <p className="text-xs text-muted-foreground">
                    Recibe notificaciones de insights importantes
                  </p>
                </div>
                <Switch
                  checked={localSettings.enableNotifications}
                  onCheckedChange={(checked) => updateLocalSetting('enableNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuración Avanzada */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Configuración Avanzada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select
                  value={localSettings.language}
                  onValueChange={(value: 'es' | 'en') => 
                    updateLocalSetting('language', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxHistoryLength">
                  Historial máximo: {localSettings.maxHistoryLength} mensajes
                </Label>
                <Slider
                  id="maxHistoryLength"
                  min={10}
                  max={100}
                  step={10}
                  value={[localSettings.maxHistoryLength]}
                  onValueChange={([value]) => updateLocalSetting('maxHistoryLength', value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Menos memoria</span>
                  <span>Más contexto</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Guardado automático</Label>
                  <p className="text-xs text-muted-foreground">
                    Guarda automáticamente los cambios en la configuración
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoSave}
                  onCheckedChange={(checked) => updateLocalSetting('autoSave', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetear
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar
              </Button>
            </div>
          </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <UserProfilePanel />
          </TabsContent>

          <TabsContent value="memory" className="space-y-6">
            <ConversationMemories />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
