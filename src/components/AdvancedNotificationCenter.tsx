import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Filter, 
  Search, 
  MoreHorizontal, 
  Settings, 
  Archive, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  Clock,
  AlertTriangle,
  Info,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/lib/notificationService';
import { notificationTemplateService } from '@/lib/notificationTemplateService';
import { formatDateSafe } from '@/utils/formatDateSafe';
import './AdvancedNotificationCenter.css';

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

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

interface NotificationFilters {
  type?: string;
  category?: string;
  isRead?: boolean;
  isUrgent?: boolean;
  dateRange?: 'today' | 'week' | 'month' | 'all';
  search?: string;
}

interface NotificationGroup {
  key: string;
  label: string;
  count: number;
  notifications: Notification[];
  isExpanded: boolean;
}

interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function AdvancedNotificationCenter() {
  const { user } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<NotificationGroup[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [grouping, setGrouping] = useState<'none' | 'category' | 'type' | 'date'>('date');
  const [view, setView] = useState<'list' | 'grid' | 'timeline'>('list');
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    urgent: 0,
    byType: {},
    byCategory: {}
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const LIMIT = 50;

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadNotificationStats();
    }
  }, [user?.id]);

  useEffect(() => {
    applyFilters();
  }, [notifications, filters]);

  useEffect(() => {
    groupNotifications();
  }, [filteredNotifications, grouping]);

  // =====================================================
  // CARGA DE DATOS
  // =====================================================

  const loadNotifications = async (reset = true) => {
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
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + LIMIT - 1);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      if (reset) {
        setNotifications(data || []);
      } else {
        setNotifications(prev => [...prev, ...(data || [])]);
        setOffset(currentOffset + LIMIT);
      }

      setHasMore((data?.length || 0) === LIMIT);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las notificaciones',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadNotificationStats = async () => {
    if (!user?.id) return;
    
    try {
      const statsData = await notificationService.getNotificationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  };

  const loadMoreNotifications = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    await loadNotifications(false);
  }, [loadingMore, hasMore]);

  // =====================================================
  // FILTRADO Y AGRUPACIÓN
  // =====================================================

  const applyFilters = () => {
    let filtered = [...notifications];

    // Filtro por tipo
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    // Filtro por categoría
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(n => n.category === filters.category);
    }

    // Filtro por estado de lectura
    if (filters.isRead !== undefined) {
      filtered = filtered.filter(n => n.is_read === filters.isRead);
    }

    // Filtro por urgencia
    if (filters.isUrgent !== undefined) {
      filtered = filtered.filter(n => n.is_urgent === filters.isUrgent);
    }

    // Filtro por rango de fechas
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(n => {
        const notificationDate = new Date(n.created_at);
        
        switch (filters.dateRange) {
          case 'today':
            return notificationDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return notificationDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return notificationDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Filtro de búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm) ||
        n.message.toLowerCase().includes(searchTerm) ||
        n.category.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredNotifications(filtered);
  };

  const groupNotifications = () => {
    if (grouping === 'none') {
      setGroupedNotifications([{
        key: 'all',
        label: 'Todas las notificaciones',
        count: filteredNotifications.length,
        notifications: filteredNotifications,
        isExpanded: true
      }]);
      return;
    }

    const groups = new Map<string, NotificationGroup>();

    filteredNotifications.forEach(notification => {
      let groupKey = '';
      let groupLabel = '';

      switch (grouping) {
        case 'category':
          groupKey = notification.category;
          groupLabel = getCategoryDisplayName(notification.category);
          break;
        case 'type':
          groupKey = notification.type;
          groupLabel = getTypeDisplayName(notification.type);
          break;
        case 'date':
          groupKey = getDateGroupKey(notification.created_at);
          groupLabel = getDateGroupLabel(notification.created_at);
          break;
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          label: groupLabel,
          count: 0,
          notifications: [],
          isExpanded: true
        });
      }

      const group = groups.get(groupKey)!;
      group.notifications.push(notification);
      group.count++;
    });

    // Ordenar grupos
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      if (grouping === 'date') {
        return new Date(b.key).getTime() - new Date(a.key).getTime();
      }
      return b.count - a.count;
    });

    setGroupedNotifications(sortedGroups);
  };

  const getCategoryDisplayName = (category: string): string => {
    const names: Record<string, string> = {
      system: 'Sistema',
      project: 'Proyectos',
      ticket: 'Tickets',
      payment: 'Pagos',
      security: 'Seguridad',
      user: 'Usuario'
    };
    return names[category] || category;
  };

  const getTypeDisplayName = (type: string): string => {
    const names: Record<string, string> = {
      info: 'Información',
      success: 'Éxito',
      warning: 'Advertencia',
      error: 'Error',
      critical: 'Crítico'
    };
    return names[type] || type;
  };

  const getDateGroupKey = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return 'today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'yesterday';
    } else {
      return date.toISOString().split('T')[0];
    }
  };

  const getDateGroupLabel = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // =====================================================
  // ACCIONES DE NOTIFICACIONES
  // =====================================================

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      
      toast({ title: 'Notificación marcada como leída' });
    } catch (error) {
      console.error('Error marking as read:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar como leída',
        variant: 'destructive'
      });
    }
  };

  const markMultipleAsRead = async () => {
    if (selectedNotifications.size === 0) return;
    
    try {
      const notificationIds = Array.from(selectedNotifications);
      await notificationService.markMultipleAsRead(notificationIds);
      
      setNotifications(prev => 
        prev.map(n => 
          selectedNotifications.has(n.id) ? { ...n, is_read: true } : n
        )
      );
      
      setSelectedNotifications(new Set());
      toast({ title: `${selectedNotifications.size} notificaciones marcadas como leídas` });
    } catch (error) {
      console.error('Error marking multiple as read:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron marcar como leídas',
        variant: 'destructive'
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      setSelectedNotifications(new Set());
      toast({ title: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron marcar todas como leídas',
        variant: 'destructive'
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      
      toast({ title: 'Notificación eliminada' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la notificación',
        variant: 'destructive'
      });
    }
  };

  const deleteMultipleNotifications = async () => {
    if (selectedNotifications.size === 0) return;
    
    try {
      const notificationIds = Array.from(selectedNotifications);
      
      for (const id of notificationIds) {
        await notificationService.deleteNotification(id);
      }
      
      setNotifications(prev => 
        prev.filter(n => !selectedNotifications.has(n.id))
      );
      
      setSelectedNotifications(new Set());
      toast({ title: `${notificationIds.length} notificaciones eliminadas` });
    } catch (error) {
      console.error('Error deleting multiple notifications:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron eliminar las notificaciones',
        variant: 'destructive'
      });
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const toggleGroupExpansion = (groupKey: string) => {
    setGroupedNotifications(prev => 
      prev.map(group => 
        group.key === groupKey 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  // =====================================================
  // MANEJO DE SCROLL
  // =====================================================

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !loadingMore) {
      loadMoreNotifications();
    }
  }, [hasMore, loadingMore, loadMoreNotifications]);

  // =====================================================
  // RENDERIZADO
  // =====================================================

  const renderNotificationIcon = (type: Notification['type']) => {
    const iconProps = { className: 'h-4 w-4' };
    
    switch (type) {
      case 'success':
        return <Check {...iconProps} className="h-4 w-4 text-emerald-600" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="h-4 w-4 text-amber-600" />;
      case 'error':
      case 'critical':
        return <X {...iconProps} className="h-4 w-4 text-red-600" />;
      default:
        return <Info {...iconProps} className="h-4 w-4 text-blue-600" />;
    }
  };

  const renderNotificationItem = (notification: Notification) => (
    <div
      key={notification.id}
      className={`notification-item p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
        notification.is_read 
          ? 'border-slate-200 bg-slate-50/50' 
          : 'border-blue-200 bg-blue-50/50'
      } hover:bg-slate-100 hover:shadow-md hover:scale-[1.02] ${
        selectedNotifications.has(notification.id) ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => toggleNotificationSelection(notification.id)}
    >
      <div className="flex items-start space-x-3">
        <Checkbox
          checked={selectedNotifications.has(notification.id)}
          onChange={() => toggleNotificationSelection(notification.id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1"
        />
        
        <div className="flex-shrink-0 mt-0.5">
          {renderNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-sm font-medium truncate ${
              notification.is_read ? 'text-slate-600' : 'text-slate-800'
            }`}>
              {notification.title}
            </h4>
            
            <div className="flex items-center space-x-2">
              {notification.is_urgent && (
                <Badge variant="destructive" className="text-xs px-2 py-1">
                  Urgente
                </Badge>
              )}
              <Badge variant="outline" className="text-xs px-2 py-1">
                {getCategoryDisplayName(notification.category)}
              </Badge>
            </div>
          </div>
          
          <p className={`text-sm line-clamp-2 mb-3 ${
            notification.is_read ? 'text-slate-500' : 'text-slate-700'
          }`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {formatDateSafe(notification.created_at)}
            </span>
            
            <div className="flex items-center space-x-2">
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                  className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationGroup = (group: NotificationGroup) => (
    <div key={group.key} className="notification-group mb-6">
      <div 
        className="group-header flex items-center justify-between p-3 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors"
        onClick={() => toggleGroupExpansion(group.key)}
      >
        <div className="flex items-center space-x-3">
          <h3 className="font-semibold text-slate-800">
            {group.label}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {group.count}
          </Badge>
        </div>
        
        {group.isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-600" />
        )}
      </div>
      
      {group.isExpanded && (
        <div className="group-content mt-3 space-y-2">
          {group.notifications.map(renderNotificationItem)}
        </div>
      )}
    </div>
  );

  return (
    <div className="advanced-notification-center">
      {/* Header con estadísticas */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-6 w-6 text-blue-600" />
              <span>Centro de Notificaciones</span>
            </CardTitle>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-slate-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{stats.unread}</div>
                <div className="text-xs text-slate-500">No leídas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                <div className="text-xs text-slate-500">Urgentes</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controles principales */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
              </Button>
              
              <Select value={grouping} onValueChange={(value: any) => setGrouping(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin agrupación</SelectItem>
                  <SelectItem value="category">Por categoría</SelectItem>
                  <SelectItem value="type">Por tipo</SelectItem>
                  <SelectItem value="date">Por fecha</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={view} onValueChange={(value: any) => setView(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">Lista</SelectItem>
                  <SelectItem value="grid">Cuadrícula</SelectItem>
                  <SelectItem value="timeline">Línea de tiempo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedNotifications.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markMultipleAsRead}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Marcar ({selectedNotifications.size})</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteMultipleNotifications}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar ({selectedNotifications.size})</span>
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex items-center space-x-2"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Marcar todas</span>
              </Button>
            </div>
          </div>
          
          {/* Filtros expandibles */}
          {showFilters && (
            <div className="filters-panel p-4 bg-slate-50 rounded-lg space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Tipo
                  </label>
                  <Select 
                    value={filters.type || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="info">Información</SelectItem>
                      <SelectItem value="success">Éxito</SelectItem>
                      <SelectItem value="warning">Advertencia</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Categoría
                  </label>
                  <Select 
                    value={filters.category || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === 'all' ? undefined : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                      <SelectItem value="project">Proyectos</SelectItem>
                      <SelectItem value="ticket">Tickets</SelectItem>
                      <SelectItem value="payment">Pagos</SelectItem>
                      <SelectItem value="security">Seguridad</SelectItem>
                      <SelectItem value="user">Usuario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Estado
                  </label>
                  <Select 
                    value={filters.isRead === undefined ? 'all' : filters.isRead ? 'read' : 'unread'} 
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      isRead: value === 'all' ? undefined : value === 'read' 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="read">Leídas</SelectItem>
                      <SelectItem value="unread">No leídas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Período
                  </label>
                                     <Select 
                     value={filters.dateRange || 'all'} 
                     onValueChange={(value: 'today' | 'week' | 'month' | 'all') => setFilters(prev => ({ ...prev, dateRange: value === 'all' ? undefined : value }))}
                   >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo el tiempo</SelectItem>
                      <SelectItem value="today">Hoy</SelectItem>
                      <SelectItem value="week">Esta semana</SelectItem>
                      <SelectItem value="month">Este mes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Búsqueda
                </label>
                <Input
                  placeholder="Buscar en notificaciones..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="max-w-md"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de notificaciones */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea 
            ref={scrollContainerRef}
            className="h-96"
            onScroll={handleScroll}
          >
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : groupedNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No hay notificaciones</p>
                <p className="text-slate-400 text-sm">Las notificaciones aparecerán aquí cuando las recibas</p>
              </div>
            ) : (
              <div className="p-4">
                {groupedNotifications.map(renderNotificationGroup)}
                
                {/* Indicador de carga para más notificaciones */}
                {loadingMore && (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
                    <span className="ml-2 text-sm text-slate-500">Cargando más notificaciones...</span>
                  </div>
                )}
                
                {/* Indicador de fin de notificaciones */}
                {!hasMore && notifications.length > 0 && (
                  <div className="text-center py-4">
                    <span className="text-sm text-slate-400">✨ No hay más notificaciones</span>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
