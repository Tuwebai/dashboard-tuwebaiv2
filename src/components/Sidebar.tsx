import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
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
  GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import { useEffect, useState, useCallback } from 'react';

import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const { user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    users: 0,
    projects: 0,
    tickets: 0,
    payments: 0,
    pendingApprovals: 0
  });
  const { t } = useTranslation();

  // Cargar contadores con Supabase
  const loadCounts = useCallback(async () => {
    try {
      // Cargar contadores desde Supabase
      const [usersResult, projectsResult, ticketsResult, paymentsResult, approvalsResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('projects').select('id', { count: 'exact' }),
        supabase.from('tickets').select('id', { count: 'exact' }),
        user?.role === 'admin' 
          ? supabase.from('payments').select('id', { count: 'exact' })
          : supabase.from('payments').select('id', { count: 'exact' }).eq('user_id', user.id),
        user?.role === 'admin' 
          ? supabase.from('projects').select('id', { count: 'exact' }).eq('approval_status', 'pending')
          : Promise.resolve({ count: 0 })
      ]);

      setCounts({
        users: usersResult.count || 0,
        projects: projectsResult.count || 0,
        tickets: ticketsResult.count || 0,
        payments: paymentsResult.count || 0,
        pendingApprovals: approvalsResult.count || 0
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
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadCounts();
    }
  }, [user?.role]);

  const navItem = (to: string, icon: JSX.Element, label: string, count?: number, badge?: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative group cursor-pointer transition-all duration-300 ease-out hover:bg-gray-50 w-full
        ${isActive ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : ''}`
      }
      aria-label={`Navegar a ${label}`}
      aria-describedby={count ? `count-${label.toLowerCase()}` : undefined}
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center px-4 py-3.5 space-x-4">
            <div className={`relative p-2 rounded-xl transition-all duration-300 ${
              isActive 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
            }`}>
              {icon}
              {/* Indicador azul al lado del icono */}
              {isActive && (
                <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                {label}
              </span>
              {count !== undefined && (
                <div 
                  id={`count-${label.toLowerCase()}`}
                  className="text-xs text-gray-500 mt-1"
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
        className={`relative group cursor-pointer transition-all duration-300 ease-out hover:bg-gray-50 w-full
        ${isActive ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : ''}`}
      >
        <div className="flex items-center px-4 py-3.5 space-x-4">
          <div className={`relative p-2 rounded-xl transition-all duration-300 ${
            isActive 
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
              : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
          }`}>
            <div className="transition-transform duration-300 group-hover:scale-110">
              {icon}
            </div>
            {/* Indicador azul al lado del icono */}
            {isActive && (
              <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"></div>
            )}
          </div>
          <span className={`font-medium text-sm flex-1 text-center ${
            isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
          }`}>
            {t(label)}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            {count !== undefined && (
              <Badge variant="secondary" className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                isActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-red-100 text-red-600 group-hover:bg-red-500 group-hover:text-white'
              }`}>
                {count}
              </Badge>
            )}
            {badge && (
              <Badge variant="destructive" className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                isActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-red-100 text-red-600 group-hover:bg-red-500 group-hover:text-white'
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
    <aside className="w-80 h-screen bg-white border-r border-gray-200 flex flex-col shadow-xl">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header visual mejorado */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
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
              <div className="font-bold text-xl text-gray-900 truncate max-w-[200px]">
                {user?.full_name || 'Usuario'}
              </div>
              <div className="text-sm text-gray-500 truncate max-w-[200px]">
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
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">{t('Principal')}</div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
              <div className="space-y-1">
                {adminNavItem('dashboard', <BarChart3 size={18} />, t('Dashboard'))}
                {adminNavItem('usuarios', <Users size={18} />, t('Usuarios'), counts.users)}
                {adminNavItem('proyectos', <FolderKanban size={18} />, t('Proyectos'), counts.projects)}
                {adminNavItem('aprobar-proyectos', <CheckCircle size={18} />, 'Aprobar Proyectos', counts.pendingApprovals)}
                {adminNavItem('tickets', <Ticket size={18} />, t('Tickets'), counts.tickets)}
                {adminNavItem('pagos', <CreditCard size={18} />, t('Pagos'), counts.payments)}
                <NavLink
                  to="/team"
                  className={({ isActive }) =>
                    `relative group cursor-pointer transition-all duration-300 ease-out hover:bg-gray-50 w-full
                    ${isActive ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center px-4 py-3.5 space-x-4">
                        <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                          isActive 
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                        }`}>
                          {isActive && (
                            <div className="absolute inset-0 bg-blue-400 rounded-xl animate-ping opacity-25"></div>
                          )}
                          <div className="transition-transform duration-300 group-hover:scale-110">
                            <Users size={18} />
                          </div>
                        </div>
                        <span className={`font-medium text-sm flex-1 text-center ${
                          isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
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
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">
                {t('Análisis')}
              </div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
              <div className="space-y-1">
                {adminNavItem('advanced-analytics', <BarChart size={18} />, t('Analytics Avanzado'))}
              </div>
            </div>



            {/* Sección Sistema */}
            <div className="mb-8 px-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">Sistema</div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
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
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">Principal</div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
              <div className="space-y-1">
                {navItem('/dashboard', <Home size={18} />, t('Dashboard'))}
                {navItem('/proyectos', <FolderKanban size={18} />, t('Proyectos'))}
              </div>
            </div>

            {/* Sección Personal */}
            <div className="mb-6 px-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">Personal</div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
              <div className="space-y-1">
                {navItem('/perfil', <User size={18} />, t('Mi Perfil'))}
                {navItem('/facturacion', <CreditCard size={18} />, t('Facturación'))}
              </div>
            </div>

            {/* Sección Soporte */}
            <div className="mb-6 px-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mb-2">Soporte</div>
              <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
              <div className="space-y-1">
                {navItem('/soporte', <HelpCircle size={18} />, t('Soporte'))}
                {navItem('/configuracion', <Settings size={18} />, t('Configuración'))}
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* Footer mejorado */}
      <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-300 group"
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
