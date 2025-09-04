import React from 'react';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';
import { Bell, MessageSquare, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import AccessibleTooltip from './AccessibleTooltip';

interface ActivityItem {
  id: string;
  type: 'notification' | 'message' | 'update' | 'completion' | 'alert' | 'activity';
  title: string;
  description?: string;
  timestamp: string;
  isRead?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface ActivityIndicatorProps {
  activities: ActivityItem[];
  maxItems?: number;
  showCount?: boolean;
  className?: string;
}

export default function ActivityIndicator({ 
  activities, 
  maxItems = 5, 
  showCount = true,
  className = "" 
}: ActivityIndicatorProps) {
  const unreadCount = activities.filter(activity => !activity.isRead).length;
  const recentActivities = activities.slice(0, maxItems);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'notification':
        return <Bell className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'update':
        return <Clock className="h-4 w-4" />;
      case 'completion':
        return <CheckCircle className="h-4 w-4" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4" />;
      case 'activity':
        return <Zap className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string, priority?: string) => {
    if (priority === 'urgent') return 'text-red-500 bg-red-100';
    if (priority === 'high') return 'text-orange-500 bg-orange-100';
    if (priority === 'medium') return 'text-blue-500 bg-blue-100';
    if (priority === 'low') return 'text-slate-500 bg-slate-100';
    
    switch (type) {
      case 'notification':
        return 'text-blue-500 bg-blue-100';
      case 'message':
        return 'text-green-500 bg-green-100';
      case 'update':
        return 'text-yellow-500 bg-yellow-100';
      case 'completion':
        return 'text-emerald-500 bg-emerald-100';
      case 'alert':
        return 'text-red-500 bg-red-100';
      case 'activity':
        return 'text-purple-500 bg-purple-100';
      default:
        return 'text-slate-500 bg-slate-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Indicador principal */}
      <div className="relative">
        <AccessibleTooltip 
          content={`${unreadCount} notificaciones no leídas`}
          position="bottom"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors duration-200 cursor-pointer focus-visible"
            role="button"
            tabIndex={0}
            aria-label={`Actividad reciente. ${unreadCount} notificaciones no leídas`}
            aria-expanded={isVisible}
            aria-haspopup="true"
          >
            <Bell className="h-5 w-5 text-slate-600" />
            
            {/* Contador de notificaciones */}
            {showCount && unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                aria-label={`${unreadCount} notificaciones no leídas`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.div>
            )}
            
            {/* Punto de actividad animado */}
            {unreadCount > 0 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                aria-hidden="true"
              />
            )}
          </motion.div>
        </AccessibleTooltip>
      </div>

      {/* Lista de actividades (se puede expandir) */}
      <AnimatePresence>
        {recentActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
          >
            <div className="p-3 border-b border-slate-200">
              <h3 className="text-sm font-medium text-slate-900">Actividad Reciente</h3>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors duration-200 ${
                    !activity.isRead ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icono de actividad */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type, activity.priority)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-slate-900 truncate">
                          {activity.title}
                        </h4>
                        <span className="text-xs text-slate-500 ml-2">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      
                      {activity.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      
                      {/* Indicador de no leído */}
                      {!activity.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {activities.length > maxItems && (
              <div className="p-3 border-t border-slate-200">
                <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  Ver todas las actividades ({activities.length})
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente para indicadores de estado granular
interface StatusIndicatorProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = false,
  className = "" 
}: StatusIndicatorProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'bg-green-500',
          label: 'Activo',
          icon: <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        };
      case 'inactive':
        return {
          color: 'bg-slate-400',
          label: 'Inactivo',
          icon: <div className="w-2 h-2 bg-white rounded-full" />
        };
      case 'pending':
        return {
          color: 'bg-yellow-500',
          label: 'Pendiente',
          icon: <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        };
      case 'completed':
        return {
          color: 'bg-emerald-500',
          label: 'Completado',
          icon: <CheckCircle className="w-3 h-3 text-white" />
        };
      case 'error':
        return {
          color: 'bg-red-500',
          label: 'Error',
          icon: <AlertCircle className="w-3 h-3 text-white" />
        };
      case 'warning':
        return {
          color: 'bg-orange-500',
          label: 'Advertencia',
          icon: <AlertCircle className="w-3 h-3 text-white" />
        };
      default:
        return {
          color: 'bg-slate-400',
          label: 'Desconocido',
          icon: <div className="w-2 h-2 bg-white rounded-full" />
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-4 h-4';
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${getSizeClasses(size)} ${config.color} rounded-full flex items-center justify-center`}>
        {config.icon}
      </div>
      {showLabel && (
        <span className="text-sm text-slate-600">{config.label}</span>
      )}
    </div>
  );
}
