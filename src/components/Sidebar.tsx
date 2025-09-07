import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Home, 
  FolderKanban, 
  CreditCard, 
  HelpCircle, 
  Settings, 
  BarChart3, 
  Users, 
  Ticket, 
  LogOut, 
  User,
  Bell,
  Activity,
  Database,
  HardDrive,
  Cpu,
  Shield,
  TrendingUp,
  CheckCircle,
  FileText,
  BarChart,
  Eye,
  Key,
  ChevronRight,
  Search,
  GitBranch,
  Target,
  Calendar,
  Bot,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import { useEffect, useState, useCallback } from 'react';

import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { useSafeSupabase } from '@/hooks/useSafeSupabase';

export default function Sidebar() {
  const { user, logout } = useApp();
  const { theme } = useTheme();
  const location = useLocation();
  const { getUsersCount, getProjectsCount, getTicketsCount, getPaymentsCount } = useSafeSupabase();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    users: 0,
    projects: 0,
    tickets: 0,
    payments: 0,
    pendingApprovals: 0
  });
  const { t } = useTranslation();

  // Cargar contadores con Supabase de manera segura
  const loadCounts = useCallback(async () => {
    try {
      // Cargar contadores usando el hook seguro
      const [usersCount, projectsCount, ticketsCount, paymentsCount] = await Promise.all([
        getUsersCount(),
        getProjectsCount(),
        getTicketsCount(),
        getPaymentsCount()
      ]);

      setCounts({
        users: usersCount,
        projects: projectsCount,
        tickets: ticketsCount,
        payments: paymentsCount,
        pendingApprovals: 0 // Por ahora 0 hasta que se implemente la lógica de aprobaciones
      });
    } catch (error) {
      console.error('Error loading counts:', error);
      // Mantener valores por defecto en caso de error
      setCounts({
        users: 0,
        projects: 0,
        tickets: 0,
        payments: 0,
        pendingApprovals: 0
      });
    }
  }, [getUsersCount, getProjectsCount, getTicketsCount, getPaymentsCount]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadCounts();
    }
  }, [user?.role]);

  const navItem = (to: string, icon: JSX.Element, label: string, count?: number, badge?: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative group cursor-pointer transition-all duration-300 ease-out hover:bg-sidebar-accent dark:hover:bg-slate-700 w-full
        ${isActive ? 'bg-gradient-to-r from-sidebar-primary/10 to-sidebar-primary/5 dark:from-blue-900/20 dark:to-blue-800/10' : ''}`
      }
      aria-label={`Navegar a ${label}`}
      aria-describedby={count ? `count-${label.toLowerCase()}` : undefined}
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center px-4 py-3.5 space-x-4">
            <div className={`relative p-2 rounded-xl transition-all duration-300 ${
              isActive 
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25' 
                : 'bg-sidebar-accent dark:bg-slate-700 text-sidebar-foreground/70 dark:text-slate-300 group-hover:bg-sidebar-primary/10 dark:group-hover:bg-blue-900/30 group-hover:text-sidebar-primary dark:group-hover:text-blue-400'
            }`}>
              {icon}
              {/* Indicador al lado del icono */}
              {isActive && (
                <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-r-full"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-sidebar-foreground dark:text-slate-200 group-hover:text-sidebar-primary dark:group-hover:text-blue-400 transition-colors duration-200">
                {label}
              </span>
              {count !== undefined && (
                <div 
                  id={`count-${label.toLowerCase()}`}
                  className="text-xs text-gray-500 dark:text-slate-400 mt-1"
                  aria-label={`${count} ${label.toLowerCase()}`}
                >
                  {count}
                </div>
              )}
            </div>
            {badge && (
              <Badge 
                variant="secondary" 
                className="text-xs"
                aria-label={`Estado: ${badge}`}
              >
                {badge}
              </Badge>
            )}
          </div>
        </>
      )}
    </NavLink>
  );

  const adminNavItem = (hash: string, icon: JSX.Element, label: string, count?: number, badge?: string) => {
    const isActive = location.pathname === '/admin' && (hash === 'dashboard' ? !window.location.hash : window.location.hash === `#${hash}`);
    return (
      <button
        onClick={() => {
          if (location.pathname !== '/admin') {
            // Si no estamos en /admin, navegar primero
            navigate('/admin');
            // Usar un timeout más largo para asegurar que la navegación se complete
            setTimeout(() => {
              if (hash === 'dashboard') {
                window.location.hash = '';
              } else {
                window.location.hash = hash;
              }
              // Forzar un re-render después de cambiar el hash
              setTimeout(() => {
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }, 100);
            }, 200);
          } else {
            // Si ya estamos en /admin, solo cambiar el hash
            if (hash === 'dashboard') {
              window.location.hash = '';
            } else {
              window.location.hash = hash;
            }
            // Forzar un re-render del componente Admin
            setTimeout(() => {
              window.dispatchEvent(new HashChangeEvent('hashchange'));
            }, 100);
          }
        }}
        className={`relative group cursor-pointer transition-all duration-300 ease-out hover:bg-sidebar-accent dark:hover:bg-slate-700 w-full
        ${isActive ? 'bg-gradient-to-r from-sidebar-primary/10 to-sidebar-primary/5 dark:from-blue-900/20 dark:to-blue-800/10' : ''}`}
      >
        <div className="flex items-center px-4 py-3.5 space-x-4">
          <div className={`relative p-2 rounded-xl transition-all duration-300 ${
            isActive 
              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25' 
              : 'bg-sidebar-accent dark:bg-slate-700 text-sidebar-foreground/70 dark:text-slate-300 group-hover:bg-sidebar-primary/10 dark:group-hover:bg-blue-900/30 group-hover:text-sidebar-primary dark:group-hover:text-blue-400'
          }`}>
            <div className="transition-transform duration-300 group-hover:scale-110">
              {icon}
            </div>
            {/* Indicador al lado del icono */}
            {isActive && (
              <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-r-full"></div>
            )}
          </div>
          <span className={`font-medium text-sm flex-1 text-center ${
            isActive ? 'text-sidebar-foreground dark:text-slate-100' : 'text-sidebar-foreground/80 dark:text-slate-300 group-hover:text-sidebar-foreground dark:group-hover:text-slate-100'
          }`}>
            {t(label)}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            {count !== undefined && (
              <Badge variant="secondary" className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                isActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:bg-red-500 dark:group-hover:bg-red-600 group-hover:text-white'
              }`}>
                {count}
              </Badge>
            )}
            {badge && (
              <Badge variant="destructive" className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                isActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:bg-red-500 dark:group-hover:bg-red-600 group-hover:text-white'
              }`}>
                {badge}
              </Badge>
            )}
            {isActive && (
              <ChevronRight size={16} className="text-blue-500 animate-pulse" />
            )}
          </div>
        </div>
        {isActive && (
          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full"></div>
        )}
      </button>
    );
  };

  return (
    <aside className="w-80 h-screen bg-sidebar-background dark:bg-slate-900 border-r border-sidebar-border dark:border-slate-700 flex flex-col shadow-xl">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header visual mejorado */}
        <div className="p-6 border-b border-sidebar-border dark:border-slate-700 bg-gradient-to-r from-sidebar-accent to-sidebar-background dark:from-slate-800 dark:to-slate-900">
          {/* Información del usuario */}
          <div className="flex flex-col items-center gap-3">
            {/* Avatar del usuario - usar imagen real si existe */}
            {user?.avatar ? (
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt={`Avatar de ${user.full_name || user.email}`}
                  className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg object-cover border-2 border-white"
                  onError={(e) => {
                    // Fallback a iniciales si la imagen falla
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
            ) : (
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center text-xl font-bold text-white">
                  {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
            )}
            
            <div className="text-center">
              <div className="font-bold text-xl text-sidebar-foreground dark:text-slate-100 truncate max-w-[200px]">
                {user?.full_name || 'Usuario'}
              </div>
              <div className="text-sm text-sidebar-foreground/70 dark:text-slate-400 truncate max-w-[200px]">
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Menú según rol */}
        {user?.role === 'admin' ? (
          // Menú completo para admin con todas las funcionalidades avanzadas
          <nav className="flex-1 overflow-y-auto py-2">
            {/* Sección Principal */}
            <div className="mb-8 px-2">
              <div className="text-xs font-semibold text-sidebar-foreground/60 dark:text-slate-400 uppercase tracking-wider px-4 py-2 mb-2">{t('Principal')}</div>
              <div className="h-px bg-gradient-to-r from-sidebar-border dark:from-slate-700 to-transparent mb-2"></div>
              <div className="space-y-1">
                {adminNavItem('dashboard', <BarChart3 size={18} />, t('Dashboard'))}
                {adminNavItem('usuarios', <Users size={18} />, t('Usuarios'), counts.users)}
                {adminNavItem('proyectos', <FolderKanban size={18} />, t('Proyectos'), counts.projects)}
                <NavLink
                  to="/admin/websy-ai"
                  className={({ isActive }) =>
                    `relative group cursor-pointer transition-all duration-300 ease-out hover:bg-sidebar-accent dark:hover:bg-slate-700 w-full
                    ${isActive ? 'bg-gradient-to-r from-sidebar-primary/10 to-sidebar-primary/5 dark:from-blue-900/20 dark:to-blue-800/10' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center px-4 py-3.5 space-x-4">
                        <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                          isActive 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                            : 'bg-sidebar-accent dark:bg-slate-700 text-sidebar-foreground/70 dark:text-slate-300 group-hover:bg-sidebar-primary/10 dark:group-hover:bg-blue-900/30 group-hover:text-sidebar-primary dark:group-hover:text-blue-400'
                        }`}>
                          <Bot size={18} />
                          {isActive && (
                            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-r-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-sidebar-foreground dark:text-slate-200 group-hover:text-sidebar-primary dark:group-hover:text-blue-400 transition-colors duration-200">
                            Websy AI
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          AI
                        </Badge>
                      </div>
                    </>
                  )}
                </NavLink>
                <NavLink
                  to="/admin/fases-tareas"
                  className={({ isActive }) =>
                    `relative group cursor-pointer transition-all duration-300 ease-out hover:bg-gray-50 dark:hover:bg-slate-700 w-full
                    ${isActive ? 'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-r-4 border-purple-500' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center px-4 py-3.5 space-x-4">
                        <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                          isActive 
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                        }`}>
                          {isActive && (
                            <div className="absolute inset-0 bg-purple-400 rounded-xl animate-ping opacity-25"></div>
                          )}
                          <div className="transition-transform duration-300 group-hover:scale-110">
                            <Target size={18} />
                          </div>
                        </div>
                        <span className={`font-medium text-sm flex-1 text-center ${
                          isActive ? 'text-gray-900 dark:text-slate-100' : 'text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100'
                        }`}>
                          Fases y Tareas
                        </span>
                        {isActive && (
                          <ChevronRight size={16} className="text-purple-500 animate-pulse" />
                        )}
                      </div>
                      {isActive && (
                        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-purple-400 to-purple-600 rounded-r-full"></div>
                      )}
                    </>
                  )}
                </NavLink>
                {adminNavItem('aprobar-proyectos', <CheckCircle size={18} />, 'Aprobar Proyectos', counts.pendingApprovals)}
                {adminNavItem('tickets', <Ticket size={18} />, t('Tickets'), counts.tickets)}
                {adminNavItem('pagos', <CreditCard size={18} />, t('Pagos'), counts.payments)}
                <NavLink
                  to="/team"
                  className={({ isActive }) =>
                    `relative group cursor-pointer transition-all duration-300 ease-out hover:bg-gray-50 dark:hover:bg-slate-700 w-full
                    ${isActive ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-r-4 border-blue-500' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center px-4 py-3.5 space-x-4">
                        <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                          isActive 
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}>
                          {isActive && (
                            <div className="absolute inset-0 bg-blue-400 rounded-xl animate-ping opacity-25"></div>
                          )}
                          <div className="transition-transform duration-300 group-hover:scale-110">
                            <Users size={18} />
                          </div>
                        </div>
                        <span className={`font-medium text-sm flex-1 text-center ${
                          isActive ? 'text-gray-900 dark:text-slate-100' : 'text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100'
                        }`}>
                          Equipo
                        </span>
                        {isActive && (
                          <ChevronRight size={16} className="text-blue-500 animate-pulse" />
                        )}
                      </div>
                      {isActive && (
                        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full"></div>
                      )}
                    </>
                  )}
                </NavLink>
              </div>
            </div>

            {/* ANÁLISIS */}
            <div className="mb-8 px-2">
              <div className="text-xs font-semibold text-sidebar-foreground/60 dark:text-slate-400 uppercase tracking-wider px-4 py-2 mb-2">
                {t('Análisis')}
              </div>
              <div className="h-px bg-gradient-to-r from-sidebar-border dark:from-slate-700 to-transparent mb-2"></div>
              <div className="space-y-1">
                {adminNavItem('advanced-analytics', <BarChart size={18} />, t('Analytics Avanzado'))}
                {adminNavItem('integraciones', <Calendar size={18} />, 'Integraciones')}
              </div>
            </div>



            {/* Sección Sistema */}
            <div className="mb-8 px-2">
              <div className="text-xs font-semibold text-sidebar-foreground/60 dark:text-slate-400 uppercase tracking-wider px-4 py-2 mb-2">Sistema</div>
              <div className="h-px bg-gradient-to-r from-sidebar-border dark:from-slate-700 to-transparent mb-2"></div>
              <div className="space-y-1">
                {adminNavItem('notifications', <Bell size={18} />, 'Notificaciones')}
                {navItem('/configuracion', <Settings size={18} />, 'Configuración')}
              </div>
            </div>
          </nav>
        ) : (
          // Menú solo para clientes
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {/* Sección Principal */}
            <div className="mb-6 px-2">
              <div className="text-xs font-semibold text-sidebar-foreground/60 dark:text-slate-400 uppercase tracking-wider px-4 py-2 mb-2">Principal</div>
              <div className="h-px bg-gradient-to-r from-sidebar-border dark:from-slate-700 to-transparent mb-2"></div>
              <div className="space-y-1">
                {navItem('/dashboard', <Home size={18} />, t('Dashboard'))}
                {navItem('/proyectos', <FolderKanban size={18} />, t('Proyectos'))}
                {navItem('/fases-tareas', <Target size={18} />, 'Fases y Tareas')}
              </div>
            </div>

            {/* Sección Personal */}
            <div className="mb-6 px-2">
              <div className="text-xs font-semibold text-sidebar-foreground/60 dark:text-slate-400 uppercase tracking-wider px-4 py-2 mb-2">Personal</div>
              <div className="h-px bg-gradient-to-r from-sidebar-border dark:from-slate-700 to-transparent mb-2"></div>
              <div className="space-y-1">
                {navItem('/perfil', <User size={18} />, t('Mi Perfil'))}
                {navItem('/facturacion', <CreditCard size={18} />, t('Facturación'))}
              </div>
            </div>

            {/* Sección Soporte */}
            <div className="mb-6 px-2">
              <div className="text-xs font-semibold text-sidebar-foreground/60 dark:text-slate-400 uppercase tracking-wider px-4 py-2 mb-2">Soporte</div>
              <div className="h-px bg-gradient-to-r from-sidebar-border dark:from-slate-700 to-transparent mb-2"></div>
              <div className="space-y-1">
                {navItem('/soporte', <HelpCircle size={18} />, t('Soporte'))}
                {navItem('/configuracion', <Settings size={18} />, t('Configuración'))}
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* Footer mejorado */}
      <div className="p-4 border-t border-sidebar-border dark:border-slate-700 bg-gradient-to-r from-sidebar-accent to-sidebar-background dark:from-slate-800 dark:to-slate-900">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full flex items-center space-x-3 px-3 py-3 text-sidebar-foreground dark:text-slate-200 hover:bg-destructive/10 dark:hover:bg-destructive/20 hover:text-destructive dark:hover:text-red-400 rounded-xl transition-all duration-300 group"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <LogOut size={18} />
              </TooltipTrigger>
              <TooltipContent>{t('Salir')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span>{t('Cerrar Sesión')}</span>
        </Button>
      </div>
    </aside>
  );
}
