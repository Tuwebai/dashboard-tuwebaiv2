import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Eye, 
  EyeOff, 
  Github, 
  Chrome, 
  Zap, 
  ArrowRight, 
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
  ChevronRight,
  Play,
  Pause,
  RefreshCw,
  X
} from 'lucide-react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { login, loginWithGoogle, loginWithGithub } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Agregar estilos CSS para las animaciones
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
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
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Manejar tecla ESC para cerrar modal
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && previewImage) {
        closeImagePreview();
      }
    };

    if (previewImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [previewImage]);

  // Auto-play demo
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setActiveDemo(prev => {
          const demos = ['projects', 'analytics', 'team', 'settings'];
          const currentIndex = demos.indexOf(prev || '');
          const nextIndex = (currentIndex + 1) % demos.length;
          return demos[nextIndex];
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    if (success) {
      if (email.toLowerCase() === 'tuwebai@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast({
        title: "Error",
        description: "Credenciales inválidas o usuario no registrado.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const success = await loginWithGoogle();
    if (success) {
      // OAuth redirige automáticamente
    } else {
      toast({ title: 'Error', description: 'No se pudo iniciar sesión con Google.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);
    const success = await loginWithGithub();
    if (success) {
      // OAuth redirige automáticamente
    } else {
      toast({ title: 'Error', description: 'No se pudo iniciar sesión con GitHub.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleDemoAction = (action: string) => {
    setActiveDemo(action);
  };

  const handleImagePreview = (imageSrc: string) => {
    setPreviewImage(imageSrc);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  const demoCards = [
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
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" style={{ 
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'auto',
      scrollBehavior: 'auto'
    }}>
      {/* Header fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-xl p-2">
                <img src="/logoweb.jpg" alt="TuWebAI" className="h-8 w-8 object-contain rounded-lg" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Dashboard - TuWebAI
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle variant="ghost" />
              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => handleDemoAction('login')}
              >
                Login
              </Button>
              <Button 
                className="bg-gradient-to-r from-cyan-500 to-emerald-600 hover:from-cyan-600 hover:to-emerald-700"
                onClick={handleRegister}
              >
                Registro
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-20 bg-gradient-to-br from-muted/50 to-background min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
            {/* Contenido del hero */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Gestioná proyectos como las{' '}
                  <span className="bg-gradient-to-r from-cyan-500 to-emerald-600 bg-clip-text text-transparent">
                    empresas de millones
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Un dashboard intuitivo, rápido y con soporte integral para llevar tu negocio al siguiente nivel.
                </p>
              </div>

              {/* Formulario de login integrado */}
              <Card className="p-6 shadow-xl border-0 bg-card/80 backdrop-blur-sm">
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold text-card-foreground text-center">Accede a tu cuenta</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-card-foreground">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 h-12 bg-input text-foreground border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-sm font-medium text-card-foreground">Contraseña</Label>
                      <div className="relative mt-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 pr-12 bg-input text-foreground border-border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-cyan-500 to-emerald-600 hover:from-cyan-600 hover:to-emerald-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Iniciando sesión...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4" />
                          <span>Iniciar Sesión</span>
                        </div>
                      )}
                    </Button>
                  </form>

                  <div className="flex flex-col space-y-3">
                    <Button 
                      variant="outline" 
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="h-12"
                    >
                      <Chrome className="h-4 w-4 mr-2" />
                      Continuar con Google
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleGithubLogin}
                      disabled={isLoading}
                      className="h-12"
                    >
                      <Github className="h-4 w-4 mr-2" />
                      Continuar con GitHub
                    </Button>
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" className="text-primary hover:text-primary/80 font-medium">
                      Regístrate aquí
                    </Link>
                  </p>
                </div>
              </Card>
            </div>

            {/* Mockup 3D del dashboard */}
            <div className="relative w-full">
              <div className="relative transform rotate-3 hover:rotate-0 transition-transform duration-700 ease-out max-w-md mx-auto">
                <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl p-6 shadow-2xl">
                  <div className="bg-card rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-lg"></div>
                        <span className="font-semibold text-card-foreground">Dashboard</span>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-500/10 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-card-foreground">Usuarios</span>
                        </div>
                        <div className="text-2xl font-bold text-card-foreground">6</div>
                        <div className="text-xs text-muted-foreground">+0 este mes</div>
                      </div>
                      <div className="bg-green-500/10 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-card-foreground">Proyectos</span>
                        </div>
                        <div className="text-2xl font-bold text-card-foreground">5</div>
                        <div className="text-xs text-muted-foreground">+0 este mes</div>
                      </div>
                      <div className="bg-orange-500/10 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-card-foreground">Tickets</span>
                        </div>
                        <div className="text-2xl font-bold text-card-foreground">1</div>
                        <div className="text-xs text-muted-foreground">0 urgentes</div>
                      </div>
                      <div className="bg-purple-500/10 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-card-foreground">Ingresos</span>
                        </div>
                        <div className="text-2xl font-bold text-card-foreground">$0</div>
                        <div className="text-xs text-muted-foreground">$0 este mes</div>
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
            <div className="space-y-8 order-2 lg:order-2">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                  <Target className="h-4 w-4 mr-2" />
                  Gestión de Proyectos
                </div>
                <h2 className="text-5xl font-bold text-foreground leading-tight">
                  Gestión de proyectos 
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> simplificada</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Organiza, supervisa y completa tus proyectos web con herramientas intuitivas diseñadas para equipos modernos. Todo en un solo lugar.
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Vista general en tiempo real</h3>
                      <p className="text-sm text-muted-foreground">Monitorea el progreso al instante</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Colaboración en equipo</h3>
                      <p className="text-sm text-muted-foreground">Trabajo conjunto eficiente</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Automatización inteligente</h3>
                      <p className="text-sm text-muted-foreground">Flujos de trabajo optimizados</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Settings className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Personalización total</h3>
                      <p className="text-sm text-muted-foreground">Adapta la herramienta a tu flujo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-muted/30 to-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 order-1 lg:order-1">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics Avanzado
                </div>
                <h2 className="text-5xl font-bold text-foreground leading-tight">
                  Análisis y métricas 
                  <span className="bg-gradient-to-r from-green-600 to-cyan-600 bg-clip-text text-transparent"> claras</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Obtén insights profundos sobre el rendimiento de tus proyectos con reportes detallados y visualizaciones interactivas que te ayudan a tomar decisiones informadas.
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Reportes en tiempo real</h3>
                      <p className="text-sm text-muted-foreground">Datos actualizados al instante</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Gráficos interactivos</h3>
                      <p className="text-sm text-muted-foreground">Visualizaciones dinámicas</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Exportación de datos</h3>
                      <p className="text-sm text-muted-foreground">Descarga en múltiples formatos</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Datos seguros</h3>
                      <p className="text-sm text-muted-foreground">Encriptación de extremo a extremo</p>
                    </div>
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

      <section className="py-24 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  <Shield className="h-4 w-4 mr-2" />
                  Seguridad Empresarial
                </div>
                <h2 className="text-5xl font-bold text-white leading-tight">
                  Seguridad y confiabilidad 
                  <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent"> empresarial</span>
                </h2>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Protege tus datos con las mejores prácticas de seguridad y disfruta de una plataforma estable y confiable diseñada para empresas.
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Encriptación de extremo a extremo</h3>
                      <p className="text-sm text-gray-300">Protección máxima de datos</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Backup automático</h3>
                      <p className="text-sm text-gray-300">Respaldo continuo de información</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Soporte 24/7</h3>
                      <p className="text-sm text-gray-300">Asistencia siempre disponible</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Star className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Certificaciones ISO</h3>
                      <p className="text-sm text-gray-300">Estándares internacionales</p>
                    </div>
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
      <section className={`py-24 transition-colors duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-gray-50 to-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-5xl font-bold mb-4 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Prueba el dashboard 
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent"> en vivo</span>
            </h2>
            <p className={`text-xl max-w-3xl mx-auto transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>
              Explora nuestro dashboard con datos simulados y descubre todas las funcionalidades disponibles.
            </p>
          </div>

          {/* Dashboard Interactivo */}
          <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${theme === 'dark' ? 'bg-slate-900 border-2 border-slate-700 shadow-2xl shadow-slate-900/50' : 'bg-white border border-gray-200 shadow-2xl'}`}>
            {/* Header del Dashboard */}
            <div className={`px-6 py-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600' : 'bg-gradient-to-r from-gray-900 to-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <div>
                    <h3 className={`font-semibold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-white'}`}>TuWebAI Dashboard</h3>
                    <p className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-300'}`}>Demo Interactivo</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                </div>
              </div>
            </div>

            {/* Contenido del Dashboard */}
            <div className={`p-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
              {/* Sidebar y Main Content */}
              <div className="grid lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <div className="space-y-4">
                    <div className={`rounded-lg p-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-800 border border-slate-700 shadow-lg' : 'bg-gray-50'}`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-sm">E</span>
                        </div>
                        <div>
                          <p className={`font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Usuario Demo</p>
                          <p className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>demo@tuwebai.com</p>
                        </div>
                      </div>
                    </div>
                    
                    <nav className="space-y-2">
                      <button 
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${activeDemo === 'dashboard' ? (theme === 'dark' ? 'bg-blue-900/50 text-blue-300 border border-blue-700 shadow-md' : 'bg-blue-50 text-blue-700') : (theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent hover:border-slate-600' : 'text-gray-600 hover:bg-gray-50')}`}
                        onClick={() => handleDemoAction('dashboard')}
                      >
                        <Target className="h-4 w-4" />
                        <span className="text-sm font-medium">Dashboard</span>
                      </button>
                      <button 
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${activeDemo === 'projects' ? (theme === 'dark' ? 'bg-blue-900/50 text-blue-300 border border-blue-700 shadow-md' : 'bg-blue-50 text-blue-700') : (theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent hover:border-slate-600' : 'text-gray-600 hover:bg-gray-50')}`}
                        onClick={() => handleDemoAction('projects')}
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-sm">Proyectos</span>
                      </button>
                      <button 
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${activeDemo === 'team' ? (theme === 'dark' ? 'bg-blue-900/50 text-blue-300 border border-blue-700 shadow-md' : 'bg-blue-50 text-blue-700') : (theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent hover:border-slate-600' : 'text-gray-600 hover:bg-gray-50')}`}
                        onClick={() => handleDemoAction('team')}
                      >
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Equipo</span>
                      </button>
                      <button 
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${activeDemo === 'settings' ? (theme === 'dark' ? 'bg-blue-900/50 text-blue-300 border border-blue-700 shadow-md' : 'bg-blue-50 text-blue-700') : (theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent hover:border-slate-600' : 'text-gray-600 hover:bg-gray-50')}`}
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
                      <h1 className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Mi Dashboard</h1>
                      <p className={`transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Gestiona y revisa el progreso de tus proyectos web</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className={`rounded-lg p-4 hover:shadow-lg transition-all duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-700/50 shadow-lg shadow-blue-900/20' : 'bg-gradient-to-br from-blue-50 to-blue-100'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <Target className={`h-6 w-6 transition-colors duration-300 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                        </div>
                        <div className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>12</div>
                        <div className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Proyectos Activos</div>
                        <div className={`text-xs mt-1 transition-colors duration-300 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>+3 este mes</div>
                      </div>

                      <div className={`rounded-lg p-4 hover:shadow-lg transition-all duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-700/50 shadow-lg shadow-green-900/20' : 'bg-gradient-to-br from-green-50 to-green-100'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <TrendingUp className={`h-6 w-6 transition-colors duration-300 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-green-900'}`}>8</div>
                        <div className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>En Progreso</div>
                        <div className={`text-xs mt-1 transition-colors duration-300 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>+2 esta semana</div>
                      </div>

                      <div className={`rounded-lg p-4 hover:shadow-lg transition-all duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-orange-900/30 to-orange-800/30 border border-orange-700/50 shadow-lg shadow-orange-900/20' : 'bg-gradient-to-br from-orange-50 to-orange-100'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <Users className={`h-6 w-6 transition-colors duration-300 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-orange-900'}`}>24</div>
                        <div className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`}>Comentarios</div>
                        <div className={`text-xs mt-1 transition-colors duration-300 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>+5 hoy</div>
                      </div>

                      <div className={`rounded-lg p-4 hover:shadow-lg transition-all duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-700/50 shadow-lg shadow-purple-900/20' : 'bg-gradient-to-br from-purple-50 to-purple-100'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <Activity className={`h-6 w-6 transition-colors duration-300 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-purple-900'}`}>85%</div>
                        <div className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>Progreso General</div>
                        <div className={`text-xs mt-1 transition-colors duration-300 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>+12% este mes</div>
                      </div>
                    </div>

                    {/* Interactive Demo Panel */}
                    {activeDemo && (
                      <div className={`rounded-lg p-6 border transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-800 border-slate-600 shadow-lg shadow-slate-900/50' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`text-lg font-semibold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {demoCards.find(card => card.id === activeDemo)?.title} - Demo Interactivo
                          </h3>
                          <button 
                            onClick={() => setActiveDemo(null)}
                            className={`transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            ✕
                          </button>
                        </div>
                        
                        {activeDemo === 'dashboard' && (
                          <div className="space-y-6">
                            {/* Widgets del Dashboard */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Widget de Actividad Reciente */}
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className={`font-semibold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Actividad Reciente</h4>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className={`transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Nuevo proyecto "E-commerce" creado</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className={`transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Tarea completada por Ana García</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span className={`transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Comentario en "Landing Page"</span>
                                  </div>
                                </div>
                              </div>

                              {/* Widget de Progreso de Proyectos */}
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className={`font-semibold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Progreso de Proyectos</h4>
                                  <span className="text-xs text-green-600 font-medium">+15%</span>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className={`transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>E-commerce App</span>
                                      <span className={`transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>75%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '75%'}}></div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className={`transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Landing Page</span>
                                      <span className={`transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>90%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-green-500 h-2 rounded-full" style={{width: '90%'}}></div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className={`transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Dashboard Admin</span>
                                      <span className={`transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>45%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '45%'}}></div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Widget de Equipo */}
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className={`font-semibold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Equipo Activo</h4>
                                  <span className="text-xs text-green-600 font-medium">3 en línea</span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">A</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className={`text-sm font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ana García</div>
                                      <div className="text-xs text-green-600">En línea</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">C</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className={`text-sm font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Carlos López</div>
                                      <div className="text-xs text-green-600">En línea</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">M</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className={`text-sm font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>María Rodríguez</div>
                                      <div className="text-xs text-gray-500">Ausente</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Gráfico de Rendimiento */}
                            <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                              <h4 className={`font-semibold mb-4 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Rendimiento del Mes</h4>
                              <div className="h-48 relative">
                                {/* Gráfico de barras interactivo */}
                                <div className="flex items-end justify-between h-full px-4 space-x-2">
                                  {/* Barra 1 - Enero */}
                                  <div className="flex flex-col items-center group cursor-pointer">
                                    <div 
                                      className={`w-10 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 group-hover:from-blue-600 group-hover:to-blue-500 group-hover:scale-110 group-hover:shadow-lg animate-pulse ${theme === 'dark' ? 'shadow-blue-500/30' : 'shadow-blue-200'}`}
                                      style={{ 
                                        height: '60%',
                                        animation: 'slideUp 0.8s ease-out 0.1s both'
                                      }}
                                      title="Enero: 60% - 1,200 proyectos"
                                    ></div>
                                    <span className={`text-xs mt-2 transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Ene</span>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>1.2K</span>
                                  </div>
                                  
                                  {/* Barra 2 - Febrero */}
                                  <div className="flex flex-col items-center group cursor-pointer">
                                    <div 
                                      className={`w-10 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500 group-hover:from-green-600 group-hover:to-green-500 group-hover:scale-110 group-hover:shadow-lg animate-pulse ${theme === 'dark' ? 'shadow-green-500/30' : 'shadow-green-200'}`}
                                      style={{ 
                                        height: '80%',
                                        animation: 'slideUp 0.8s ease-out 0.2s both'
                                      }}
                                      title="Febrero: 80% - 1,600 proyectos"
                                    ></div>
                                    <span className={`text-xs mt-2 transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Feb</span>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>1.6K</span>
                                  </div>
                                  
                                  {/* Barra 3 - Marzo */}
                                  <div className="flex flex-col items-center group cursor-pointer">
                                    <div 
                                      className={`w-10 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all duration-500 group-hover:from-orange-600 group-hover:to-orange-500 group-hover:scale-110 group-hover:shadow-lg animate-pulse ${theme === 'dark' ? 'shadow-orange-500/30' : 'shadow-orange-200'}`}
                                      style={{ 
                                        height: '45%',
                                        animation: 'slideUp 0.8s ease-out 0.3s both'
                                      }}
                                      title="Marzo: 45% - 900 proyectos"
                                    ></div>
                                    <span className={`text-xs mt-2 transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Mar</span>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>900</span>
                                  </div>
                                  
                                  {/* Barra 4 - Abril */}
                                  <div className="flex flex-col items-center group cursor-pointer">
                                    <div 
                                      className={`w-10 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500 group-hover:from-purple-600 group-hover:to-purple-500 group-hover:scale-110 group-hover:shadow-lg animate-pulse ${theme === 'dark' ? 'shadow-purple-500/30' : 'shadow-purple-200'}`}
                                      style={{ 
                                        height: '90%',
                                        animation: 'slideUp 0.8s ease-out 0.4s both'
                                      }}
                                      title="Abril: 90% - 1,800 proyectos"
                                    ></div>
                                    <span className={`text-xs mt-2 transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Abr</span>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>1.8K</span>
                                  </div>
                                  
                                  {/* Barra 5 - Mayo */}
                                  <div className="flex flex-col items-center group cursor-pointer">
                                    <div 
                                      className={`w-10 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg transition-all duration-500 group-hover:from-cyan-600 group-hover:to-cyan-500 group-hover:scale-110 group-hover:shadow-lg animate-pulse ${theme === 'dark' ? 'shadow-cyan-500/30' : 'shadow-cyan-200'}`}
                                      style={{ 
                                        height: '75%',
                                        animation: 'slideUp 0.8s ease-out 0.5s both'
                                      }}
                                      title="Mayo: 75% - 1,500 proyectos"
                                    ></div>
                                    <span className={`text-xs mt-2 transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>May</span>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>1.5K</span>
                                  </div>
                                  
                                  {/* Barra 6 - Junio */}
                                  <div className="flex flex-col items-center group cursor-pointer">
                                    <div 
                                      className={`w-10 bg-gradient-to-t from-pink-500 to-pink-400 rounded-t-lg transition-all duration-500 group-hover:from-pink-600 group-hover:to-pink-500 group-hover:scale-110 group-hover:shadow-lg animate-pulse ${theme === 'dark' ? 'shadow-pink-500/30' : 'shadow-pink-200'}`}
                                      style={{ 
                                        height: '95%',
                                        animation: 'slideUp 0.8s ease-out 0.6s both'
                                      }}
                                      title="Junio: 95% - 1,900 proyectos"
                                    ></div>
                                    <span className={`text-xs mt-2 transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Jun</span>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-pink-400' : 'text-pink-600'}`}>1.9K</span>
                                  </div>
                                </div>
                                
                                {/* Línea de referencia */}
                                <div className={`absolute top-0 left-0 right-0 h-px ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
                                
                                {/* Tooltip de información */}
                                <div className={`absolute top-2 right-2 text-xs transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
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
                                  <span className={`transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Proyectos Completados</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-green-500 rounded animate-pulse"></div>
                                  <span className={`transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Proyectos Activos</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-orange-500 rounded animate-pulse"></div>
                                  <span className={`transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>En Revisión</span>
                                </div>
                              </div>
                            </div>

                            {/* Tareas Pendientes */}
                            <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                              <h4 className={`font-semibold mb-4 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Tareas Pendientes</h4>
                              <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Revisar diseño de la landing page</div>
                                    <div className={`text-xs transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Vence en 2 días</div>
                                  </div>
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Urgente</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Implementar autenticación</div>
                                    <div className={`text-xs transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Vence en 5 días</div>
                                  </div>
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Media</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Optimizar rendimiento</div>
                                    <div className={`text-xs transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Vence en 1 semana</div>
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
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <h4 className={`font-medium mb-2 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Proyectos Recientes</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>E-commerce App</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">En Progreso</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Landing Page</span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Completado</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Dashboard Admin</span>
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pendiente</span>
                                  </div>
                                </div>
                              </div>
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <h4 className={`font-medium mb-2 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Estadísticas</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Proyectos:</span>
                                    <span className={`font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>12</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Completados:</span>
                                    <span className="font-medium text-green-600">8</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>En Progreso:</span>
                                    <span className="font-medium text-blue-600">3</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Pendientes:</span>
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
                              <div className={`rounded-lg p-4 shadow-sm text-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                                <div className="text-3xl font-bold text-green-600 mb-1">+24%</div>
                                <div className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Crecimiento</div>
                              </div>
                              <div className={`rounded-lg p-4 shadow-sm text-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                                <div className="text-3xl font-bold text-blue-600 mb-1">2.4K</div>
                                <div className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Vistas</div>
                              </div>
                              <div className={`rounded-lg p-4 shadow-sm text-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                                <div className="text-3xl font-bold text-purple-600 mb-1">8.2%</div>
                                <div className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Conversión</div>
                              </div>
                            </div>
                            <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                              <h4 className={`font-medium mb-3 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Gráfico de Rendimiento</h4>
                              <div className={`h-32 rounded-lg flex items-end justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-blue-50 to-green-50'}`}>
                                <div className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>📊 Gráfico interactivo aquí</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeDemo === 'team' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <h4 className={`font-medium mb-3 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Miembros del Equipo</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">A</span>
                                    </div>
                                    <div>
                                      <div className={`text-sm font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ana García</div>
                                      <div className={`text-xs transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Desarrolladora</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">C</span>
                                    </div>
                                    <div>
                                      <div className={`text-sm font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Carlos López</div>
                                      <div className={`text-xs transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Diseñador</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">M</span>
                                    </div>
                                    <div>
                                      <div className={`text-sm font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>María Rodríguez</div>
                                      <div className={`text-xs transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Project Manager</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <h4 className={`font-medium mb-3 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Actividad Reciente</h4>
                                <div className="space-y-2">
                                  <div className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>✅ Ana completó el diseño</div>
                                  <div className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>💬 Carlos comentó en el proyecto</div>
                                  <div className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>🔄 María actualizó el estado</div>
                                  <div className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>📝 Nueva tarea asignada</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeDemo === 'settings' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <h4 className={`font-medium mb-3 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Configuración General</h4>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Notificaciones</span>
                                    <div className="w-12 h-6 bg-green-500 rounded-full relative">
                                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Tema Oscuro</span>
                                    <button 
                                      className={`w-12 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-cyan-500' : 'bg-gray-300'}`}
                                      onClick={() => toggleTheme()}
                                    >
                                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${theme === 'dark' ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Auto-guardado</span>
                                    <div className="w-12 h-6 bg-green-500 rounded-full relative">
                                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-700 border border-slate-600' : 'bg-white'}`}>
                                <h4 className={`font-medium mb-3 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Integraciones</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Google Drive</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Conectado</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Slack</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Conectado</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>GitHub</span>
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
                    <div className={`text-center rounded-lg p-8 transition-colors duration-300 ${theme === 'dark' ? 'bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 shadow-lg shadow-slate-900/50' : 'bg-gradient-to-r from-cyan-50 to-blue-50'}`}>
                      <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        ¿Listo para comenzar?
                      </h3>
                      <p className={`mb-6 transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Crea tu cuenta gratuita y accede a todas estas funcionalidades y más.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button 
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3"
                          onClick={() => navigate('/register')}
                        >
                          Crear Cuenta Gratuita
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-xl p-2">
                  <img src="/logoweb.jpg" alt="TuWebAI" className="h-8 w-8 object-contain rounded-lg" />
                </div>
                <span className="text-xl font-bold">Dashboard TuWebAI</span>
              </div>
              <p className="text-gray-400">
                La plataforma de gestión de proyectos más avanzada para equipos modernos.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/proyectos" className="hover:text-white transition-colors">Proyectos</Link></li>
                <li><Link to="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
                <li><Link to="/team" className="hover:text-white transition-colors">Equipo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/soporte" className="hover:text-white transition-colors">Centro de ayuda</Link></li>
                <li><Link to="/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
                <li><Link to="/documentacion" className="hover:text-white transition-colors">Documentación</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/politica-privacidad" className="hover:text-white transition-colors">Política de privacidad</Link></li>
                <li><Link to="/terminos-condiciones" className="hover:text-white transition-colors">Términos y condiciones</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition-colors">Política de cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TuWebAI. Todos los derechos reservados.</p>
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
}
