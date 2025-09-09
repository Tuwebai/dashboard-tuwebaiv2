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
import { useMultiAI } from '@/hooks/useMultiAI';
import { useState, useEffect } from 'react';

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

  // Hook de Websy AI para generar saludos reales
  const { sendMessage, isLoading: aiLoading } = useMultiAI();
  const [aiGreeting, setAiGreeting] = useState<string>('');
  const [greetingGenerated, setGreetingGenerated] = useState(false);

  // Generar saludo con Websy AI real para Admin
  const generateAdminAIGreeting = async () => {
    if (!isAdminPage || greetingGenerated || aiLoading) return;

    try {
      const hour = new Date().getHours();
      const dayOfWeek = new Date().getDay();
      const userName = user?.full_name?.split(' ')[0] || 'Administrador';
      
      const prompt = `Genera un saludo personalizado y humano para el administrador ${userName}. 
      
      Contexto:
      - Hora actual: ${hour}:00
      - Día de la semana: ${dayOfWeek === 0 ? 'Domingo' : dayOfWeek === 1 ? 'Lunes' : dayOfWeek === 2 ? 'Martes' : dayOfWeek === 3 ? 'Miércoles' : dayOfWeek === 4 ? 'Jueves' : dayOfWeek === 5 ? 'Viernes' : 'Sábado'}
      - Eres Websy AI, el asistente de IA del sistema
      
      Instrucciones:
      - Saluda de manera natural y humana
      - Menciona que eres Websy AI
      - Adapta el tono según la hora del día
      - Usa emojis apropiados
      - Máximo 2 líneas
      - Sé creativo y personalizado
      
      Responde SOLO con el saludo, sin explicaciones adicionales.`;

      const response = await sendMessage(prompt, [], 'general');
      setAiGreeting(response);
      setGreetingGenerated(true);
    } catch (error) {
      console.error('Error generando saludo con IA:', error);
      // Fallback a saludo estático si falla la IA
      setAiGreeting('¡Hola! Websy AI aquí, listo para ayudarte 🤖');
      setGreetingGenerated(true);
    }
  };

  // Generar saludo con Websy AI real para Cliente
  const generateClientAIGreeting = async () => {
    if (!isClientDashboardPage || greetingGenerated || aiLoading) return;

    try {
      const hour = new Date().getHours();
      const dayOfWeek = new Date().getDay();
      const userName = user?.full_name?.split(' ')[0] || 'Usuario';
      const userEmail = user?.email || 'usuario@ejemplo.com';
      const userProjects = getUserProjects();
      const projectCount = userProjects.length;
      
      const prompt = `Genera un saludo personalizado y profesional para el cliente ${userName}. 
      
      Contexto del Cliente:
      - Nombre: ${userName}
      - Email: ${userEmail}
      - Hora actual: ${hour}:00
      - Día de la semana: ${dayOfWeek === 0 ? 'Domingo' : dayOfWeek === 1 ? 'Lunes' : dayOfWeek === 2 ? 'Martes' : dayOfWeek === 3 ? 'Miércoles' : dayOfWeek === 4 ? 'Jueves' : dayOfWeek === 5 ? 'Viernes' : 'Sábado'}
      - Proyectos activos: ${projectCount}
      - Eres Websy AI, el asistente de IA especializado en desarrollo web
      
      Instrucciones:
      - Saluda de manera profesional pero cálida
      - Menciona que eres Websy AI
      - Adapta el tono según la hora del día
      - Menciona brevemente sus proyectos si los tiene
      - Usa emojis apropiados
      - Máximo 2 líneas
      - Haz que se sienta que el dashboard está vivo y personalizado
      - Sé creativo y profesional
      
      Responde SOLO con el saludo, sin explicaciones adicionales.`;

      const response = await sendMessage(prompt, [], 'general');
      setAiGreeting(response);
      setGreetingGenerated(true);
    } catch (error) {
      console.error('Error generando saludo con IA:', error);
      // Fallback a saludo estático si falla la IA
      setAiGreeting('¡Hola! Websy AI aquí, listo para ayudarte con tus proyectos 🤖');
      setGreetingGenerated(true);
    }
  };

  // Generar saludo cuando se carga la página
  useEffect(() => {
    if (user && !greetingGenerated) {
      if (isAdminPage) {
        generateAdminAIGreeting();
      } else if (isClientDashboardPage) {
        generateClientAIGreeting();
      }
    }
  }, [isAdminPage, isClientDashboardPage, user, greetingGenerated]);

  // Resetear saludo cada 5 minutos para mantenerlo fresco
  useEffect(() => {
    if (isAdminPage || isClientDashboardPage) {
      const interval = setInterval(() => {
        setGreetingGenerated(false);
        if (isAdminPage) {
          generateAdminAIGreeting();
        } else if (isClientDashboardPage) {
          generateClientAIGreeting();
        }
      }, 5 * 60 * 1000); // 5 minutos

      return () => clearInterval(interval);
    }
  }, [isAdminPage, isClientDashboardPage]);

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
                  {aiGreeting || (aiLoading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Websy AI pensando en tu saludo...
                    </span>
                  ) : (
                    '¡Hola! Websy AI aquí, listo para ayudarte 🤖'
                  ))}
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
                <h1 className="text-3xl font-bold text-foreground">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    ¡Hola {user?.full_name?.split(' ')[0] || 'Usuario'}!
                  </span>
                  <span className="block text-lg sm:text-xl font-semibold text-slate-600 dark:text-slate-300 mt-1">
                    {aiGreeting || (aiLoading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Websy AI pensando en tu saludo...
                      </span>
                    ) : (
                      '¡Hola! Websy AI aquí, listo para ayudarte con tus proyectos 🤖'
                    ))}
                  </span>
                </h1>
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
