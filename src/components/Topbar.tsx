import { Bell, Search, Menu, Clock, RefreshCw } from 'lucide-react';
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
    <header className={`${isAdminPage || isClientDashboardPage ? 'h-auto' : 'h-16 sm:h-18'} bg-white border-b border-slate-200 shadow-sm`}>
      <div className={`flex items-center justify-between px-6 sm:px-8 ${isAdminPage || isClientDashboardPage ? 'py-6' : 'h-full'}`}>
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
              <h1 className="text-3xl font-bold text-slate-800">
                Panel de Administración
              </h1>
              <p className="text-slate-600 text-base font-medium mt-1">
                Gestiona usuarios, proyectos, tickets y pagos
              </p>
              {lastUpdate && (
                <div className="text-slate-500 text-sm flex items-center space-x-2 mt-2">
                  <Clock size={16} />
                  <span>Última actualización: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          ) : isClientDashboardPage ? (
            /* Client Dashboard Header */
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-800">
                Mi Dashboard
              </h1>
              <p className="text-slate-600 text-base font-medium mt-1">
                Gestiona y revisa el progreso de tus proyectos web
              </p>
              {lastUpdate && (
                <div className="text-slate-500 text-sm flex items-center space-x-2 mt-2">
                  <Clock size={16} />
                  <span>Última actualización: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          ) : (
            /* Regular Search */
            <div className="relative max-w-xs sm:max-w-md w-full">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent>Buscar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                placeholder="Buscar proyectos..."
                className="pl-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-border transition-all duration-300 hover:bg-slate-100"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Admin Panel Actions */}
          {isAdminPage ? (
            <div className="flex items-center space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefreshData}
                      className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-300"
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
          ) : isClientDashboardPage ? (
            /* Client Dashboard Actions */
            <div className="flex items-center space-x-4">
              {/* Barra de búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar proyectos..."
                  value={clientSearchTerm}
                  onChange={(e) => onClientSearch?.(e.target.value)}
                  className="pl-10 w-64 bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                />
              </div>
              
              {/* Notificación */}
              <NotificationBell />
              
              {/* Ayuda */}
              <HelpButton variant="minimal" />
              
              {/* Botón actualizar */}
              {onClientRefresh && (
                <Button
                  onClick={onClientRefresh}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              )}
            </div>
          ) : (
            /* Regular Stats */
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-sm">
                <span className="text-slate-600 font-medium">{t('Proyectos')}: </span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0 px-3 py-1.5 rounded-lg font-semibold">
                  {getUserProjects().length}
                </Badge>
              </div>
            </div>
          )}

          {/* User info */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 cursor-pointer border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 transform hover:scale-110 shadow-sm">
                  {user?.avatar ? (
                    <AvatarImage 
                      src={user.avatar} 
                      alt={`Avatar de ${user.full_name || user.email}`}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                    {(user?.full_name || user?.email || '').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 shadow-lg rounded-lg">
                <DropdownMenuItem 
                  onClick={() => navigate('/perfil')}
                  className="text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all duration-200"
                >
                  <UserIcon className="h-4 w-4 mr-3 text-blue-500" /> {t('Mi perfil')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200" />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-3" /> {t('Cerrar sesión')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
