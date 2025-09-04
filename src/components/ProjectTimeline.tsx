import React from 'react';
import { motion } from '@/components/OptimizedMotion';
import { CheckCircle, Clock, Play, Pause, AlertCircle } from 'lucide-react';
import AccessibleTooltip from './AccessibleTooltip';

interface ProjectPhase {
  key: string;
  nombre?: string;
  estado: 'Sin iniciar' | 'En progreso' | 'Terminado' | 'Pausado' | 'Cancelado' | 'Pendiente' | 'En Progreso';
  fecha_inicio?: string;
  fecha_fin?: string;
  fechaEntrega?: string;
  descripcion?: string;
  progreso?: number;
  archivos?: Array<{ url: string; name: string }>;
  comentarios?: Array<{
    id: string;
    texto: string;
    autor: string;
    fecha: string;
    tipo: 'admin' | 'cliente';
  }>;
}

interface ProjectTimelineProps {
  fases: ProjectPhase[];
  compact?: boolean;
  showProgress?: boolean;
  className?: string;
}

export default function ProjectTimeline({ 
  fases, 
  compact = false, 
  showProgress = true,
  className = "" 
}: ProjectTimelineProps) {
  if (!fases || fases.length === 0) {
    return (
      <div className={`text-center text-slate-500 py-4 ${className}`}>
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay fases definidas</p>
      </div>
    );
  }

  const getPhaseIcon = (estado: string) => {
    switch (estado) {
      case 'Terminado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'En progreso':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'Pausado':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'Cancelado':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getPhaseColor = (estado: string) => {
    switch (estado) {
      case 'Terminado':
        return 'border-green-500 bg-green-50';
      case 'En progreso':
        return 'border-blue-500 bg-blue-50';
      case 'Pausado':
        return 'border-yellow-500 bg-yellow-50';
      case 'Cancelado':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-slate-300 bg-slate-50';
    }
  };

  const getPhaseStatusColor = (estado: string) => {
    switch (estado) {
      case 'Terminado':
        return 'text-green-600 bg-green-100';
      case 'En progreso':
        return 'text-blue-600 bg-blue-100';
      case 'Pausado':
        return 'text-yellow-600 bg-yellow-100';
      case 'Cancelado':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {fases.slice(0, 6).map((fase, index) => (
                    <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="relative group"
          >
            <AccessibleTooltip 
              content={`${fase.nombre || fase.key}: ${fase.estado}`}
              position="top"
            >
              <div
                className={`w-3 h-3 rounded-full border-2 transition-all duration-300 cursor-help ${
                  fase.estado === 'Terminado' 
                    ? 'bg-green-500 border-green-500 shadow-sm animate-phase-complete' 
                    : fase.estado === 'En progreso'
                    ? 'bg-blue-500 border-blue-500 animate-pulse'
                    : fase.estado === 'Pausado'
                    ? 'bg-yellow-500 border-yellow-500'
                    : fase.estado === 'Cancelado'
                    ? 'bg-red-500 border-red-500'
                    : 'bg-slate-300 border-slate-300'
                }`}
                role="img"
                aria-label={`Fase ${fase.nombre || fase.key}: ${fase.estado}`}
                tabIndex={0}
              />
            </AccessibleTooltip>
          </motion.div>
        ))}
        
        {fases.length > 6 && (
          <span className="text-xs text-slate-500 ml-1">+{fases.length - 6}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {fases.map((fase, index) => (
        <motion.div
          key={index}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          className="relative"
        >
          {/* Línea conectora */}
          {index < fases.length - 1 && (
            <div className="absolute left-4 top-8 w-0.5 h-8 bg-slate-200"></div>
          )}
          
          <div className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md ${getPhaseColor(fase.estado)}`}>
            {/* Icono de fase */}
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                fase.estado === 'Terminado' 
                  ? 'border-green-500 bg-green-100' 
                  : fase.estado === 'En progreso'
                  ? 'border-blue-500 bg-blue-100'
                  : fase.estado === 'Pausado'
                  ? 'border-yellow-500 bg-yellow-100'
                  : fase.estado === 'Cancelado'
                  ? 'border-red-500 bg-red-100'
                  : 'border-slate-300 bg-slate-100'
              }`}>
                {getPhaseIcon(fase.estado)}
              </div>
            </div>
            
            {/* Contenido de la fase */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-900 truncate">
                  {fase.nombre || fase.key}
                </h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPhaseStatusColor(fase.estado)}`}>
                  {fase.estado}
                </span>
              </div>
              
              {fase.descripcion && (
                <p className="text-sm text-slate-600 mb-2">{fase.descripcion}</p>
              )}
              
              {/* Barra de progreso de la fase */}
              {showProgress && fase.progreso !== undefined && (
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${fase.progreso}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                    className={`h-2 rounded-full ${
                      fase.estado === 'Terminado' 
                        ? 'bg-green-500' 
                        : fase.estado === 'En progreso'
                        ? 'bg-blue-500'
                        : 'bg-slate-400'
                    }`}
                  />
                </div>
              )}
              
              {/* Fechas */}
              <div className="flex items-center space-x-4 text-xs text-slate-500">
                {fase.fecha_inicio && (
                  <span>Inicio: {new Date(fase.fecha_inicio).toLocaleDateString()}</span>
                )}
                {fase.fecha_fin && (
                  <span>Fin: {new Date(fase.fecha_fin).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
