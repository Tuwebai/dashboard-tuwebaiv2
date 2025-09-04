import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { useApp } from '@/contexts/AppContext';
import {
  Menu,
  Home,
  FolderOpen,
  Users,
  Settings,
  Bell,
  BarChart3,
  FileText,
  CreditCard,
  HelpCircle,
  X,
  ChevronRight
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
  subItems?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/'
  },
  {
    id: 'projects',
    label: 'Proyectos',
    icon: FolderOpen,
    path: '/projects'
  },
  {
    id: 'team',
    label: 'Equipo',
    icon: Users,
    path: '/team'
  },
  {
    id: 'tickets',
    label: 'Tickets',
    icon: FileText,
    path: '/tickets',
    badge: 0 // Se actualizará dinámicamente
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/analytics'
  },
  {
    id: 'payments',
    label: 'Pagos',
    icon: CreditCard,
    path: '/payments'
  },
  {
    id: 'notifications',
    label: 'Notificaciones',
    icon: Bell,
    path: '/notifications',
    badge: 0 // Se actualizará dinámicamente
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: Settings,
    path: '/settings'
  },
  {
    id: 'help',
    label: 'Ayuda',
    icon: HelpCircle,
    path: '/help'
  }
];

interface MobileNavigationProps {
  className?: string;
}

export default function MobileNavigation({ className = '' }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, isTouchDevice, triggerHaptic, getTouchOptimizedStyle } = useMobileOptimization();
  const { user, unreadNotifications, openTickets } = useApp();

  // Actualizar badges dinámicamente
  const itemsWithBadges = navigationItems.map(item => {
    if (item.id === 'tickets') {
      return { ...item, badge: openTickets };
    }
    if (item.id === 'notifications') {
      return { ...item, badge: unreadNotifications };
    }
    return item;
  });

  // Cerrar menú al navegar
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Solo mostrar en dispositivos móviles
  if (!isMobile) {
    return null;
  }

  const handleNavigation = (path: string) => {
    triggerHaptic('light');
    navigate(path);
  };

  const toggleExpanded = (itemId: string) => {
    triggerHaptic('light');
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-background border-t ${className}`}>
      {/* Navegación inferior */}
      <div className="flex items-center justify-around px-2 py-2">
        {itemsWithBadges.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.id}
              variant={active ? "default" : "ghost"}
              size="sm"
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                active ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
              style={getTouchOptimizedStyle()}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Menú completo */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            style={getTouchOptimizedStyle()}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{user?.email || 'Usuario'}</p>
                  <p className="text-xs text-muted-foreground">{user?.role || 'Usuario'}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                style={getTouchOptimizedStyle()}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navegación */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-4 space-y-2">
                {itemsWithBadges.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isExpanded = expandedItems.has(item.id);

                  return (
                    <div key={item.id}>
                      <Button
                        variant={active ? "secondary" : "ghost"}
                        className={`w-full justify-start gap-3 h-12 ${
                          active ? 'bg-primary/10 text-primary' : 'text-foreground'
                        }`}
                        onClick={() => {
                          if (hasSubItems) {
                            toggleExpanded(item.id);
                          } else {
                            handleNavigation(item.path);
                          }
                        }}
                        style={getTouchOptimizedStyle()}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {item.badge > 99 ? '99+' : item.badge}
                          </Badge>
                        )}
                        {hasSubItems && (
                          <ChevronRight 
                            className={`h-4 w-4 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`} 
                          />
                        )}
                      </Button>

                      {/* Sub-items */}
                      {hasSubItems && isExpanded && (
                        <div className="ml-6 mt-2 space-y-1">
                          {item.subItems!.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const subActive = isActive(subItem.path);
                            
                            return (
                              <Button
                                key={subItem.id}
                                variant={subActive ? "secondary" : "ghost"}
                                className={`w-full justify-start gap-3 h-10 ${
                                  subActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                                }`}
                                onClick={() => handleNavigation(subItem.path)}
                                style={getTouchOptimizedStyle()}
                              >
                                <SubIcon className="h-4 w-4" />
                                <span className="flex-1 text-left text-sm">{subItem.label}</span>
                                {subItem.badge && subItem.badge > 0 && (
                                  <Badge variant="destructive" className="ml-auto text-xs">
                                    {subItem.badge > 99 ? '99+' : subItem.badge}
                                  </Badge>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t">
              <div className="text-xs text-muted-foreground text-center">
                TuWebAI Dashboard v1.0
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}