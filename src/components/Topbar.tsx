import { Bell, Search, Menu, Clock, RefreshCw, Lightbulb, TrendingUp, Activity, Zap, Plus } from 'lucide-react';
import DynamicGreeting from '@/components/DynamicGreeting';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import { LogOut, User as UserIcon } from 'lucide-react';

import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import NotificationBell from '@/components/admin/NotificationBell';
import HelpButton from './tutorial/HelpButton';
import ThemeToggle from './ThemeToggle';

interface TopbarProps {
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
  onRefreshData?: () => void;
  lastUpdate?: Date;
  isAdmin?: boolean;
  isClientDashboard?: boolean;
  clientDashboardStats?: {
    totalProjects: number;
    totalComments: number;
    inProgressProjects: number;
    completedProjects: number;
  };
  onClientRefresh?: () => void;
  onClientSearch?: (term: string) => void;
  clientSearchTerm?: string;
}

export default function Topbar({ 
  onMenuClick, 
  showMobileMenu = false, 
  onRefreshData,
  lastUpdate,
  isAdmin = false,
  isClientDashboard = false,
  clientDashboardStats,
  onClientRefresh,
  onClientSearch,
  clientSearchTerm = ''
}: TopbarProps) {
  const { t } = useTranslation();
  const { user, getUserProjects, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPage = location.pathname === '/admin';
  const isClientDashboardPage = location.pathname === '/dashboard';

  return (
    <header className={`${isAdminPage || isClientDashboardPage ? 'h-auto' : 'h-16'} bg-background border-b border-border shadow-sm`}>
      <div className={`flex items-center justify-between px-6 ${isAdminPage || isClientDashboardPage ? 'py-6' : 'h-full'}`}>
        <div className="flex items-center gap-6">
          {/* Mobile menu button */}
          {showMobileMenu && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMenuClick}
                    className="md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-300"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Menú</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Admin Panel Header */}
          {isAdminPage ? (
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  ¡Hola {user?.full_name?.split(' ')[0] || 'Administrador'}!
                </span>
                <span className="block text-lg sm:text-xl font-semibold text-slate-600 dark:text-slate-300 mt-1">
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour >= 5 && hour < 12) return '¡Buenos días! Websy AI está listo para ayudarte a gestionar el sistema';
                    if (hour >= 12 && hour < 18) return '¡Buenas tardes! Todo funcionando perfectamente, ¿en qué puedo asistirte?';
                    if (hour >= 18 && hour < 22) return '¡Buenas tardes! El sistema está optimizado y listo para tus tareas';
                    return '¡Buenas noches! Websy AI monitorea todo mientras descansas, todo bajo control';
                  })()}
                </span>
              </h1>
              {lastUpdate && (
                <div className="text-muted-foreground text-sm flex items-center space-x-2 mt-2">
                  <Clock size={16} />
                  <span>Última actualización: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          ) : isClientDashboardPage ? (
            /* Client Dashboard Header */
            <div className="flex-1">
              <div>
                <DynamicGreeting userName={user?.full_name?.split(' ')[0] || 'Usuario'} />
                {lastUpdate && (
                  <div className="text-muted-foreground text-sm flex items-center space-x-2 mt-2">
                    <Clock size={16} />
                    <span>Última actualización: {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Regular Search */
            <div className="relative max-w-xs sm:max-w-md w-full">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Buscar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                placeholder="Buscar proyectos..."
                className="pl-12 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-border transition-all duration-300 hover:bg-muted/80"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Admin Panel Actions - Diseño Profesional */}
          {isAdminPage ? (
            <div className="flex items-center space-x-3">
              <ThemeToggle variant="outline" size="sm" />
              
              {/* Botones de acción agrupados */}
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefreshData}
                        className="h-9 px-4 border-border hover:bg-muted hover:border-primary/50 transition-all duration-200"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualizar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Recargar datos desde la base de datos</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <NotificationBell />
                <HelpButton variant="minimal" />
              </div>
            </div>
          ) : isClientDashboardPage ? (
            /* Client Dashboard Actions - Diseño Profesional */
            <div className="flex items-center space-x-3">
              <ThemeToggle variant="outline" size="sm" />
              
              {/* Barra de búsqueda mejorada */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar proyectos..."
                  value={clientSearchTerm}
                  onChange={(e) => onClientSearch?.(e.target.value)}
                  className="pl-10 w-64 h-9 bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                />
              </div>
              
              {/* Botones de acción */}
              <div className="flex items-center space-x-2">
                <NotificationBell />
                <HelpButton variant="minimal" />
                
                {/* Botón actualizar mejorado */}
                {onClientRefresh && (
                  <Button
                    onClick={onClientRefresh}
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 border-border hover:bg-muted hover:border-primary/50 transition-all duration-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Regular Stats - Diseño Limpio y Profesional */
            <div className="hidden sm:flex items-center gap-4">
              <ThemeToggle variant="outline" size="sm" />
              
              {/* Contador de Proyectos Simplificado */}
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t('Proyectos')}:
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {getUserProjects().length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* User info - Diseño Limpio */}
          <div className="flex items-center gap-3">
            {/* Avatar Simplificado */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Avatar className="h-10 w-10">
                    {user?.avatar ? (
                      <AvatarImage 
                        src={user.avatar} 
                        alt={`Avatar de ${user.full_name || user.email}`}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-blue-500 text-white font-semibold">
                      {(user?.full_name || user?.email || '').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {user?.avatar ? (
                        <AvatarImage 
                          src={user.avatar} 
                          alt={`Avatar de ${user.full_name || user.email}`}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-blue-500 text-white font-semibold">
                        {(user?.full_name || user?.email || '').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {user?.full_name || 'Usuario'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <DropdownMenuItem 
                    onClick={() => navigate('/perfil')}
                    className="cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4 mr-3" /> 
                    {t('Mi perfil')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout();
                      navigate('/login');
                    }}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-3" /> 
                    {t('Cerrar sesión')}
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
