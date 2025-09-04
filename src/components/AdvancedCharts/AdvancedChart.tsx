import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Download, 
  Eye, 
  EyeOff, 
  Palette, 
  BarChart3, 
  LineChart, 
    PieChart,
  AreaChart,
  Radar,
  TrendingUp,
  RefreshCw,
  Maximize2,
  Minimize2,
  Save,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';

export interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar' | 'heatmap' | 'funnel';
  data: any[];
  options: any;
  theme: 'light' | 'dark' | 'auto';
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  showTooltip: boolean;
  showDataLabels: boolean;
  animation: boolean;
  responsive: boolean;
  height: number;
  width: number;
  refreshInterval?: number;
  customOptions?: any;
}

interface AdvancedChartProps {
  config: ChartConfig;
  onConfigChange?: (config: ChartConfig) => void;
  onExport?: (format: string) => void;
  className?: string;
  loading?: boolean;
}

const CHART_TYPES = [
  { value: 'line', label: 'Línea', icon: LineChart },
  { value: 'bar', label: 'Barras', icon: BarChart3 },
  { value: 'pie', label: 'Circular', icon: PieChart },
  { value: 'area', label: 'Área', icon: AreaChart },
  { value: 'scatter', label: 'Dispersión', icon: BarChart3 },
  { value: 'radar', label: 'Radar', icon: Radar },
  { value: 'heatmap', label: 'Mapa de Calor', icon: TrendingUp },
  { value: 'funnel', label: 'Embudo', icon: TrendingUp }
];

const THEMES = [
  { value: 'light', label: 'Claro' }
  // Eliminado dark y auto - solo modo claro
];

const DEFAULT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
];

export default function AdvancedChart({ 
  config, 
  onConfigChange, 
  onExport, 
  className = '',
  loading = false 
}: AdvancedChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<ChartConfig>(config);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleConfigChange = useCallback((updates: Partial<ChartConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onConfigChange?.(newConfig);
  }, [localConfig, onConfigChange]);

  const getChartOptions = useCallback(() => {
    // Validar y limpiar datos antes de crear las opciones
    const validData = localConfig.data.filter(item => 
      item && typeof item.value === 'number' && !isNaN(item.value) && isFinite(item.value)
    );

    if (validData.length === 0) {
      return {
        title: { text: 'Sin datos disponibles' },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: { text: 'No hay datos para mostrar', fontSize: 16, fill: '#999' }
        }
      };
    }

    const baseOptions = {
      title: {
        text: localConfig.title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        show: localConfig.showTooltip,
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        textStyle: {
          color: '#fff'
        }
      },
      legend: {
        show: localConfig.showLegend,
        bottom: 10,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        show: localConfig.showGrid,
        left: '3%',
        right: '4%',
        bottom: localConfig.showLegend ? '15%' : '10%',
        containLabel: true
      },
      animation: localConfig.animation,
      color: localConfig.colors,
      ...localConfig.customOptions
    };

    // Configuraciones específicas por tipo de gráfico
    switch (localConfig.type) {
      case 'line':
        return {
          ...baseOptions,
          xAxis: {
            type: 'category',
            data: localConfig.data.map((item, index) => item.name || item.x || index),
            axisLine: { show: true },
            axisTick: { show: true }
          },
          yAxis: {
            type: 'value',
            axisLine: { show: true },
            axisTick: { show: true }
          },
          series: [{
            type: 'line',
            data: localConfig.data.map(item => item.value || item.y),
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { width: 3 },
            itemStyle: { borderWidth: 2 }
          }]
        };

      case 'bar':
        return {
          ...baseOptions,
          xAxis: {
            type: 'category',
            data: localConfig.data.map((item, index) => item.name || item.x || index),
            axisLine: { show: true },
            axisTick: { show: true }
          },
          yAxis: {
            type: 'value',
            axisLine: { show: true },
            axisTick: { show: true }
          },
          series: [{
            type: 'bar',
            data: localConfig.data.map(item => item.value || item.y),
            barWidth: '60%',
            itemStyle: {
              borderRadius: [4, 4, 0, 0]
            }
          }]
        };

      case 'pie':
        return {
          ...baseOptions,
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            data: localConfig.data.map(item => ({
              name: item.name || item.label,
              value: item.value
            })),
            label: {
              show: localConfig.showDataLabels,
              formatter: '{b}: {c} ({d}%)'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        };

      case 'area':
        return {
          ...baseOptions,
          xAxis: {
            type: 'category',
            data: localConfig.data.map((item, index) => item.name || item.x || index),
            axisLine: { show: true },
            axisTick: { show: true }
          },
          yAxis: {
            type: 'value',
            axisLine: { show: true },
            axisTick: { show: true }
          },
          series: [{
            type: 'line',
            data: localConfig.data.map(item => item.value || item.y),
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            areaStyle: {
              opacity: 0.6
            },
            lineStyle: { width: 3 }
          }]
        };

      case 'scatter':
        return {
          ...baseOptions,
          xAxis: {
            type: 'value',
            axisLine: { show: true },
            axisTick: { show: true }
          },
          yAxis: {
            type: 'value',
            axisLine: { show: true },
            axisTick: { show: true }
          },
          series: [{
            type: 'scatter',
            data: localConfig.data.map(item => [item.x, item.y]),
            symbolSize: 8,
            itemStyle: {
              opacity: 0.8
            }
          }]
        };

      case 'radar':
        // Validar y normalizar datos para el gráfico radar
        const radarData = validData.map(item => ({
          name: item.name || item.label || 'Métrica',
          value: Math.max(0, Math.min(item.value, item.max || 100)),
          max: item.max || 100
        }));

        // Asegurar que todos los indicadores tengan la misma escala máxima
        const maxValue = Math.max(...radarData.map(item => item.max));
        const normalizedData = radarData.map(item => ({
          ...item,
          max: maxValue
        }));

        return {
          ...baseOptions,
          radar: {
            indicator: normalizedData.map(item => ({
              name: item.name,
              max: item.max
            })),
            radius: '60%',
            center: ['50%', '50%'],
            splitNumber: 5,
            axisName: {
              color: '#666',
              fontSize: 12
            },
            splitLine: {
              lineStyle: {
                color: ['#ddd']
              }
            },
            splitArea: {
              show: false
            }
          },
          series: [{
            type: 'radar',
            data: [{
              value: normalizedData.map(item => item.value),
              name: localConfig.title
            }],
            areaStyle: {
              opacity: 0.3
            }
          }]
        };

      default:
        return baseOptions;
    }
  }, [localConfig]);

  const handleExport = (format: string) => {
    if (chartRef.current) {
      const chart = chartRef.current.getEchartsInstance();
      const url = chart.getDataURL({
        type: format,
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      
      const link = document.createElement('a');
      link.download = `${localConfig.title}.${format}`;
      link.href = url;
      link.click();
    }
    onExport?.(format);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetToDefaults = () => {
    const defaultConfig: ChartConfig = {
      ...config,
      colors: DEFAULT_COLORS,
      showLegend: true,
      showGrid: true,
      showTooltip: true,
      showDataLabels: false,
      animation: true,
      responsive: true,
      height: 400,
      width: 600
    };
    handleConfigChange(defaultConfig);
    toast({
      title: "Configuración restablecida",
      description: "Se han aplicado los valores por defecto",
    });
  };

  if (loading) {
    return (
      <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando gráfico...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3 }}
      className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      <Card className={`h-full ${isFullscreen ? 'rounded-none' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {localConfig.title}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {CHART_TYPES.find(t => t.value === localConfig.type)?.label}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                                 <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="chart-settings-description">
                   <DialogHeader>
                     <DialogTitle>Personalizar Gráfico</DialogTitle>
                     <DialogDescription id="chart-settings-description">
                       Configura la apariencia y opciones del gráfico
                     </DialogDescription>
                   </DialogHeader>
                  
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="general">General</TabsTrigger>
                      <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="chartTitle">Título del Gráfico</Label>
                          <Input
                            id="chartTitle"
                            value={localConfig.title}
                            onChange={(e) => handleConfigChange({ title: e.target.value })}
                            placeholder="Ingresa el título"
                          />
                        </div>
                        <div>
                          <Label htmlFor="chartType">Tipo de Gráfico</Label>
                          <Select
                            value={localConfig.type}
                            onValueChange={(value: any) => handleConfigChange({ type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CHART_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center space-x-2">
                                    <type.icon className="h-4 w-4" />
                                    <span>{type.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="chartHeight">Altura (px)</Label>
                          <Input
                            id="chartHeight"
                            type="number"
                            value={localConfig.height}
                            onChange={(e) => handleConfigChange({ height: parseInt(e.target.value) })}
                            min="200"
                            max="1000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="chartWidth">Ancho (px)</Label>
                          <Input
                            id="chartWidth"
                            type="number"
                            value={localConfig.width}
                            onChange={(e) => handleConfigChange({ width: parseInt(e.target.value) })}
                            min="300"
                            max="1200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="animation"
                            checked={localConfig.animation}
                            onCheckedChange={(checked) => handleConfigChange({ animation: checked })}
                          />
                          <Label htmlFor="animation">Animaciones</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="responsive"
                            checked={localConfig.responsive}
                            onCheckedChange={(checked) => handleConfigChange({ responsive: checked })}
                          />
                          <Label htmlFor="responsive">Responsive</Label>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="apariencia" className="space-y-4">
                      <div>
                        <Label htmlFor="theme">Tema</Label>
                        <Select
                          value={localConfig.theme}
                          onValueChange={(value: any) => handleConfigChange({ theme: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {THEMES.map(theme => (
                              <SelectItem key={theme.value} value={theme.value}>
                                {theme.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showLegend"
                            checked={localConfig.showLegend}
                            onCheckedChange={(checked) => handleConfigChange({ showLegend: checked })}
                          />
                          <Label htmlFor="showLegend">Mostrar Leyenda</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showGrid"
                            checked={localConfig.showGrid}
                            onCheckedChange={(checked) => handleConfigChange({ showGrid: checked })}
                          />
                          <Label htmlFor="showGrid">Mostrar Cuadrícula</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showTooltip"
                            checked={localConfig.showTooltip}
                            onCheckedChange={(checked) => handleConfigChange({ showTooltip: checked })}
                          />
                          <Label htmlFor="showTooltip">Mostrar Tooltip</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showDataLabels"
                            checked={localConfig.showDataLabels}
                            onCheckedChange={(checked) => handleConfigChange({ showDataLabels: checked })}
                          />
                          <Label htmlFor="showDataLabels">Mostrar Etiquetas</Label>
                        </div>
                      </div>

                      <div>
                        <Label>Colores Personalizados</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {localConfig.colors.map((color, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={color}
                                onChange={(e) => {
                                  const newColors = [...localConfig.colors];
                                  newColors[index] = e.target.value;
                                  handleConfigChange({ colors: newColors });
                                }}
                                className="w-12 h-8 p-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newColors = localConfig.colors.filter((_, i) => i !== index);
                                  handleConfigChange({ colors: newColors });
                                }}
                                className="h-6 w-6 p-0 text-red-500"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newColors = [...localConfig.colors, '#000000'];
                              handleConfigChange({ colors: newColors });
                            }}
                            className="h-8 w-8 p-0"
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-4 border-t">
                        <Button onClick={resetToDefaults} variant="outline">
                          Restablecer Valores
                        </Button>
                        <Button 
                          onClick={() => setShowSettings(false)}
                          className="ml-auto"
                        >
                          Aplicar Cambios
                        </Button>
                      </div>
                    </TabsContent>

                  </Tabs>
                </DialogContent>
              </Dialog>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleExport('png')}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div 
            className="w-full"
            style={{ 
              height: `${localConfig.height}px`,
              width: localConfig.responsive ? '100%' : `${localConfig.width}px`
            }}
          >
            {(() => {
              try {
                const options = getChartOptions();
                return (
                  <ReactECharts
                    ref={chartRef}
                    option={options}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                    theme={localConfig.theme === 'auto' ? undefined : localConfig.theme}
                    onEvents={{
                      click: (params) => {

                      }
                    }}
                    onChartReady={(chart) => {
                      // Configurar manejo de errores del gráfico
                      chart.on('error', (params) => {
                        console.warn('ECharts error:', params);
                      });
                    }}
                    notMerge={true}
                    lazyUpdate={true}
                  />
                );
              } catch (error) {
                console.error('Error rendering chart:', error);
                return (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Error al renderizar el gráfico</p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
