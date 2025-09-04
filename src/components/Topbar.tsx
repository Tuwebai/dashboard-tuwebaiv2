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
    <header className={`${isAdminPage || isClientDashboardPage ? 'h-auto' : 'h-16 sm:h-18'} bg-background border-b border-border shadow-sm`}>
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
              <h1 className="text-3xl font-bold text-foreground">
                Panel de Administración
              </h1>
              <p className="text-muted-foreground text-base font-medium mt-1">
                Gestiona usuarios, proyectos, tickets y pagos
              </p>
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
              <h1 className="text-3xl font-bold text-foreground">
                Mi Dashboard
              </h1>
              <p className="text-muted-foreground text-base font-medium mt-1">
                Gestiona y revisa el progreso de tus proyectos web
              </p>
              {lastUpdate && (
                <div className="text-muted-foreground text-sm flex items-center space-x-2 mt-2">
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
          {/* Admin Panel Actions */}
          {isAdminPage ? (
            <div className="flex items-center space-x-4">
              <ThemeToggle variant="outline" size="sm" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefreshData}
                      className="bg-background border-border text-foreground hover:bg-muted hover:border-border transition-all duration-300"
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
              <ThemeToggle variant="outline" size="sm" />
              {/* Barra de búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar proyectos..."
                  value={clientSearchTerm}
                  onChange={(e) => onClientSearch?.(e.target.value)}
                  className="pl-10 w-64 bg-muted border-border text-foreground placeholder-muted-foreground"
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
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              )}
            </div>
          ) : (
            /* Regular Stats */
            <div className="hidden sm:flex items-center gap-4">
              <ThemeToggle variant="outline" size="sm" />
              <div className="text-sm">
                <span className="text-muted-foreground font-medium">{t('Proyectos')}: </span>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0 px-3 py-1.5 rounded-lg font-semibold">
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
              <DropdownMenuContent align="end" className="w-48 bg-popover border-border shadow-lg rounded-lg">
                <DropdownMenuItem 
                  onClick={() => navigate('/perfil')}
                  className="text-popover-foreground hover:text-popover-foreground hover:bg-muted rounded-lg transition-all duration-200"
                >
                  <UserIcon className="h-4 w-4 mr-3 text-primary" /> {t('Mi perfil')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
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
