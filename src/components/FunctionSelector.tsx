import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Phone, 
  Image, 
  Star, 
  ShoppingCart, 
  FileText, 
  MapPin,
  Mail,
  Calendar,
  Users,
  BarChart,
  Search,
  Lock,
  CreditCard,
  Globe,
  Zap,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import ProductsGridBlock from '@/components/blocks/ProductsGridBlock';
import SliderBlock from '@/components/blocks/SliderBlock';
import MultiStepFormBlock from '@/components/blocks/MultiStepFormBlock';
import TestimonialsBlock from '@/components/blocks/TestimonialsBlock';
import FAQBlock from '@/components/blocks/FAQBlock';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const availableFunctionalities = [
  {
    id: 'contact-form',
    name: 'Formulario de contacto',
    description: 'Formulario para que los usuarios se pongan en contacto',
    icon: MessageCircle,
    category: 'Comunicación',
    thumbnail: 'https://assets.tuweb.ai/previews/contact-form.png',
  },
  {
    id: 'whatsapp',
    name: 'Integración con WhatsApp',
    description: 'Botón de WhatsApp para contacto directo',
    icon: Phone,
    category: 'Comunicación',
    thumbnail: 'https://assets.tuweb.ai/previews/whatsapp.png',
  },
  {
    id: 'gallery',
    name: 'Galería de imágenes',
    description: 'Galería responsive para mostrar fotos',
    icon: Image,
    category: 'Contenido',
    thumbnail: 'https://assets.tuweb.ai/previews/gallery.png',
  },
  {
    id: 'testimonials',
    name: 'Sección de testimonios',
    description: 'Mostrar reseñas y testimonios de clientes',
    icon: Star,
    category: 'Social',
    thumbnail: 'https://assets.tuweb.ai/previews/testimonials.png',
  },
  {
    id: 'ecommerce',
    name: 'Ecommerce básico',
    description: 'Sistema de tienda online con carrito',
    icon: ShoppingCart,
    category: 'Ventas',
    thumbnail: 'https://assets.tuweb.ai/previews/ecommerce.png',
  },
  {
    id: 'blog',
    name: 'Blog',
    description: 'Sistema de blog con artículos',
    icon: FileText,
    category: 'Contenido',
    thumbnail: 'https://assets.tuweb.ai/previews/blog.png',
  },
  {
    id: 'maps',
    name: 'Mapa con ubicación',
    description: 'Mapa interactivo con tu ubicación',
    icon: MapPin,
    category: 'Ubicación',
    thumbnail: 'https://assets.tuweb.ai/previews/maps.png',
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Suscripción a boletín de noticias',
    icon: Mail,
    category: 'Marketing',
    thumbnail: 'https://assets.tuweb.ai/previews/newsletter.png',
  },
  {
    id: 'booking',
    name: 'Sistema de reservas',
    description: 'Calendario para reservar citas',
    icon: Calendar,
    category: 'Servicios',
    thumbnail: 'https://assets.tuweb.ai/previews/booking.png',
  },
  {
    id: 'team',
    name: 'Sección de equipo',
    description: 'Mostrar miembros del equipo',
    icon: Users,
    category: 'Contenido',
    thumbnail: 'https://assets.tuweb.ai/previews/team.png',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Integración con Google Analytics',
    icon: BarChart,
    category: 'Análisis',
    thumbnail: '',
  },
  {
    id: 'search',
    name: 'Búsqueda',
    description: 'Sistema de búsqueda interno',
    icon: Search,
    category: 'Funcionalidad',
    thumbnail: '',
  },
  {
    id: 'auth',
    name: 'Autenticación',
    description: 'Login y registro de usuarios',
    icon: Lock,
    category: 'Seguridad',
    thumbnail: '',
  },
  {
    id: 'payments',
    name: 'Pagos online',
    description: 'Integración con pasarelas de pago',
    icon: CreditCard,
    category: 'Ventas',
    thumbnail: '',
  },
  {
    id: 'multilang',
    name: 'Multi-idioma',
    description: 'Soporte para múltiples idiomas',
    icon: Globe,
    category: 'Funcionalidad',
    thumbnail: '',
  },
  {
    id: 'api',
    name: 'API Rest',
    description: 'API para integraciones externas',
    icon: Zap,
    category: 'Desarrollo',
    thumbnail: '',
  },
];

const categories = Array.from(new Set(availableFunctionalities.map(f => f.category)));

const categoryColors: Record<string, string> = {
  'Comunicación': 'bg-blue-500/10 text-blue-400',
  'Contenido': 'bg-green-500/10 text-green-400',
  'Social': 'bg-purple-500/10 text-purple-400',
  'Ventas': 'bg-orange-500/10 text-orange-400',
  'Ubicación': 'bg-red-500/10 text-red-400',
  'Marketing': 'bg-pink-500/10 text-pink-400',
  'Servicios': 'bg-indigo-500/10 text-indigo-400',
  'Análisis': 'bg-yellow-500/10 text-yellow-400',
  'Funcionalidad': 'bg-cyan-500/10 text-cyan-400',
  'Seguridad': 'bg-emerald-500/10 text-emerald-400',
  'Desarrollo': 'bg-violet-500/10 text-violet-400'
};

// Mapeo de funcionalidad a componente de preview
const previewComponents: Record<string, React.ReactNode> = {
  'Ecommerce básico': <ProductsGridBlock products={[]} columns={3} color="#6366f1" />,
  'Galería de imágenes': <SliderBlock slides={[]} color="#6366f1" />,
  'Formulario de contacto': <MultiStepFormBlock steps={undefined} color="#6366f1" />,
  'Sección de testimonios': <TestimonialsBlock testimonials={undefined} color="#6366f1" />,
  'FAQ': <FAQBlock faqs={undefined} color="#6366f1" />,
};

interface FunctionSelectorProps {
  selectedFunctions: string[];
  onSelectionChange: (functions: string[]) => void;
  projectType?: string;
}

export default function FunctionSelector({ 
  selectedFunctions, 
  onSelectionChange, 
  projectType 
}: FunctionSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // Estado para edición inline y modal de configuración
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [configIdx, setConfigIdx] = useState<number | null>(null);
  const [inlineEdits, setInlineEdits] = useState<Record<number, any>>({});
  const [fullscreenIdx, setFullscreenIdx] = useState<number | null>(null);

  // Estado de cada funcionalidad: activo, pendiente, etc
  const getFuncStatus = (idx: number) => {
    const edits = inlineEdits[idx] || {};
    // Ejemplo: si falta algún campo requerido, está pendiente
    if (selectedFunctions[idx] && (edits.title === '' || edits.description === '')) {
      return 'pendiente';
    }
    return 'activo';
  };

  // Eliminar funcionalidad
  const handleRemove = (idx: number) => {
    const updated = selectedFunctions.filter((_, i) => i !== idx);
    onSelectionChange(updated);
  };

  // Activar/desactivar (simulado, alterna estado)
  const [activeStates, setActiveStates] = useState<Record<number, boolean>>({});
  const handleToggleActive = (idx: number) => {
    setActiveStates((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Drag & drop: reordenar funcionalidades seleccionadas
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(selectedFunctions);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    onSelectionChange(reordered);
  };

  // Edición inline: guardar cambios
  const handleInlineEdit = (idx: number, field: string, value: string) => {
    setInlineEdits((prev) => ({ ...prev, [idx]: { ...prev[idx], [field]: value } }));
  };

  // Configuración rápida: guardar cambios (simulado)
  const handleConfigSave = (idx: number, config: any) => {
    setInlineEdits((prev) => ({ ...prev, [idx]: { ...prev[idx], ...config } }));
    setConfigIdx(null);
  };

  const filteredFunctions = selectedCategory
    ? availableFunctionalities.filter(f => f.category === selectedCategory)
    : availableFunctionalities;

  const handleFunctionToggle = (functionId: string) => {
    const isSelected = selectedFunctions.includes(functionId);
    if (isSelected) {
      onSelectionChange(selectedFunctions.filter(id => id !== functionId));
    } else {
      onSelectionChange([...selectedFunctions, functionId]);
    }
  };

  const getFunctionByName = (name: string) => {
    return availableFunctionalities.find(f => f.name === name);
  };

  return (
    <div className="space-y-6">
      {/* Resumen visual de funcionalidades activas */}
      {selectedFunctions.length > 0 && (
        <div className="mb-6 w-full flex flex-wrap gap-3 items-center justify-start">
          {selectedFunctions.map((funcName, idx) => {
            const func = getFunctionByName(funcName);
            const status = getFuncStatus(idx);
            const isActive = activeStates[idx] !== false;
            return (
              <div key={funcName} className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm bg-background/80 min-w-[180px] max-w-xs transition-all ${isActive ? 'border-primary/40' : 'border-muted bg-muted/40 opacity-60'}`}>
                <div className={`p-1 rounded ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                  {func?.icon && <func.icon className="h-5 w-5 text-primary" />}
                </div>
                <span className="font-medium text-sm truncate max-w-[80px]">{inlineEdits[idx]?.title ?? func?.name}</span>
                {status === 'activo' ? (
                  <><span className="sr-only">Activo</span><CheckCircle className="h-4 w-4 text-emerald-500" /></>
                ) : (
                  <><span className="sr-only">Pendiente de configurar</span><AlertCircle className="h-4 w-4 text-yellow-500" /></>
                )}
                <button onClick={() => handleToggleActive(idx)} title={isActive ? 'Desactivar' : 'Activar'} className="ml-1">
                  {isActive ? <Eye className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4 text-muted-foreground opacity-40" />}
                </button>
                <button onClick={() => setEditingIdx(idx)} title="Editar" className="ml-1">
                  <Edit className="h-4 w-4 text-blue-500" />
                </button>
                <button onClick={() => setConfigIdx(idx)} title="Configurar" className="ml-1">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                </button>
                <button onClick={() => handleRemove(idx)} title="Eliminar" className="ml-1">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
                <button onClick={() => setFullscreenIdx(fullscreenIdx === idx ? null : idx)} title="Vista previa ampliada" className="ml-1">
                  {fullscreenIdx === idx ? <Minimize2 className="h-4 w-4 text-purple-500" /> : <Maximize2 className="h-4 w-4 text-purple-500" />}
                </button>
                <button onClick={() => window.open(func?.thumbnail || '', '_blank')} title="Abrir en nueva pestaña" className="ml-1">
                  <Eye className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {/* Vista previa ampliada (pantalla completa) */}
      {fullscreenIdx !== null && selectedFunctions[fullscreenIdx] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative bg-background rounded-xl shadow-2xl p-6 max-w-2xl w-full flex flex-col items-center">
            <button className="absolute top-4 right-4" onClick={() => setFullscreenIdx(null)}>
              <Minimize2 className="h-6 w-6 text-primary" />
            </button>
            <div className="w-full flex flex-col items-center">
              {(() => {
                const func = getFunctionByName(selectedFunctions[fullscreenIdx]);
                if (func?.thumbnail) {
                  return <img src={func.thumbnail} alt={func.name} className="w-full max-w-xl h-auto rounded-xl border shadow-lg" />;
                }
                if (previewComponents[func?.name || '']) {
                  return <div className="w-full max-w-xl h-96 flex items-center justify-center bg-muted/30 rounded-xl overflow-hidden">{previewComponents[func?.name || '']}</div>;
                }
                return <div className="w-full h-96 flex items-center justify-center text-muted-foreground">Sin preview visual</div>;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Selected functions summary */}
      {selectedFunctions.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Funcionalidades seleccionadas</CardTitle>
            <CardDescription>
              {selectedFunctions.length} funcionalidades añadidas a tu proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="selected-functions" direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-wrap gap-4 min-h-[120px]"
                  >
                    {selectedFunctions.map((funcName, idx) => {
                      const func = getFunctionByName(funcName);
                      const isEditing = editingIdx === idx;
                      const edits = inlineEdits[idx] || {};
                      return (
                        <Draggable key={funcName} draggableId={funcName} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex flex-col items-center gap-2 p-2 bg-background rounded-lg border border-primary/20 shadow-md w-full md:w-64 max-w-xs min-h-[240px] overflow-hidden transition-transform duration-200 ${snapshot.isDragging ? 'scale-105 shadow-xl z-10 border-primary bg-primary/10' : ''}`}
                              style={{ ...provided.draggableProps.style }}
                            >
                              <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">{func?.name || funcName}</Badge>
                              <div className="w-full h-40 flex items-center justify-center bg-muted/30 rounded-xl overflow-hidden mb-2">
                                {func?.thumbnail ? (
                                  <img
                                    src={func.thumbnail}
                                    alt={func.name}
                                    className="w-full max-w-[220px] h-32 object-contain rounded-xl bg-white/80 border border-muted shadow-md mx-auto"
                                    loading="lazy"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setEditingIdx(isEditing ? null : idx)}
                                  />
                                ) : previewComponents[func?.name || ''] ? (
                                  <div className="w-full max-w-xs h-32 flex items-center justify-center bg-muted/30 rounded-xl overflow-hidden scale-95 opacity-90 hover:scale-100 hover:opacity-100 transition-all duration-300">
                                    {previewComponents[func?.name || '']}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center w-full h-32">
                                    {func?.icon && <func.icon className="h-12 w-12 text-muted-foreground mb-2" />}
                                    <span className="text-xs text-muted-foreground">Sin preview visual</span>
                                  </div>
                                )}
                              </div>
                              {/* Edición inline de título y descripción */}
                              {isEditing ? (
                                <>
                                  <input
                                    className="w-full mb-1 p-1 rounded border border-muted text-sm"
                                    value={edits.title ?? func?.name ?? ''}
                                    onChange={e => handleInlineEdit(idx, 'title', e.target.value)}
                                    placeholder="Título"
                                  />
                                  <textarea
                                    className="w-full mb-1 p-1 rounded border border-muted text-xs"
                                    value={edits.description ?? func?.description ?? ''}
                                    onChange={e => handleInlineEdit(idx, 'description', e.target.value)}
                                    placeholder="Descripción"
                                  />
                                  <Button size="sm" className="w-full mt-1" onClick={() => setEditingIdx(null)}>
                                    Guardar
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <div className="w-full text-center font-semibold text-base truncate">
                                    {edits.title ?? func?.name}
                                  </div>
                                  <div className="w-full text-center text-xs text-muted-foreground line-clamp-2">
                                    {edits.description ?? func?.description}
                                  </div>
                                </>
                              )}
                              {/* Botón de configuración rápida */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2"
                                onClick={() => setConfigIdx(idx)}
                              >
                                Configurar
                              </Button>
                              {/* Modal de configuración rápida */}
                              <Dialog open={configIdx === idx} onOpenChange={open => setConfigIdx(open ? idx : null)}>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Configurar {func?.name}</DialogTitle>
                                    <DialogDescription>
                                      Personalizá los detalles de esta funcionalidad.
                                    </DialogDescription>
                                  </DialogHeader>
                                  {/* Ejemplo de campos de configuración rápida */}
                                  {func?.id === 'contact-form' && (
                                    <>
                                      <Label>Placeholder del campo nombre</Label>
                                      <input
                                        className="w-full mb-2 p-1 rounded border border-muted"
                                        value={edits.placeholderName ?? 'Nombre'}
                                        onChange={e => handleInlineEdit(idx, 'placeholderName', e.target.value)}
                                      />
                                      <Label>Placeholder del campo email</Label>
                                      <input
                                        className="w-full mb-2 p-1 rounded border border-muted"
                                        value={edits.placeholderEmail ?? 'Email'}
                                        onChange={e => handleInlineEdit(idx, 'placeholderEmail', e.target.value)}
                                      />
                                    </>
                                  )}
                                  {func?.id === 'gallery' && (
                                    <>
                                      <Label>URL de imagen principal</Label>
                                      <input
                                        className="w-full mb-2 p-1 rounded border border-muted"
                                        value={edits.mainImage ?? ''}
                                        onChange={e => handleInlineEdit(idx, 'mainImage', e.target.value)}
                                        placeholder="https://..."
                                      />
                                    </>
                                  )}
                                  {/* ...agregar más campos según funcionalidad... */}
                                  <DialogClose asChild>
                                    <Button className="w-full mt-2">Guardar configuración</Button>
                                  </DialogClose>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>
      )}

      {/* Category filters */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Filtrar por categoría</h3>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={() => setSelectedCategory(null)}
          >
            Todas
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Functions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFunctions.map((func) => {
          const isSelected = selectedFunctions.includes(func.name);
          const IconComponent = func.icon;
          return (
            <Card 
              key={func.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-card ${
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-glow' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleFunctionToggle(func.name)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${categoryColors[func.category]}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <Checkbox 
                      checked={isSelected}
                      onChange={() => handleFunctionToggle(func.name)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${categoryColors[func.category]}`}
                  >
                    {func.category}
                  </Badge>
                </div>
                <CardTitle className="text-base font-semibold">
                  {func.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm mb-2">{func.description}</CardDescription>
                <div className="w-full flex justify-center items-center min-h-[140px]">
                  {func.thumbnail ? (
                    <img
                      src={func.thumbnail}
                      alt={func.name}
                      className="w-full max-w-[220px] h-32 object-contain rounded-xl bg-white/80 border border-muted shadow-md mx-auto transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  ) : previewComponents[func.name] ? (
                    <div className="w-full max-w-xs h-32 flex items-center justify-center bg-muted/30 rounded-xl overflow-hidden scale-95 opacity-90 hover:scale-100 hover:opacity-100 transition-all duration-300">
                      {previewComponents[func.name]}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-32">
                      <IconComponent className="h-12 w-12 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Sin preview visual</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredFunctions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No hay funcionalidades en esta categoría
          </p>
        </div>
      )}
    </div>
  );
}
