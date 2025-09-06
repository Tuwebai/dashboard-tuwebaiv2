import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { useLandingStats } from '@/hooks/useLandingStats';
import { 
  Eye, 
  EyeOff, 
  Github, 
  Chrome, 
  Zap, 
  CheckCircle, 
  BarChart3, 
  Users, 
  Settings, 
  Target,
  Activity,
  TrendingUp,
  Shield,
  Clock,
  Star,
  RefreshCw,
  X,
  MessageSquare
} from 'lucide-react';

const LandingPage = React.memo(() => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [demoTheme, setDemoTheme] = useState<'light' | 'dark'>('dark'); // Tema independiente para el dashboard demo
  const { login, loginWithGoogle, loginWithGithub } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { stats, loading: statsLoading, error: statsError } = useLandingStats();

  // Estilos CSS optimizados con useMemo
  const cssStyles = useMemo(() => `
    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
    
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    /* Forzar layout del header */
    .header-container {
      display: flex !important;
      align-items: center !important;
      width: 100% !important;
      height: 4rem !important;
    }
    
    .header-left {
      display: flex !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }
    
    .header-center {
      flex: 1 !important;
      display: flex !important;
      justify-content: center !important;
      padding: 0 1rem !important;
    }
    
    .header-right {
      display: flex !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }
  `, []);

  // Agregar estilos CSS para las animaciones
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = cssStyles;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [cssStyles]);

  // Callbacks optimizados
  const closeImagePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && previewImage) {
      closeImagePreview();
    }
  }, [previewImage, closeImagePreview]);

  // Manejar tecla ESC para cerrar modal
  useEffect(() => {
    if (previewImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [previewImage, handleKeyDown]);

  // Auto-play demo optimizado
  const demos = useMemo(() => ['projects', 'analytics', 'team', 'settings'], []);
  
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setActiveDemo(prev => {
        const currentIndex = demos.indexOf(prev || '');
        const nextIndex = (currentIndex + 1) % demos.length;
        return demos[nextIndex];
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isPlaying, demos]);


  const handleDemoAction = useCallback((action: string) => {
    setActiveDemo(action);
  }, []);

  const handleImagePreview = useCallback((imageSrc: string) => {
    setPreviewImage(imageSrc);
  }, []);

  const toggleDemoTheme = useCallback(() => {
    setDemoTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigate(email.toLowerCase() === 'tuwebai@gmail.com' ? '/admin' : '/dashboard');
      } else {
        toast({
          title: "Error",
          description: "Credenciales inválidas o usuario no registrado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, login, navigate]);

  const handleGoogleLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión con Google.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loginWithGoogle, navigate]);

  const handleGithubLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      await loginWithGithub();
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión con GitHub.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loginWithGithub, navigate]);

  const demoCards = useMemo(() => [
    {
      id: 'projects',
      title: 'Gestión de Proyectos',
      description: 'Organiza y supervisa todos tus proyectos web',
      icon: Target,
      color: 'from-blue-500 to-blue-600',
      stats: { active: 12, completed: 8, pending: 4 }
    },
    {
      id: 'analytics',
      title: 'Analytics Avanzado',
      description: 'Métricas detalladas y reportes en tiempo real',
      icon: BarChart3,
      color: 'from-green-500 to-green-600',
      stats: { views: '2.4K', growth: '+12%', conversion: '8.2%' }
    },
    {
      id: 'team',
      title: 'Gestión de Equipo',
      description: 'Colabora eficientemente con tu equipo',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      stats: { members: 8, active: 6, tasks: 24 }
    },
    {
      id: 'settings',
      title: 'Configuración',
      description: 'Personaliza tu experiencia de trabajo',
      icon: Settings,
      color: 'from-orange-500 to-orange-600',
      stats: { integrations: 5, notifications: 12, custom: 3 }
    }
  ], []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" style={{ 
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'auto',
      scrollBehavior: 'auto'
    }}>
      {/* Header fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border" style={{ zIndex: 9999 }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Logo y nombre - IZQUIERDA */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <div className="bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-lg sm:rounded-xl p-1.5 sm:p-2">
                <img src="/logoweb.jpg" alt="TuWebAI" className="h-6 w-6 sm:h-8 sm:w-8 object-contain rounded" loading="eager" />
              </div>
              <span className="text-sm sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent hidden sm:block">
                TuWebAI - Dashboard Profesional
              </span>
              <span className="text-sm font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent sm:hidden">
                TuWebAI
              </span>
            </div>

            {/* Social proof - CENTRO (solo en desktop) */}
            <div className="hidden lg:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">
                  {statsLoading ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Cargando...</span>
                    </div>
                  ) : (
                    `Más de ${stats.totalTeams.toLocaleString()} equipos confían en nosotros`
                  )}
                </span>
              </div>
            </div>

            {/* Botones - DERECHA */}
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
              <ThemeToggle variant="outline" size="sm" className="hidden sm:flex" />
              <div className="hidden md:flex items-center space-x-2">
              <Button 
                variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-foreground text-xs sm:text-sm"
                onClick={() => navigate('/login')}
              >
                  Iniciar Sesión
              </Button>
              <Button 
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => navigate('/pricing')}
                >
                  Planes
                </Button>
              </div>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-emerald-600 hover:from-cyan-600 hover:to-emerald-700 text-xs sm:text-sm px-2 sm:px-4"
                onClick={() => setActiveDemo('dashboard')}
              >
                <span className="hidden sm:inline">Demo Gratuito</span>
                <span className="sm:hidden">Demo</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 sm:pt-20 pb-12 sm:pb-20 bg-gradient-to-br from-muted/50 to-background min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
            {/* Contenido del hero */}
            <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
              <div className="space-y-4 sm:space-y-6">
                {/* Value Props Badges */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-100 text-green-800 text-xs sm:text-sm font-medium">
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Setup en 5 minutos</span>
                    <span className="sm:hidden">5 min setup</span>
                  </div>
                  <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Prueba gratuita 14 días</span>
                    <span className="sm:hidden">14 días gratis</span>
                  </div>
                  <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-purple-100 text-purple-800 text-xs sm:text-sm font-medium">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Sin tarjeta de crédito</span>
                    <span className="sm:hidden">Sin tarjeta</span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  El dashboard que necesitas para{' '}
                  <span className="bg-gradient-to-r from-cyan-500 to-emerald-600 bg-clip-text text-transparent">
                    escalar tu negocio
                  </span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  Gestiona proyectos, equipos y métricas desde una sola plataforma. Sin complicaciones, sin curvas de aprendizaje.
                </p>

                {/* Social Proof */}
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1 sm:-space-x-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-xs font-bold">B</span>
                      </div>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-xs font-bold">C</span>
                      </div>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-xs font-bold">+</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-foreground">Usado por {stats.totalTeams}+ equipos</p>
                      <p className="text-xs text-muted-foreground">Empresas que confían en nosotros</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTAs principales */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button 
                  size="lg"
                  className="h-12 sm:h-14 px-6 sm:px-8 bg-gradient-to-r from-cyan-500 to-emerald-600 hover:from-cyan-600 hover:to-emerald-700 text-white font-semibold text-sm sm:text-base"
                  onClick={() => navigate('/register')}
                >
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Probar gratis por 14 días</span>
                    <span className="sm:hidden">Probar gratis</span>
                  </div>
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="h-12 sm:h-14 px-6 sm:px-8 border-2 text-sm sm:text-base"
                  onClick={() => setActiveDemo('dashboard')}
                >
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Ver demo en vivo</span>
                    <span className="sm:hidden">Ver demo</span>
                  </div>
                </Button>
              </div>

              {/* Formulario de login compacto */}
              <div className="mt-6 sm:mt-8">
                <Card className="p-4 sm:p-6 shadow-xl border-0 bg-card/80 backdrop-blur-sm">
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-card-foreground text-center">¿Ya tienes cuenta?</h3>
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                          <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-card-foreground">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                            className="mt-1 h-9 sm:h-10 bg-input text-foreground border-border text-sm"
                      />
                    </div>
                    <div>
                          <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-card-foreground">Contraseña</Label>
                      <div className="relative mt-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                              className="h-9 sm:h-10 pr-12 bg-input text-foreground border-border text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                              className="absolute right-0 top-0 h-full px-2 sm:px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                              {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </Button>
                          </div>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                        className="w-full h-9 sm:h-10 bg-gradient-to-r from-cyan-500 to-emerald-600 hover:from-cyan-600 hover:to-emerald-700 text-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            <span className="hidden sm:inline">Iniciando sesión...</span>
                            <span className="sm:hidden">Iniciando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Iniciar Sesión</span>
                        </div>
                      )}
                    </Button>
                  </form>

                    <div className="flex flex-col space-y-2">
                    <Button 
                      variant="outline" 
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                        className="h-9 sm:h-10 text-xs sm:text-sm"
                    >
                        <Chrome className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Continuar con Google</span>
                        <span className="sm:hidden">Google</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleGithubLogin}
                      disabled={isLoading}
                        className="h-9 sm:h-10 text-xs sm:text-sm"
                    >
                        <Github className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Continuar con GitHub</span>
                        <span className="sm:hidden">GitHub</span>
                    </Button>
                  </div>
                </div>
              </Card>
              </div>
            </div>

            {/* Mockup 3D del dashboard */}
            <div className="relative w-full order-1 lg:order-2">
              <div className="relative transform rotate-1 sm:rotate-2 lg:rotate-3 hover:rotate-0 transition-transform duration-700 ease-out max-w-sm sm:max-w-md mx-auto">
                <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">
                  <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-lg"></div>
                        <span className="font-semibold text-card-foreground text-sm sm:text-base">Dashboard</span>
                      </div>
                      <div className="flex space-x-1 sm:space-x-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    {/* Métricas Principales */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                          <div className="text-right">
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">+12%</span>
                      </div>
                        </div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">2,847</div>
                        <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Usuarios Activos</div>
                        <div className="text-xs text-gray-500">+342 este mes</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                          <div className="text-right">
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">+8%</span>
                      </div>
                        </div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">127</div>
                        <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Proyectos Activos</div>
                        <div className="text-xs text-gray-500">+15 este mes</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                          <div className="text-right">
                            <span className="text-xs font-medium text-red-600 bg-red-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">-5%</span>
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">23</div>
                        <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Tickets Abiertos</div>
                        <div className="text-xs text-gray-500">3 urgentes</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">+24%</span>
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">$47.2K</div>
                        <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Ingresos Mensuales</div>
                        <div className="text-xs text-gray-500">+$9.1K este mes</div>
                      </div>
                    </div>

                    {/* Progreso de Proyectos */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200/50 shadow-lg mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800">Progreso de Proyectos</h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ml-auto">87%</span>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <div>
                          <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                            <span className="truncate">Dashboard Admin</span>
                            <span>78%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-1.5 sm:h-2 rounded-full" style={{width: '78%'}}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                            <span className="truncate">API Backend</span>
                            <span>92%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 sm:h-2 rounded-full" style={{width: '92%'}}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                            <span className="truncate">Frontend React</span>
                            <span>95%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 sm:h-2 rounded-full" style={{width: '95%'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actividad Reciente */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200/50 shadow-lg mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800">Actividad Reciente</h3>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">Tarea completada</p>
                            <p className="text-xs text-gray-500 truncate">Implementar autenticación JWT - hace 2 min</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">Proyecto actualizado</p>
                            <p className="text-xs text-gray-500 truncate">Dashboard Admin v2.1 - hace 15 min</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">Nuevo miembro</p>
                            <p className="text-xs text-gray-500 truncate">Ana García se unió al equipo - hace 1 hora</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estado del Equipo */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200/50 shadow-lg">
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800">Estado del Equipo</h3>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-800">Equipo Activo</p>
                            <p className="text-xs text-gray-500">Trabajando en tus proyectos</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-800">Comunicación</p>
                            <p className="text-xs text-gray-500">Respuesta en 2-4 horas</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Efectos de iluminación */}
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-3xl blur-xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Secciones alternadas - IMAGEN IZQUIERDA, TEXTO DERECHA */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* IMAGEN - IZQUIERDA */}
            <div className="relative order-1 lg:order-1">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                <div className="relative transform -rotate-1 hover:rotate-0 transition-all duration-700 ease-out">
                  <div className="bg-white rounded-2xl p-2 shadow-2xl cursor-pointer" onClick={() => handleImagePreview('/dashboardadmin.png')}>
                    <img 
                      src="/dashboardadmin.png" 
                      alt="Dashboard Admin mostrando gestión de proyectos" 
                      className="w-full h-auto rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
                {/* Elementos flotantes que complementan la imagen */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">5 Proyectos activos</span>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">6 Usuarios</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TEXTO - DERECHA */}
            <div className="space-y-6 sm:space-y-8 order-2 lg:order-2">
              <div className="space-y-3 sm:space-y-4">
                <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-100 text-green-800 text-xs sm:text-sm font-medium">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Productividad 10x</span>
                  <span className="sm:hidden">10x Productividad</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Todo tu equipo sincronizado{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">en tiempo real</span>
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                  Elimina el caos de proyectos dispersos. Centraliza tareas, deadlines y comunicación en un solo lugar.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Tableros Kanban personalizables</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Organiza tareas como prefieras</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Notificaciones inteligentes</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Solo lo que realmente importa</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Integraciones con 50+ herramientas</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Conecta todo tu stack tecnológico</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Automatizaciones que ahorran 5 horas/semana</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Tareas repetitivas eliminadas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas destacadas */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
                <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
                    <div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{stats.meetingTimeReduction}%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Menos tiempo en reuniones</div>
                    </div>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.productivityIncrease}%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Aumento en productividad</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{stats.timeSaved}h</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Ahorradas por semana</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-muted/30 to-muted/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6 sm:space-y-8 order-1 lg:order-1">
              <div className="space-y-3 sm:space-y-4">
                <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-100 text-green-800 text-xs sm:text-sm font-medium">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Insights Accionables</span>
                  <span className="sm:hidden">Insights</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Decisiones basadas en datos,{' '}
                  <span className="bg-gradient-to-r from-green-600 to-cyan-600 bg-clip-text text-transparent">no en intuición</span>
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                  Visualiza el rendimiento real de tus proyectos y equipos con métricas que realmente importan para tu negocio.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Dashboards personalizables por rol</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Cada miembro ve lo que necesita</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Reportes automáticos por email/Slack</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Información clave sin esfuerzo</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Predicciones de entrega con IA</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Anticipa retrasos antes de que ocurran</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">ROI tracking por proyecto</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Mide el retorno real de cada inversión</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas de impacto */}
              <div className="bg-gradient-to-r from-green-50 to-cyan-50 dark:from-green-900/20 dark:to-cyan-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-200 dark:border-green-800">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-center">
                    <div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{stats.predictionAccuracy}%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Precisión en predicciones</div>
                    </div>
                  <div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{stats.decisionSpeed}x</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Más rápido en decisiones</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{stats.projectDelayReduction}%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Menos proyectos retrasados</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">+{stats.averageROI}%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">ROI promedio</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative order-2 lg:order-2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                <div className="relative transform rotate-1 hover:rotate-0 transition-all duration-700 ease-out">
                  <div className="bg-white rounded-2xl p-2 shadow-2xl cursor-pointer" onClick={() => handleImagePreview('/analisislandingpage.png')}>
                    <img 
                      src="/analisislandingpage.png" 
                      alt="Dashboard Cliente mostrando análisis y métricas" 
                      className="w-full h-auto rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
                {/* Elementos flotantes que complementan la imagen */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Datos en vivo</span>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">+24% este mes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-3 sm:space-y-4">
                <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-100 text-green-800 text-xs sm:text-sm font-medium">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Seguridad Nivel Empresarial</span>
                  <span className="sm:hidden">Seguridad Empresarial</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  Tus datos más seguros que{' '}
                  <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">en un banco</span>
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed">
                  Cumplimos con las regulaciones más estrictas. Tu información está protegida 24/7 con los más altos estándares de seguridad.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-white">Certificación SOC2 + ISO 27001</h3>
                      <p className="text-xs sm:text-sm text-gray-300">Estándares de seguridad más exigentes</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-white">Encriptación AES-256</h3>
                      <p className="text-xs sm:text-sm text-gray-300">Protección militar de tus datos</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-white">Backup diario automático</h3>
                      <p className="text-xs sm:text-sm text-gray-300">Nunca pierdas información importante</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-white">SLA 99.9% uptime garantizado</h3>
                      <p className="text-xs sm:text-sm text-gray-300">Disponibilidad casi perfecta</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificaciones destacadas */}
              <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-center">
                    <div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">SOC2</div>
                    <div className="text-xs sm:text-sm text-gray-300">Certificado</div>
                    </div>
                  <div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-400">ISO 27001</div>
                    <div className="text-xs sm:text-sm text-gray-300">Certificado</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-400">AES-256</div>
                    <div className="text-xs sm:text-sm text-gray-300">Encriptación</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-400">99.9%</div>
                    <div className="text-xs sm:text-sm text-gray-300">Uptime SLA</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative order-2 lg:order-2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                <div className="relative transform -rotate-1 hover:rotate-0 transition-all duration-700 ease-out">
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-700">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-8 w-8 text-green-400" />
                        <span className="text-white text-xl font-semibold">Panel de Seguridad</span>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 text-sm">Encriptación SSL/TLS</span>
                            <div className="flex space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-2 h-2 bg-green-500 rounded-full"></div>
                              ))}
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full w-full"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 text-sm">Backup Automático</span>
                            <div className="flex space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-2 h-2 bg-green-500 rounded-full"></div>
                              ))}
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full w-full"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 text-sm">Monitoreo 24/7</span>
                            <div className="flex space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-2 h-2 bg-green-500 rounded-full"></div>
                              ))}
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full w-full"></div>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-gray-700">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-sm font-medium">Sistema Seguro</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Elementos flotantes que complementan la imagen */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">100% Seguro</span>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">24/7 Monitoreo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Interactivo Real */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-foreground">
              Prueba todas las funciones{' '}
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">ahora mismo</span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-muted-foreground mb-6">
              Dashboard completamente funcional con datos reales simulados. Sin registros, sin esperas.
            </p>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              Demo usada {stats.demoUsage.toLocaleString()} veces esta semana
            </div>
          </div>

          {/* Dashboard Interactivo 3D Profesional */}
          <div className={`rounded-2xl overflow-hidden transition-all duration-500 transform hover:scale-105 ${demoTheme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-700 shadow-2xl shadow-slate-900/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200 shadow-2xl shadow-gray-900/20'}`}>
            {/* Header del Dashboard */}
            <div className={`px-6 py-5 transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600' : 'bg-gradient-to-r from-gray-900 to-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-white'}`}>TuWebAI Dashboard</h3>
                    <p className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-cyan-300' : 'text-gray-300'}`}>Demo Interactivo • Actualizado hace 2 min</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>En vivo</span>
                    </div>
                  </div>
                  <button
                    onClick={toggleDemoTheme}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      demoTheme === 'dark' 
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
                    }`}
                  >
                    {demoTheme === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
                  </button>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido del Dashboard */}
            <div className={`p-6 transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
              {/* Sidebar y Main Content */}
              <div className="grid lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <div className="space-y-4">
                    <div className={`rounded-lg p-4 transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-slate-800 border border-slate-700 shadow-lg' : 'bg-gray-50'}`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-sm">E</span>
                        </div>
                        <div>
                          <p className={`font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Usuario Demo</p>
                          <p className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>demo@tuwebai.com</p>
                        </div>
                      </div>
                    </div>
                    
                    <nav className="space-y-2">
                      <button 
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${activeDemo === 'dashboard' ? (demoTheme === 'dark' ? 'bg-blue-900/50 text-blue-300 border border-blue-700 shadow-md' : 'bg-blue-50 text-blue-700') : (demoTheme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent hover:border-slate-600' : 'text-gray-600 hover:bg-gray-50')}`}
                        onClick={() => handleDemoAction('dashboard')}
                      >
                        <Target className="h-4 w-4" />
                        <span className="text-sm font-medium">Dashboard</span>
                      </button>
                      <button 
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${activeDemo === 'projects' ? (demoTheme === 'dark' ? 'bg-blue-900/50 text-blue-300 border border-blue-700 shadow-md' : 'bg-blue-50 text-blue-700') : (demoTheme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent hover:border-slate-600' : 'text-gray-600 hover:bg-gray-50')}`}
                        onClick={() => handleDemoAction('projects')}
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-sm">Proyectos</span>
                      </button>
                      <button 
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${activeDemo === 'team' ? (demoTheme === 'dark' ? 'bg-blue-900/50 text-blue-300 border border-blue-700 shadow-md' : 'bg-blue-50 text-blue-700') : (demoTheme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent hover:border-slate-600' : 'text-gray-600 hover:bg-gray-50')}`}
                        onClick={() => handleDemoAction('team')}
                      >
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Equipo</span>
                      </button>
                      <button 
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${activeDemo === 'settings' ? (demoTheme === 'dark' ? 'bg-blue-900/50 text-blue-300 border border-blue-700 shadow-md' : 'bg-blue-50 text-blue-700') : (demoTheme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent hover:border-slate-600' : 'text-gray-600 hover:bg-gray-50')}`}
                        onClick={() => handleDemoAction('settings')}
                      >
                        <Settings className="h-4 w-4" />
                        <span className="text-sm">Configuración</span>
                      </button>
                    </nav>
                  </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <h1 className={`text-2xl font-bold transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Mi Dashboard</h1>
                      <p className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Gestiona y revisa el progreso de tus proyectos web</p>
                    </div>

                    {/* Stats Cards Profesionales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className={`rounded-xl p-6 hover:shadow-xl transition-all duration-300 group ${demoTheme === 'dark' ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50 shadow-lg shadow-blue-900/20' : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-blue-600' : 'bg-blue-100'}`}>
                            <Target className="h-6 w-6 text-blue-600" />
                        </div>
                          <div className={`text-right transition-colors duration-300 ${demoTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                            <span className="text-sm font-medium">+12%</span>
                          </div>
                        </div>
                        <div>
                          <p className={`text-sm font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Proyectos Activos</p>
                          <p className={`text-3xl font-bold transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>24</p>
                          <p className={`text-xs mt-1 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>+3 este mes</p>
                        </div>
                      </div>

                      <div className={`rounded-xl p-6 hover:shadow-xl transition-all duration-300 group ${demoTheme === 'dark' ? 'bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700/50 shadow-lg shadow-green-900/20' : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-green-600' : 'bg-green-100'}`}>
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                          <div className={`text-right transition-colors duration-300 ${demoTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                            <span className="text-sm font-medium">+18%</span>
                          </div>
                        </div>
                        <div>
                          <p className={`text-sm font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tareas Completadas</p>
                          <p className={`text-3xl font-bold transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>1,247</p>
                          <p className={`text-xs mt-1 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>+156 esta semana</p>
                        </div>
                      </div>

                      <div className={`rounded-xl p-6 hover:shadow-xl transition-all duration-300 group ${demoTheme === 'dark' ? 'bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700/50 shadow-lg shadow-purple-900/20' : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-purple-600' : 'bg-purple-100'}`}>
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                          <div className={`text-right transition-colors duration-300 ${demoTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                            <span className="text-sm font-medium">+2</span>
                          </div>
                        </div>
                        <div>
                          <p className={`text-sm font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Equipo Activo</p>
                          <p className={`text-3xl font-bold transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>18</p>
                          <p className={`text-xs mt-1 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>100% online</p>
                        </div>
                      </div>

                      <div className={`rounded-xl p-6 hover:shadow-xl transition-all duration-300 group ${demoTheme === 'dark' ? 'bg-gradient-to-br from-orange-900/40 to-orange-800/40 border border-orange-700/50 shadow-lg shadow-orange-900/20' : 'bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-orange-600' : 'bg-orange-100'}`}>
                            <TrendingUp className="h-6 w-6 text-orange-600" />
                        </div>
                          <div className={`text-right transition-colors duration-300 ${demoTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                            <span className="text-sm font-medium">+8%</span>
                          </div>
                        </div>
                        <div>
                          <p className={`text-sm font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Progreso General</p>
                          <p className={`text-3xl font-bold transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>87%</p>
                          <p className={`text-xs mt-1 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>+12% este mes</p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Demo Panel */}
                    {activeDemo && (
                      <div className={`rounded-lg p-6 border transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-slate-800 border-slate-600 shadow-lg shadow-slate-900/50' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`text-lg font-semibold transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {demoCards.find(card => card.id === activeDemo)?.title} - Demo Interactivo
                          </h3>
                          <button 
                            onClick={() => setActiveDemo(null)}
                            className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            ✕
                          </button>
                        </div>
                        
                        {activeDemo === 'dashboard' && (
                          <div className="space-y-6">
                            {/* Widgets del Dashboard */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Widget de Actividad Reciente */}
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className={`font-semibold transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Actividad Reciente</h4>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Nuevo proyecto "E-commerce" creado</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Tarea completada por Ana García</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Comentario en "Landing Page"</span>
                                  </div>
                                </div>
                              </div>

                              {/* Widget de Progreso de Proyectos */}
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className={`font-semibold transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Progreso de Proyectos</h4>
                                  <span className="text-xs text-green-600 font-medium">+15%</span>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>E-commerce App</span>
                                      <span className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>75%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '75%'}}></div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Landing Page</span>
                                      <span className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>90%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-green-500 h-2 rounded-full" style={{width: '90%'}}></div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Dashboard Admin</span>
                                      <span className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>45%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '45%'}}></div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Widget de Equipo */}
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className={`font-semibold transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Equipo Activo</h4>
                                  <span className="text-xs text-green-600 font-medium">3 en línea</span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">A</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className={`text-sm font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ana García</div>
                                      <div className="text-xs text-green-600">En línea</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">C</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className={`text-sm font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Carlos López</div>
                                      <div className="text-xs text-green-600">En línea</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">M</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className={`text-sm font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>María Rodríguez</div>
                                      <div className="text-xs text-gray-500">Ausente</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Gráfico de Rendimiento */}
                            <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                              <h4 className={`font-semibold mb-4 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Rendimiento del Mes</h4>
                              <div className="h-48 relative">
                                {/* Gráfico de barras interactivo */}
                                <div className="flex items-end justify-between h-full px-4 space-x-2">
                                  {/* Barra 1 - Enero */}
                                  <div className="flex flex-col items-center group cursor-pointer">
                                    <div 
                                      className={`w-10 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 group-hover:from-blue-600 group-hover:to-blue-500 group-hover:scale-110 group-hover:shadow-lg animate-pulse ${demoTheme === 'dark' ? 'shadow-blue-500/30' : 'shadow-blue-200'}`}
                                      style={{ 
                                        height: '60%',
                                        animation: 'slideUp 0.8s ease-out 0.1s both'
                                      }}
                                      title="Enero: 60% - 1,200 proyectos"
                                    ></div>
                                    <span className={`text-xs mt-2 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Ene</span>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>1.2K</span>
                                  </div>
                                  
                                  {/* Barra 2 - Febrero */}
                                  <div className="flex flex-col items-center group cursor-pointer">
                                    <div 
                                      className={`w-10 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500 group-hover:from-green-600 group-hover:to-green-500 group-hover:scale-110 group-hover:shadow-lg animate-pulse ${demoTheme === 'dark' ? 'shadow-green-500/30' : 'shadow-green-200'}`}
                                      style={{ 
                                        height: '80%',
                                        animation: 'slideUp 0.8s ease-out 0.2s both'
                                      }}
                                      title="Febrero: 80% - 1,600 proyectos"
                                    ></div>
                                    <span className={`text-xs mt-2 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Feb</span>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>1.6K</span>
                                  </div>
                                  
                                  {/* Barra 3 - Marzo */}
                                  <div className="flex flex-col items-center group cursor-pointer">
                                    <div 
                                      className={`w-10 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all duration-500 group-hover:from-orange-600 group-hover:to-orange-500 group-hover:scale-110 group-hover:shadow-lg animate-pulse ${demoTheme === 'dark' ? 'shadow-orange-500/30' : 'shadow-orange-200'}`}
                                      style={{ 
                                        height: '45%',
                                        animation: 'slideUp 0.8s ease-out 0.3s both'
                                      }}
                                      title="Marzo: 45% - 900 proyectos"
                                    ></div>
                                    <span className={`text-xs mt-2 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Mar</span>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>900</span>
                                  </div>
                                  
                                  {/* Barra 4 - Abril */}
                                  <div className="flex flex-col items-center group cursor-pointer">
                                    <div 
                                      className={`w-10 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500 group-hover:from-purple-600 group-hover:to-purple-500 group-hover:scale-110 group-hover:shadow-lg animate-pulse ${demoTheme === 'dark' ? 'shadow-purple-500/30' : 'shadow-purple-200'}`}
                                      style={{ 
                                        height: '90%',
                                        animation: 'slideUp 0.8s ease-out 0.4s both'
                                      }}
                                      title="Abril: 90% - 1,800 proyectos"
                                    ></div>
                                    <span className={`text-xs mt-2 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Abr</span>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>1.8K</span>
                                  </div>
                                  
                                  {/* Barra 5 - Mayo */}
                                  <div className="flex flex-col items-center group cursor-pointer">
                                    <div 
                                      className={`w-10 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg transition-all duration-500 group-hover:from-cyan-600 group-hover:to-cyan-500 group-hover:scale-110 group-hover:shadow-lg animate-pulse ${demoTheme === 'dark' ? 'shadow-cyan-500/30' : 'shadow-cyan-200'}`}
                                      style={{ 
                                        height: '75%',
                                        animation: 'slideUp 0.8s ease-out 0.5s both'
                                      }}
                                      title="Mayo: 75% - 1,500 proyectos"
                                    ></div>
                                    <span className={`text-xs mt-2 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>May</span>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>1.5K</span>
                                  </div>
                                  
                                  {/* Barra 6 - Junio */}
                                  <div className="flex flex-col items-center group cursor-pointer">
                                    <div 
                                      className={`w-10 bg-gradient-to-t from-pink-500 to-pink-400 rounded-t-lg transition-all duration-500 group-hover:from-pink-600 group-hover:to-pink-500 group-hover:scale-110 group-hover:shadow-lg animate-pulse ${demoTheme === 'dark' ? 'shadow-pink-500/30' : 'shadow-pink-200'}`}
                                      style={{ 
                                        height: '95%',
                                        animation: 'slideUp 0.8s ease-out 0.6s both'
                                      }}
                                      title="Junio: 95% - 1,900 proyectos"
                                    ></div>
                                    <span className={`text-xs mt-2 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Jun</span>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-pink-400' : 'text-pink-600'}`}>1.9K</span>
                                  </div>
                                </div>
                                
                                {/* Línea de referencia */}
                                <div className={`absolute top-0 left-0 right-0 h-px ${demoTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
                                
                                {/* Tooltip de información */}
                                <div className={`absolute top-2 right-2 text-xs transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span>Datos en tiempo real</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Leyenda del gráfico */}
                              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-blue-500 rounded animate-pulse"></div>
                                  <span className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Proyectos Completados</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-green-500 rounded animate-pulse"></div>
                                  <span className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Proyectos Activos</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-orange-500 rounded animate-pulse"></div>
                                  <span className={`transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>En Revisión</span>
                                </div>
                              </div>
                            </div>

                            {/* Tareas Pendientes */}
                            <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                              <h4 className={`font-semibold mb-4 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Tareas Pendientes</h4>
                              <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Revisar diseño de la landing page</div>
                                    <div className={`text-xs transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Vence en 2 días</div>
                                  </div>
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Urgente</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Implementar autenticación</div>
                                    <div className={`text-xs transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Vence en 5 días</div>
                                  </div>
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Media</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Optimizar rendimiento</div>
                                    <div className={`text-xs transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Vence en 1 semana</div>
                                  </div>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Baja</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeDemo === 'projects' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <h4 className={`font-medium mb-2 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Proyectos Recientes</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>E-commerce App</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">En Progreso</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Landing Page</span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Completado</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Dashboard Admin</span>
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pendiente</span>
                                  </div>
                                </div>
                              </div>
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <h4 className={`font-medium mb-2 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Estadísticas</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Proyectos:</span>
                                    <span className={`font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>12</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Completados:</span>
                                    <span className="font-medium text-green-600">8</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>En Progreso:</span>
                                    <span className="font-medium text-blue-600">3</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Pendientes:</span>
                                    <span className="font-medium text-yellow-600">1</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeDemo === 'analytics' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className={`rounded-lg p-4 shadow-sm text-center transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                                <div className="text-3xl font-bold text-green-600 mb-1">+24%</div>
                                <div className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Crecimiento</div>
                              </div>
                              <div className={`rounded-lg p-4 shadow-sm text-center transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                                <div className="text-3xl font-bold text-blue-600 mb-1">2.4K</div>
                                <div className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Vistas</div>
                              </div>
                              <div className={`rounded-lg p-4 shadow-sm text-center transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                                <div className="text-3xl font-bold text-purple-600 mb-1">8.2%</div>
                                <div className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Conversión</div>
                              </div>
                            </div>
                            <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                              <h4 className={`font-medium mb-3 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Gráfico de Rendimiento</h4>
                              <div className={`h-32 rounded-lg flex items-end justify-center transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-blue-50 to-green-50'}`}>
                                <div className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>📊 Gráfico interactivo aquí</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeDemo === 'team' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <h4 className={`font-medium mb-3 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Miembros del Equipo</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">A</span>
                                    </div>
                                    <div>
                                      <div className={`text-sm font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ana García</div>
                                      <div className={`text-xs transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Desarrolladora</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">C</span>
                                    </div>
                                    <div>
                                      <div className={`text-sm font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Carlos López</div>
                                      <div className={`text-xs transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Diseñador</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">M</span>
                                    </div>
                                    <div>
                                      <div className={`text-sm font-medium transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>María Rodríguez</div>
                                      <div className={`text-xs transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Project Manager</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <h4 className={`font-medium mb-3 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Actividad Reciente</h4>
                                <div className="space-y-2">
                                  <div className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>✅ Ana completó el diseño</div>
                                  <div className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>💬 Carlos comentó en el proyecto</div>
                                  <div className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>🔄 María actualizó el estado</div>
                                  <div className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>📝 Nueva tarea asignada</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeDemo === 'settings' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <h4 className={`font-medium mb-3 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Configuración General</h4>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Notificaciones</span>
                                    <div className="w-12 h-6 bg-green-500 rounded-full relative">
                                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Tema Oscuro</span>
                                    <button 
                                      className={`w-12 h-6 rounded-full relative transition-colors ${demoTheme === 'dark' ? 'bg-cyan-500' : 'bg-gray-300'}`}
                                      onClick={() => toggleDemoTheme()}
                                    >
                                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${demoTheme === 'dark' ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Auto-guardado</span>
                                    <div className="w-12 h-6 bg-green-500 rounded-full relative">
                                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <h4 className={`font-medium mb-3 transition-colors duration-300 ${demoTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Integraciones</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Google Drive</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Conectado</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Slack</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Conectado</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${demoTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>GitHub</span>
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pendiente</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Call to Action */}
                    <div className="text-center rounded-lg p-8 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 dark:border dark:border-slate-600 dark:shadow-lg dark:shadow-slate-900/50">
                      <h3 className="text-2xl font-bold mb-2 text-foreground">
                        ¿Te gustó? ¡Créate una cuenta gratuita!
                      </h3>
                      <p className="mb-6 text-muted-foreground">
                        Únete a {stats.totalTeams}+ equipos que ya optimizaron su workflow. Sin tarjeta de crédito, sin compromisos.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button 
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3"
                          onClick={() => navigate('/register')}
                        >
                          <div className="flex items-center space-x-2">
                            <Zap className="h-5 w-5" />
                            <span>Empezar gratis ahora</span>
                          </div>
                        </Button>
                        <Button 
                          variant="outline"
                          className="px-8 py-3"
                          onClick={() => navigate('/pricing')}
                        >
                          Ver planes y precios
                        </Button>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">
                        ✅ Setup en 5 minutos • ✅ 14 días gratis • ✅ Sin tarjeta de crédito
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Empieza gratis, escala cuando{' '}
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">necesites</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Sin tarjeta de crédito. Cancela cuando quieras. Únete a {stats.totalTeams}+ equipos que ya optimizaron su workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Plan Gratuito */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">Gratuito</h3>
                <div className="text-4xl font-bold text-foreground mb-2">$0</div>
                <p className="text-muted-foreground">Para equipos pequeños</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">Hasta 5 proyectos</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">3 miembros del equipo</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">Dashboard básico</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">Soporte por email</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                onClick={() => navigate('/register')}
              >
                Empezar gratis
              </Button>
            </div>

            {/* Plan Pro - Destacado */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl p-8 border-2 border-cyan-500 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Más Popular
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">Pro</h3>
                <div className="text-4xl font-bold text-foreground mb-2">$29</div>
                <p className="text-muted-foreground">Por usuario/mes</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">Proyectos ilimitados</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">Hasta 25 miembros</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">Analytics avanzado</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">Integraciones 50+</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">Soporte prioritario</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                onClick={() => navigate('/register')}
              >
                Probar 14 días gratis
              </Button>
            </div>

            {/* Plan Enterprise */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-foreground mb-2">$99</div>
                <p className="text-muted-foreground">Para equipos grandes</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">Todo de Pro</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">Miembros ilimitados</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">IA avanzada</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">Soporte 24/7</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-foreground">SLA garantizado</span>
                </li>
              </ul>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigate('/contact')}
              >
                Contactar ventas
              </Button>
            </div>
          </div>

          {/* Garantía */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center px-6 py-3 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <Shield className="h-4 w-4 mr-2" />
              Garantía de 30 días o te devolvemos tu dinero
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-24 bg-gradient-to-br from-muted/30 to-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Lo que dicen nuestros{' '}
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">clientes</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Más de {stats.totalTeams.toLocaleString()} equipos confían en nosotros para gestionar sus proyectos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonio 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-foreground">Ana García</h4>
                  <p className="text-sm text-muted-foreground">CEO, TechStart</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "Ahorramos {stats.timeSaved} horas por semana desde que implementamos TuWebAI. La productividad de nuestro equipo aumentó un {stats.productivityIncrease}%."
              </p>
              <div className="flex items-center">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">5.0/5</span>
              </div>
            </div>

            {/* Testimonio 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-foreground">Carlos López</h4>
                  <p className="text-sm text-muted-foreground">CTO, InnovateLab</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "Las predicciones de entrega con IA son increíbles. Redujimos los retrasos en proyectos un {stats.projectDelayReduction}%."
              </p>
              <div className="flex items-center">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">5.0/5</span>
              </div>
            </div>

            {/* Testimonio 3 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-foreground">María Rodríguez</h4>
                  <p className="text-sm text-muted-foreground">Project Manager, ScaleUp</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "La integración con 50+ herramientas nos ahorró meses de configuración. ROI del {stats.averageROI}% en el primer trimestre."
              </p>
              <div className="flex items-center">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">5.0/5</span>
              </div>
            </div>
          </div>

          {/* Métricas de satisfacción */}
          <div className="mt-16 text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold text-cyan-600">{stats.satisfactionRating}/5</div>
                <div className="text-sm text-muted-foreground">Satisfacción promedio</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600">{stats.satisfiedClients}%</div>
                <div className="text-sm text-muted-foreground">Clientes satisfechos</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600">{stats.activeTeams.toLocaleString()}+</div>
                <div className="text-sm text-muted-foreground">Equipos activos</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600">{stats.supportAvailability}</div>
                <div className="text-sm text-muted-foreground">Soporte disponible</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-xl p-2">
                  <img src="/logoweb.jpg" alt="TuWebAI" className="h-8 w-8 object-contain rounded-lg" loading="lazy" />
                </div>
                <span className="text-xl font-bold">TuWebAI - Dashboard Profesional</span>
              </div>
              <p className="text-gray-400 max-w-md">
                La plataforma de gestión de proyectos más avanzada para equipos modernos. Más de {stats.totalTeams.toLocaleString()} equipos confían en nosotros.
              </p>
              
              {/* Newsletter */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Tips semanales de productividad</h4>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-6">
                    Suscribirse
                  </Button>
            </div>
                <p className="text-xs text-gray-500">Sin spam. Cancela cuando quieras.</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/proyectos" className="hover:text-white transition-colors">Proyectos</Link></li>
                <li><Link to="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
                <li><Link to="/team" className="hover:text-white transition-colors">Equipo</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Precios</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/soporte" className="hover:text-white transition-colors">Centro de ayuda</Link></li>
                <li><Link to="/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
                <li><Link to="/documentacion" className="hover:text-white transition-colors">Documentación</Link></li>
                <li><Link to="/api" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/sobre-nosotros" className="hover:text-white transition-colors">Sobre nosotros</Link></li>
                <li><Link to="/carreras" className="hover:text-white transition-colors">Carreras</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/politica-privacidad" className="hover:text-white transition-colors">Privacidad</Link></li>
                <li><Link to="/terminos-condiciones" className="hover:text-white transition-colors">Términos</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Chat en vivo y redes sociales */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Chat en vivo disponible</span>
                </div>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Github className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Chrome className="h-5 w-5" />
                  </a>
                </div>
              </div>
              <div className="text-gray-400 text-sm">
                &copy; 2024 TuWebAI. Todos los derechos reservados.
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de vista previa de imagen */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={closeImagePreview}
        >
          <div 
            className="relative max-w-6xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImagePreview}
              className="absolute -top-4 -right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
            <div className="bg-card rounded-2xl p-4 shadow-2xl">
              <img
                src={previewImage}
                alt="Vista previa del dashboard"
                className="max-w-full max-h-[80vh] rounded-xl"
                loading="eager"
                decoding="async"
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-white text-sm">
                Haz click fuera de la imagen o presiona ESC para cerrar
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});

LandingPage.displayName = 'LandingPage';

export default LandingPage;
