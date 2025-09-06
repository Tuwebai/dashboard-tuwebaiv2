import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { notificationService, Notification } from '@/lib/notificationService';
import { useTheme } from '@/contexts/ThemeContext';
import './NotificationBell.css';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const { theme } = useTheme();
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
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      
      const unreadNotifications = await notificationService.getUserNotifications({
        is_read: false,
        limit: LIMIT,
        offset: currentOffset,
        currentUserId: user.id // FILTRO CRÍTICO: Pasar el ID del usuario actual
      });
      
      if (reset) {
        setNotifications(unreadNotifications);
        setUnreadCount(unreadNotifications.length);
        setUrgentCount(unreadNotifications.filter(n => n.is_urgent).length);
      } else {
        setNotifications(prev => [...prev, ...unreadNotifications]);
        setOffset(currentOffset + LIMIT);
      }

      // Verificar si hay más notificaciones
      setHasMore(unreadNotifications.length === LIMIT);
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
    if (user?.id) {
      loadUnreadNotifications();
      
      // Configurar intervalo para actualizar cada 30 segundos
      const interval = setInterval(() => {
        loadUnreadNotifications(true);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id]); // Solo ejecutar cuando user.id cambie realmente

  // Manejar clic en notificación
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Marcar la notificación como leída
      await markAsRead(notification.id);

      // Si la notificación tiene una URL de acción, navegar a ella
      if (notification.action_url) {

        
        // Determinar si es una URL externa o interna
        if (notification.action_url.startsWith('http')) {
          // URL externa - abrir en nueva pestaña

          window.open(notification.action_url, '_blank');
        } else {
          // URL interna - navegar en la misma pestaña

          window.location.href = notification.action_url;
        }
      } else {
        // Si no hay action_url, intentar determinar la acción basada en la categoría y metadata

        
        // Lógica para diferentes categorías
        switch (notification.category) {
          case 'project':
            // Navegar a la página de colaboración del proyecto
            if (notification.metadata?.project_id) {
              const fallbackUrl = `/proyectos/${notification.metadata.project_id}/colaboracion-admin`;

              window.location.href = fallbackUrl;
            }
            break;
          case 'ticket':
            // Navegar a la página de tickets del admin

            window.location.href = '/admin#tickets';
            break;
          case 'payment':
            // Navegar a la página de pagos

            window.location.href = '/admin/payments';
            break;
          case 'user':
            // Navegar a la gestión de usuarios

            window.location.href = '/admin/users';
            break;
          default:
            // Para notificaciones del sistema o sin acción específica, solo marcar como leída

            break;
        }
      }
      
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast({ 
        title: 'Error al procesar la notificación', 
        description: 'Inténtalo de nuevo',
        variant: 'destructive'
      });
    }
  };

  // Marcar como leída
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Removido el toast aquí ya que ahora se maneja en handleNotificationClick
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
      setUrgentCount(0);
      toast({ title: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Obtener icono por tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'error':
      case 'critical':
        return '🔴';
      default:
        return '🔵';
    }
  };

  // Obtener color del badge por tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'critical':
        return 'bg-red-200 text-red-900 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        className="relative h-10 w-10 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-100 overflow-visible"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-0.5 -right-0.5 h-4 w-4 min-w-4 rounded-full p-0 text-xs flex items-center justify-center z-10"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {urgentCount > 0 && unreadCount === 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -top-0.5 -right-0.5 h-4 w-4 min-w-4 rounded-full p-0 text-xs flex items-center justify-center bg-red-500 text-white z-10"
          >
            !
          </Badge>
        )}
      </Button>

      {/* Dropdown de notificaciones */}
      {showDropdown && (
        <div className="absolute right-0 top-12 w-96 z-50">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-800 dark:text-slate-100 text-lg">Notificaciones</CardTitle>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      onClick={markAllAsRead}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      Marcar todas
                    </Button>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>{unreadCount} no leídas</span>
                  {urgentCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-red-600 dark:text-red-400">{urgentCount} urgentes</span>
                    </>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div 
                ref={scrollContainerRef}
                className="max-h-80 overflow-y-auto notification-scroll"
                onScroll={handleScroll}
              >
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600 dark:border-slate-400"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">No hay notificaciones nuevas</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          notification.is_urgent 
                            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' 
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'
                        } hover:bg-slate-100 dark:hover:bg-slate-600/50`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-lg">{getTypeIcon(notification.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={`font-medium text-sm ${
                                notification.is_urgent ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'
                              }`}>
                                {notification.title}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getTypeColor(notification.type)}`}
                              >
                                {notification.type}
                              </Badge>
                              {notification.is_urgent && (
                                <Badge variant="destructive" className="text-xs">
                                  Urgente
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatDate(notification.created_at)}
                              </span>
                              {notification.category !== 'system' && (
                                <Badge variant="outline" className="text-xs text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600">
                                  {notification.category}
                                </Badge>
                              )}
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

      {/* Overlay para cerrar dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
