import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { formatDateSafe } from '@/utils/formatDateSafe';
import './NotificationBell.css';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'critical';
  category: 'system' | 'project' | 'ticket' | 'payment' | 'security' | 'user';
  is_read: boolean;
  is_urgent: boolean;
  action_url?: string;
  metadata?: any;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface ClientNotificationBellProps {
  className?: string;
}

export default function ClientNotificationBell({ className = '' }: ClientNotificationBellProps) {
  const { user } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const LIMIT = 20; // Número de notificaciones por carga

  // Cargar notificaciones no leídas
  const loadUnreadNotifications = async (reset = true) => {
    if (!user?.id) return;
    
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + LIMIT - 1);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      if (reset) {
        setNotifications(data || []);
        setUnreadCount(data?.length || 0);
        setUrgentCount(data?.filter(n => n.is_urgent).length || 0);
      } else {
        setNotifications(prev => [...prev, ...(data || [])]);
        setOffset(currentOffset + LIMIT);
      }

      // Verificar si hay más notificaciones
      setHasMore((data?.length || 0) === LIMIT);
    } catch (error) {
      console.error('Error loading unread notifications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Cargar más notificaciones (scroll infinito)
  const loadMoreNotifications = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    await loadUnreadNotifications(false);
  }, [loadingMore, hasMore, offset]);

  // Manejar scroll para cargar más notificaciones
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    
    // Si está cerca del final (con un margen de 50px), cargar más
    if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !loadingMore) {
      loadMoreNotifications();
    }
  }, [hasMore, loadingMore, loadMoreNotifications]);

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    loadUnreadNotifications();
    
    // Configurar intervalo para actualizar cada 30 segundos
    const interval = setInterval(() => loadUnreadNotifications(true), 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  // Marcar como leída
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast({ title: 'Notificación marcada como leída' });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    if (!user?.id || notifications.length === 0) return;

    try {
      const notificationIds = notifications.map(n => n.id);
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds);

      if (error) {
        console.error('Error marking all as read:', error);
        return;
      }

      setNotifications([]);
      setUnreadCount(0);
      setUrgentCount(0);
      toast({ title: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Obtener icono según el tipo de notificación
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-emerald-600" />;
      case 'warning':
        return <Bell className="h-4 w-4 text-amber-600" />;
      case 'error':
      case 'critical':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  // Obtener color según el tipo de notificación
  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50/50 hover:bg-amber-50';
      case 'error':
      case 'critical':
        return 'border-red-200 bg-red-50/50 hover:bg-red-50';
      default:
        return 'border-slate-200 bg-slate-50/50 hover:bg-slate-50';
    }
  };

  // Navegar a la acción correspondiente
  const handleNotificationAction = (notification: Notification) => {
    try {
      // Si tiene action_url, navegar a ella
      if (notification.action_url) {
        window.open(notification.action_url, '_blank');
        return;
      }

      // Si es una notificación de proyecto con metadata
      if (notification.category === 'project' && notification.metadata?.project_id) {
        const projectId = notification.metadata.project_id;
        
        // Si es un mensaje, abrir el chat del proyecto
        if (notification.title.toLowerCase().includes('mensaje')) {
          window.open(`/proyectos/${projectId}/colaboracion-cliente`, '_blank');
        } else {
          // Para otras notificaciones de proyecto, ir al dashboard
          window.open('/dashboard', '_blank');
        }
        return;
      }

      // Para notificaciones de tickets
      if (notification.category === 'ticket' && notification.metadata?.ticket_id) {
        window.open(`/tickets/${notification.metadata.ticket_id}`, '_blank');
        return;
      }

      // Para notificaciones de pagos
      if (notification.category === 'payment') {
        window.open('/facturacion', '_blank');
        return;
      }

      // Para notificaciones de sistema
      if (notification.category === 'system') {
        // No hacer nada, solo mostrar la notificación
        return;
      }

      // Por defecto, ir al dashboard
      window.open('/dashboard', '_blank');
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-slate-100 transition-colors rounded-lg"
      >
        <Bell className="h-5 w-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50">
          <Card className="shadow-lg border-slate-200/50 bg-white rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-200/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Notificaciones
                </CardTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Marcar todas
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div 
                ref={scrollContainerRef}
                className="max-h-80 overflow-y-auto notification-scroll"
                onScroll={handleScroll}
              >
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No hay notificaciones nuevas</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${getNotificationColor(notification.type)} hover:bg-slate-100 hover:shadow-md hover:scale-[1.02]`}
                        onClick={() => handleNotificationAction(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-slate-800 truncate">
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-1">
                                {notification.is_urgent && (
                                  <Badge variant="destructive" className="text-xs px-1 py-0.5">
                                    Urgente
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs px-1 py-0.5">
                                  {notification.category}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">
                                {formatDateSafe(notification.created_at)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Indicador de carga para más notificaciones */}
                    {loadingMore && (
                      <div className="flex items-center justify-center p-4 loading-more">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                        <span className="ml-2 text-xs text-slate-500">Cargando más notificaciones...</span>
                      </div>
                    )}
                    
                    {/* Indicador de fin de notificaciones */}
                    {!hasMore && notifications.length > 0 && (
                      <div className="text-center py-3">
                        <span className="text-xs text-slate-400">✨ No hay más notificaciones</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overlay para cerrar el dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
