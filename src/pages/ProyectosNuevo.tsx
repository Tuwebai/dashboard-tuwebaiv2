import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';
import { CheckCircle, FileText, Calendar, UploadCloud, AlertCircle, Info, Star, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import ProjectTypeSelector from '@/components/ProjectTypeSelector';
import { ProjectType } from '@/utils/projectTypeDetector';

// Componente wrapper para usar como página
export default function ProyectosNuevo() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setOpen(false);
    navigate('/proyectos');
  };

  return <ProyectosNuevoModal open={open} onClose={handleClose} />;
}

// Componente modal original
function ProyectosNuevoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, createProject } = useApp();
  const navigate = useNavigate();
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [tipoSitio, setTipoSitio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [prioridad, setPrioridad] = useState('Media');
  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'Datos', icon: FileText },
    { label: 'Fechas', icon: Calendar },
    { label: 'Archivos', icon: UploadCloud },
  ];
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [dragActive, setDragActive] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (adjuntos.length > 0) {
      Promise.all(adjuntos.map(file => {
        if (file.type.startsWith('image/')) {
          return new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        } else {
          return Promise.resolve('');
        }
      })).then(setPreviews);
    } else {
      setPreviews([]);
      setPreviewIndex(0);
    }
  }, [adjuntos]);

  const handlePrevPreview = () => setPreviewIndex(i => (i === 0 ? previews.length - 1 : i - 1));
  const handleNextPreview = () => setPreviewIndex(i => (i === previews.length - 1 ? 0 : i + 1));

  const handleRemoveFile = (index: number) => {
    setAdjuntos(prev => prev.filter((_, i) => i !== index));
    setPreviewIndex(i => {
      if (index === 0) return 0;
      if (i >= index && i > 0) return i - 1;
      return i;
    });
  };

  if (!user) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAdjuntos(Array.from(e.target.files));
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAdjuntos(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombreProyecto || !tipoSitio || !descripcion || !fechaInicio || !prioridad) {
      toast({ 
        title: 'Error', 
        description: 'Completá todos los campos obligatorios.', 
        variant: 'destructive' 
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Preparar datos del proyecto
      const projectData = {
        name: nombreProyecto,
        description: descripcion,
        technologies: [],
        status: 'development' as const,
        is_active: true,
        type: selectedProjectType?.name || undefined
      };
      
      // Crear proyecto usando el contexto
      await createProject(projectData);
      
      toast({ 
        title: '¡Proyecto creado!', 
        description: 'Tu proyecto fue creado exitosamente.' 
      });
      
      // Limpiar formulario
      setNombreProyecto('');
      setTipoSitio('');
      setDescripcion('');
      setFechaInicio('');
      setPrioridad('Media');
      setAdjuntos([]);
      
      // Redirigir a proyectos
      navigate('/proyectos');
      
    } catch (error: any) {
      console.error('Error creando proyecto:', error);
      
      let errorMessage = 'No se pudo crear el proyecto.';
      
      // Mensajes de error más específicos
      if (error?.code === 'permission-denied') {
        errorMessage = 'No tienes permisos para crear proyectos. Contacta al administrador.';
      } else if (error?.code === 'unavailable') {
        errorMessage = 'Servicio temporalmente no disponible. Intenta nuevamente.';
      } else if (error?.code === 'unauthenticated') {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Validaciones por campo
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!nombreProyecto) newErrors.nombreProyecto = 'El nombre es obligatorio';
    if (!tipoSitio) newErrors.tipoSitio = 'Seleccioná el tipo de sitio';
    if (!descripcion) newErrors.descripcion = 'La descripción es obligatoria';
    if (!fechaInicio) newErrors.fechaInicio = 'La fecha es obligatoria';
    if (!prioridad) newErrors.prioridad = 'Seleccioná la prioridad';
    setErrors(newErrors);
    return newErrors;
  };

  const isStepValid = () => {
    const newErrors = validate();
    if (step === 0) return !newErrors.nombreProyecto && !newErrors.tipoSitio && !newErrors.descripcion;
    if (step === 1) return !newErrors.fechaInicio && !newErrors.prioridad;
    return true;
  };
  const handleNext = () => { if (isStepValid()) setStep(s => s + 1); else toast({ title: 'Completa los campos obligatorios', variant: 'destructive' }); };
  const handlePrev = () => setStep(s => s - 1);

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
          <DialogContent
            className="max-w-2xl w-full p-0 bg-white border border-slate-200/50 shadow-2xl rounded-2xl animate-in fade-in-0 zoom-in-95 relative overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full flex flex-col"
            >
              {/* Header con gradiente */}
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 text-white">
              <DialogHeader className="w-full flex flex-col items-center justify-center">
                  <DialogTitle className="text-center w-full text-2xl font-bold">Crear nuevo proyecto</DialogTitle>
                  <DialogDescription className="text-center w-full text-blue-100 mt-2">Completá los datos para tu nuevo proyecto</DialogDescription>
              </DialogHeader>
              </div>
              {/* Stepper visual */}
              <div className="flex items-center justify-center gap-4 mb-8 mt-6 px-6">
                {steps.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-300
                      ${i < step ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-purple-600 text-white shadow-lg' : ''}
                      ${i === step ? 'bg-gradient-to-r from-blue-500 to-fuchsia-600 border-fuchsia-600 text-white scale-110 shadow-xl' : 'bg-slate-100 border-slate-300 text-slate-500'}
                    `}>
                      {i < step ? <CheckCircle className="w-6 h-6" /> : <s.icon className="w-6 h-6" />}
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-12 h-1 rounded-full ${i < step ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-slate-300'}`}></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <form className="space-y-6 w-full max-w-2xl mx-auto" onSubmit={handleSubmit} autoComplete="off">
                  <AnimatePresence mode="wait">
                    {step === 0 && (
                      <motion.div key="step1" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.3 }}>
                        {/* Nombre del proyecto */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del proyecto *</label>
                          <div className="relative">
                            <Input
                              value={nombreProyecto}
                              onChange={e => setNombreProyecto(e.target.value)}
                              onBlur={() => setTouched(t => ({ ...t, nombreProyecto: true }))}
                              placeholder="Ej: Landing para Estudio Jurídico"
                              className={`w-full p-3 rounded-lg pl-10 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${touched.nombreProyecto && (errors.nombreProyecto ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-green-500 focus:border-green-500 focus:ring-green-200')}`}
                              required
                              disabled={loading}
                            />
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                          </div>
                          {touched.nombreProyecto && errors.nombreProyecto && (
                            <div className="flex items-center gap-1 text-xs text-red-500 mt-2"><AlertCircle className="w-4 h-4" />{errors.nombreProyecto}</div>
                          )}
                        </div>
                        {/* Tipo de sitio */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de sitio web *</label>
                          <div className="relative">
                            <Select value={tipoSitio} onValueChange={v => { setTipoSitio(v); setTouched(t => ({ ...t, tipoSitio: true })); }} disabled={loading}>
                              <SelectTrigger className={`w-full bg-white border-slate-200 p-3 rounded-lg pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${touched.tipoSitio && (errors.tipoSitio ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-green-500 focus:border-green-500 focus:ring-green-200')}`}>
                                <SelectValue placeholder="Seleccioná el tipo de sitio" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200">
                                <SelectItem value="Landing page">Landing page</SelectItem>
                                <SelectItem value="Sitio institucional">Sitio institucional</SelectItem>
                                <SelectItem value="Ecommerce">Ecommerce</SelectItem>
                                <SelectItem value="Blog">Blog</SelectItem>
                                <SelectItem value="Portfolio">Portfolio</SelectItem>
                                <SelectItem value="Web App">Web App</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                            <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                          </div>
                          {touched.tipoSitio && errors.tipoSitio && (
                            <div className="flex items-center gap-1 text-xs text-red-500 mt-2"><AlertCircle className="w-4 h-4" />{errors.tipoSitio}</div>
                          )}
                        </div>
                        {/* Descripción */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Descripción o requerimientos iniciales *</label>
                          <div className="relative">
                            <Textarea
                              value={descripcion}
                              onChange={e => setDescripcion(e.target.value)}
                              onBlur={() => setTouched(t => ({ ...t, descripcion: true }))}
                              placeholder="Detallá lo que querés: colores, secciones, referencias, etc."
                              className={`w-full p-3 rounded-lg pl-10 min-h-[120px] border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${touched.descripcion && (errors.descripcion ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-green-500 focus:border-green-500 focus:ring-green-200')}`}
                              required
                              disabled={loading}
                            />
                            <Info className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                          </div>
                          {touched.descripcion && errors.descripcion && (
                            <div className="flex items-center gap-1 text-xs text-red-500 mt-2"><AlertCircle className="w-4 h-4" />{errors.descripcion}</div>
                          )}
                        </div>

                        {/* Selector de tipo de proyecto */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tipo de proyecto
                            <span className="text-slate-500 text-xs ml-1">(opcional - se detecta automáticamente)</span>
                          </label>
                          <ProjectTypeSelector
                            selectedType={selectedProjectType?.name}
                            onTypeSelect={setSelectedProjectType}
                            projectData={{
                              name: nombreProyecto,
                              description: descripcion,
                              technologies: []
                            }}
                            className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                          />
                        </div>
                      </motion.div>
                    )}
                    {step === 1 && (
                      <motion.div key="step2" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.3 }}>
                        {/* Fecha de inicio */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de inicio estimada *</label>
                          <div className="relative">
                            <Input
                              type="date"
                              value={fechaInicio}
                              onChange={e => setFechaInicio(e.target.value)}
                              onBlur={() => setTouched(t => ({ ...t, fechaInicio: true }))}
                              className={`w-full p-3 rounded-lg pl-10 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${touched.fechaInicio && (errors.fechaInicio ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-green-500 focus:border-green-500 focus:ring-green-200')}`}
                              required
                              disabled={loading}
                            />
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                          </div>
                          {touched.fechaInicio && errors.fechaInicio && (
                            <div className="flex items-center gap-1 text-xs text-red-500 mt-2"><AlertCircle className="w-4 h-4" />{errors.fechaInicio}</div>
                          )}
                        </div>
                        {/* Prioridad */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Nivel de urgencia o prioridad *</label>
                          <div className="relative">
                            <Select value={prioridad} onValueChange={v => { setPrioridad(v); setTouched(t => ({ ...t, prioridad: true })); }} disabled={loading}>
                              <SelectTrigger className={`w-full bg-white border-slate-200 p-3 rounded-lg pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${touched.prioridad && (errors.prioridad ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-green-500 focus:border-green-500 focus:ring-green-200')}`}>
                                <SelectValue placeholder="Seleccioná la prioridad" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200">
                                <SelectItem value="Alta">Alta</SelectItem>
                                <SelectItem value="Media">Media</SelectItem>
                                <SelectItem value="Baja">Baja</SelectItem>
                              </SelectContent>
                            </Select>
                            <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                          </div>
                          {touched.prioridad && errors.prioridad && (
                            <div className="flex items-center gap-1 text-xs text-red-500 mt-2"><AlertCircle className="w-4 h-4" />{errors.prioridad}</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                    {step === 2 && (
                      <motion.div key="step3" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.3 }}>
                        {/* Adjuntar archivos con drag & drop */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Adjuntar archivos (opcional)</label>
                          <div
                            ref={dropRef}
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer p-8 mb-4
                              ${dragActive ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' : 'border-slate-300 bg-slate-50'}`}
                          >
                            <UploadCloud className={`w-12 h-12 mb-3 transition-transform duration-300 ${dragActive ? 'text-blue-500 scale-125 animate-bounce' : 'text-slate-400'}`} />
                            <span className="text-sm font-medium text-slate-700 mb-1">Arrastrá y soltá archivos aquí</span>
                            <span className="text-xs text-slate-500">o haz clic para seleccionar</span>
                            <input
                              type="file"
                              multiple
                              onChange={handleFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={loading}
                              tabIndex={-1}
                            />
                          </div>
                          {/* Preview de archivos subidos */}
                          {adjuntos.length > 0 && (
                            <div className="mb-6 mt-4 w-full flex flex-col items-center">
                              <div className="w-full flex items-center justify-center gap-3">
                                {adjuntos.length > 1 && (
                                  <button type="button" onClick={handlePrevPreview} className="p-2 rounded-full bg-slate-200 hover:bg-blue-500 hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                                  </button>
                                )}
                                <div className="w-36 h-36 flex items-center justify-center bg-white rounded-xl border border-slate-200 overflow-hidden relative group shadow-lg">
                                  {previews[previewIndex] ? (
                                    <img src={previews[previewIndex]} alt={adjuntos[previewIndex].name} className="object-contain w-full h-full transition-all duration-300" />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center w-full h-full text-slate-400">
                                      <FileText className="w-12 h-12 mb-2" />
                                      <span className="text-sm font-medium">{adjuntos[previewIndex].type.split('/')[1]?.toUpperCase() || 'ARCHIVO'}</span>
                                    </div>
                                  )}
                                  <span className="absolute bottom-2 left-2 bg-slate-800/90 text-xs px-2 py-1 rounded text-white max-w-[90%] truncate font-medium">{adjuntos[previewIndex].name}</span>
                                  {/* Botón eliminar archivo */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(previewIndex)}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-90 hover:opacity-100 transition-all shadow-lg group-hover:scale-110"
                                    title="Eliminar archivo"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                {adjuntos.length > 1 && (
                                  <button type="button" onClick={handleNextPreview} className="p-2 rounded-full bg-slate-200 hover:bg-blue-500 hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                                  </button>
                                )}
                              </div>
                              <div className="text-sm text-slate-600 mt-3 font-medium">
                                {adjuntos[previewIndex]?.name} &middot; {adjuntos[previewIndex] ? (adjuntos[previewIndex].size / 1024).toFixed(1) : 0} KB
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Resumen visual final */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
                          <h4 className="font-semibold mb-4 text-blue-700 text-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500 animate-pulse" /> Resumen final
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-500" />
                              <span className="font-medium text-slate-700">Nombre:</span>
                              <span className="truncate text-slate-600">{nombreProyecto}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="w-5 h-5 text-yellow-500" />
                              <span className="font-medium text-slate-700">Tipo:</span>
                              <span className="text-slate-600">{selectedProjectType?.name || tipoSitio || 'Se detectará automáticamente'}</span>
                            </div>
                            <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                              <Info className="w-5 h-5 text-cyan-500" />
                              <span className="font-medium text-slate-700">Descripción:</span>
                              <span className="truncate text-slate-600">{descripcion}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-purple-500" />
                              <span className="font-medium text-slate-700">Fecha inicio:</span>
                              <span className="text-slate-600">{fechaInicio}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-pink-500" />
                              <span className="font-medium text-slate-700">Prioridad:</span>
                              <span className="text-slate-600">{prioridad}</span>
                            </div>
                            <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                              <UploadCloud className="w-5 h-5 text-fuchsia-500" />
                              <span className="font-medium text-slate-700">Archivos:</span>
                              <span className="text-slate-600">{adjuntos.length > 0 ? adjuntos.map(f => f.name).join(', ') : 'Ninguno'}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex gap-3 pt-4">
                    {step > 0 && (
                      <Button type="button" variant="outline" className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50" onClick={handlePrev} disabled={loading}>Anterior</Button>
                    )}
                    {step < 2 && (
                      <Button type="button" className="flex-1 bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-lg text-white font-medium" onClick={handleNext} disabled={loading}>Siguiente</Button>
                    )}
                    {step === 2 && (
                      <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-lg text-white font-medium" disabled={loading}>{loading ? 'Creando proyecto...' : 'Confirmar y crear'}</Button>
                    )}
                    <Button type="button" variant="ghost" className="flex-1 text-slate-600 hover:bg-slate-100" onClick={onClose} disabled={loading}>Cancelar</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
} 
