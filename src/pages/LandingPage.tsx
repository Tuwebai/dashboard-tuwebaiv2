import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
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
  RefreshCw
} from 'lucide-react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { login, loginWithGoogle, loginWithGithub } = useApp();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-white overflow-x-hidden scroll-smooth" style={{ 
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'none',
      scrollBehavior: 'smooth'
    }}>
      {/* Header fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-xl p-2">
                <img src="/logoweb.jpg" alt="TuWebAI" className="h-8 w-8 object-contain rounded-lg" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                TuWebAI
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-gray-900"
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
      <section className="pt-20 pb-20 bg-gradient-to-br from-gray-50 to-white min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
            {/* Contenido del hero */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Gestioná proyectos como las{' '}
                  <span className="bg-gradient-to-r from-cyan-500 to-emerald-600 bg-clip-text text-transparent">
                    empresas de millones
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Un dashboard intuitivo, rápido y con soporte integral para llevar tu negocio al siguiente nivel.
                </p>
              </div>

              {/* Formulario de login integrado */}
              <Card className="p-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold text-gray-900 text-center">Accede a tu cuenta</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</Label>
                      <div className="relative mt-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 pr-12"
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

                  <p className="text-center text-sm text-gray-600">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" className="text-cyan-600 hover:text-cyan-700 font-medium">
                      Regístrate aquí
                    </Link>
                  </p>
                </div>
              </Card>
            </div>

            {/* Mockup 3D del dashboard */}
            <div className="relative w-full">
              <div className="relative transform rotate-3 hover:rotate-0 transition-transform duration-700 ease-out max-w-md mx-auto">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-2xl">
                  <div className="bg-white rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-lg"></div>
                        <span className="font-semibold text-gray-900">Dashboard</span>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Usuarios</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">6</div>
                        <div className="text-xs text-blue-600">+0 este mes</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900">Proyectos</span>
                        </div>
                        <div className="text-2xl font-bold text-green-900">5</div>
                        <div className="text-xs text-green-600">+0 este mes</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-900">Tickets</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-900">1</div>
                        <div className="text-xs text-orange-600">0 urgentes</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-900">Ingresos</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-900">$0</div>
                        <div className="text-xs text-purple-600">$0 este mes</div>
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
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* IMAGEN - IZQUIERDA */}
            <div className="relative order-1 lg:order-1">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                <div className="relative transform -rotate-1 hover:rotate-0 transition-all duration-700 ease-out">
                  <div className="bg-white rounded-2xl p-2 shadow-2xl">
                    <img 
                      src="/dashboardadmin.png" 
                      alt="Dashboard Admin mostrando gestión de proyectos" 
                      className="w-full h-auto rounded-xl shadow-lg"
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
                <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                  Gestión de proyectos 
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> simplificada</span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
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
                      <h3 className="font-semibold text-gray-900">Vista general en tiempo real</h3>
                      <p className="text-sm text-gray-600">Monitorea el progreso al instante</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Colaboración en equipo</h3>
                      <p className="text-sm text-gray-600">Trabajo conjunto eficiente</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Automatización inteligente</h3>
                      <p className="text-sm text-gray-600">Flujos de trabajo optimizados</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Settings className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Personalización total</h3>
                      <p className="text-sm text-gray-600">Adapta la herramienta a tu flujo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 order-1 lg:order-1">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics Avanzado
                </div>
                <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                  Análisis y métricas 
                  <span className="bg-gradient-to-r from-green-600 to-cyan-600 bg-clip-text text-transparent"> claras</span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
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
                      <h3 className="font-semibold text-gray-900">Reportes en tiempo real</h3>
                      <p className="text-sm text-gray-600">Datos actualizados al instante</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Gráficos interactivos</h3>
                      <p className="text-sm text-gray-600">Visualizaciones dinámicas</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Exportación de datos</h3>
                      <p className="text-sm text-gray-600">Descarga en múltiples formatos</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Datos seguros</h3>
                      <p className="text-sm text-gray-600">Encriptación de extremo a extremo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative order-2 lg:order-2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                <div className="relative transform rotate-1 hover:rotate-0 transition-all duration-700 ease-out">
                  <div className="bg-white rounded-2xl p-2 shadow-2xl">
                    <img 
                      src="/dashboardcliente.png" 
                      alt="Dashboard Cliente mostrando análisis y métricas" 
                      className="w-full h-auto rounded-xl shadow-lg"
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

      <section className="py-24 bg-gradient-to-br from-gray-900 to-slate-900 text-white">
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
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Prueba el dashboard 
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent"> en vivo</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explora nuestro dashboard con datos simulados y descubre todas las funcionalidades disponibles.
            </p>
          </div>

          {/* Dashboard Interactivo */}
          <div className={`rounded-2xl shadow-2xl border overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            {/* Header del Dashboard */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">TuWebAI Dashboard</h3>
                    <p className="text-gray-300 text-sm">Demo Interactivo</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Contenido del Dashboard */}
            <div className={`p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
              {/* Sidebar y Main Content */}
              <div className="grid lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <div className="space-y-4">
                    <div className={`rounded-lg p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">E</span>
                        </div>
                        <div>
                          <p className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Usuario Demo</p>
                          <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>demo@tuwebai.com</p>
                        </div>
                      </div>
                    </div>
                    
                    <nav className="space-y-2">
                      <button 
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${activeDemo === 'dashboard' ? (isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700') : (isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50')}`}
                        onClick={() => handleDemoAction('dashboard')}
                      >
                        <Target className="h-4 w-4" />
                        <span className="text-sm font-medium">Dashboard</span>
                      </button>
                      <button 
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${activeDemo === 'projects' ? (isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700') : (isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50')}`}
                        onClick={() => handleDemoAction('projects')}
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-sm">Proyectos</span>
                      </button>
                      <button 
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${activeDemo === 'team' ? (isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700') : (isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50')}`}
                        onClick={() => handleDemoAction('team')}
                      >
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Equipo</span>
                      </button>
                      <button 
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${activeDemo === 'settings' ? (isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700') : (isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50')}`}
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
                      <h1 className="text-2xl font-bold text-gray-900">Mi Dashboard</h1>
                      <p className="text-gray-600">Gestiona y revisa el progreso de tus proyectos web</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setActiveDemo('projects')}>
                        <div className="flex items-center justify-between mb-2">
                          <Target className="h-6 w-6 text-blue-600" />
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">12</div>
                        <div className="text-sm text-blue-700">Proyectos Activos</div>
                        <div className="text-xs text-blue-600 mt-1">+3 este mes</div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setActiveDemo('analytics')}>
                        <div className="flex items-center justify-between mb-2">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-2xl font-bold text-green-900">8</div>
                        <div className="text-sm text-green-700">En Progreso</div>
                        <div className="text-xs text-green-600 mt-1">+2 esta semana</div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setActiveDemo('team')}>
                        <div className="flex items-center justify-between mb-2">
                          <Users className="h-6 w-6 text-orange-600" />
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-2xl font-bold text-orange-900">24</div>
                        <div className="text-sm text-orange-700">Comentarios</div>
                        <div className="text-xs text-orange-600 mt-1">+5 hoy</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setActiveDemo('settings')}>
                        <div className="flex items-center justify-between mb-2">
                          <Activity className="h-6 w-6 text-purple-600" />
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-2xl font-bold text-purple-900">85%</div>
                        <div className="text-sm text-purple-700">Progreso General</div>
                        <div className="text-xs text-purple-600 mt-1">+12% este mes</div>
                      </div>
                    </div>

                    {/* Interactive Demo Panel */}
                    {activeDemo && (
                      <div className={`rounded-lg p-6 border transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`text-lg font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {demoCards.find(card => card.id === activeDemo)?.title} - Demo Interactivo
                          </h3>
                          <button 
                            onClick={() => setActiveDemo(null)}
                            className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            ✕
                          </button>
                        </div>
                        
                        {activeDemo === 'dashboard' && (
                          <div className="space-y-6">
                            {/* Widgets del Dashboard */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Widget de Actividad Reciente */}
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className={`font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Actividad Reciente</h4>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Nuevo proyecto "E-commerce" creado</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tarea completada por Ana García</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Comentario en "Landing Page"</span>
                                  </div>
                                </div>
                              </div>

                              {/* Widget de Progreso de Proyectos */}
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className={`font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Progreso de Proyectos</h4>
                                  <span className="text-xs text-green-600 font-medium">+15%</span>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>E-commerce App</span>
                                      <span className={`transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>75%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '75%'}}></div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Landing Page</span>
                                      <span className={`transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>90%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-green-500 h-2 rounded-full" style={{width: '90%'}}></div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Dashboard Admin</span>
                                      <span className={`transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>45%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '45%'}}></div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Widget de Equipo */}
                              <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className={`font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Equipo Activo</h4>
                                  <span className="text-xs text-green-600 font-medium">3 en línea</span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">A</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Ana García</div>
                                      <div className="text-xs text-green-600">En línea</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">C</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Carlos López</div>
                                      <div className="text-xs text-green-600">En línea</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">M</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>María Rodríguez</div>
                                      <div className="text-xs text-gray-500">Ausente</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Gráfico de Rendimiento */}
                            <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                              <h4 className={`font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Rendimiento del Mes</h4>
                              <div className="h-48 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-green-500/10"></div>
                                <div className="text-center z-10">
                                  <div className="text-4xl mb-2">📊</div>
                                  <div className={`text-lg font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Gráfico Interactivo</div>
                                  <div className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Visualización de datos en tiempo real</div>
                                </div>
                                {/* Barras de ejemplo */}
                                <div className="absolute bottom-4 left-4 right-4 flex items-end space-x-2 h-20">
                                  <div className="bg-blue-500 w-8 rounded-t" style={{height: '60%'}}></div>
                                  <div className="bg-green-500 w-8 rounded-t" style={{height: '80%'}}></div>
                                  <div className="bg-orange-500 w-8 rounded-t" style={{height: '45%'}}></div>
                                  <div className="bg-purple-500 w-8 rounded-t" style={{height: '70%'}}></div>
                                  <div className="bg-cyan-500 w-8 rounded-t" style={{height: '90%'}}></div>
                                </div>
                              </div>
                            </div>

                            {/* Tareas Pendientes */}
                            <div className={`rounded-lg p-4 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                              <h4 className={`font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tareas Pendientes</h4>
                              <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Revisar diseño de la landing page</div>
                                    <div className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vence en 2 días</div>
                                  </div>
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Urgente</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Implementar autenticación</div>
                                    <div className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vence en 5 días</div>
                                  </div>
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Media</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Optimizar rendimiento</div>
                                    <div className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vence en 1 semana</div>
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
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-medium text-gray-900 mb-2">Proyectos Recientes</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">E-commerce App</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">En Progreso</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Landing Page</span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Completado</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Dashboard Admin</span>
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pendiente</span>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-medium text-gray-900 mb-2">Estadísticas</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Proyectos:</span>
                                    <span className="font-medium">12</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Completados:</span>
                                    <span className="font-medium text-green-600">8</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">En Progreso:</span>
                                    <span className="font-medium text-blue-600">3</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Pendientes:</span>
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
                              <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                                <div className="text-3xl font-bold text-green-600 mb-1">+24%</div>
                                <div className="text-sm text-gray-600">Crecimiento</div>
                              </div>
                              <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                                <div className="text-3xl font-bold text-blue-600 mb-1">2.4K</div>
                                <div className="text-sm text-gray-600">Vistas</div>
                              </div>
                              <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-1">8.2%</div>
                                <div className="text-sm text-gray-600">Conversión</div>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <h4 className="font-medium text-gray-900 mb-3">Gráfico de Rendimiento</h4>
                              <div className="h-32 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg flex items-end justify-center">
                                <div className="text-gray-500 text-sm">📊 Gráfico interactivo aquí</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeDemo === 'team' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-medium text-gray-900 mb-3">Miembros del Equipo</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">A</span>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium">Ana García</div>
                                      <div className="text-xs text-gray-500">Desarrolladora</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">C</span>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium">Carlos López</div>
                                      <div className="text-xs text-gray-500">Diseñador</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">M</span>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium">María Rodríguez</div>
                                      <div className="text-xs text-gray-500">Project Manager</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-medium text-gray-900 mb-3">Actividad Reciente</h4>
                                <div className="space-y-2">
                                  <div className="text-sm text-gray-600">✅ Ana completó el diseño</div>
                                  <div className="text-sm text-gray-600">💬 Carlos comentó en el proyecto</div>
                                  <div className="text-sm text-gray-600">🔄 María actualizó el estado</div>
                                  <div className="text-sm text-gray-600">📝 Nueva tarea asignada</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeDemo === 'settings' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-medium text-gray-900 mb-3">Configuración General</h4>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Notificaciones</span>
                                    <div className="w-12 h-6 bg-green-500 rounded-full relative">
                                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Tema Oscuro</span>
                                    <button 
                                      className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-cyan-500' : 'bg-gray-300'}`}
                                      onClick={() => setIsDarkMode(!isDarkMode)}
                                    >
                                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isDarkMode ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Auto-guardado</span>
                                    <div className="w-12 h-6 bg-green-500 rounded-full relative">
                                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-medium text-gray-900 mb-3">Integraciones</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Google Drive</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Conectado</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Slack</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Conectado</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">GitHub</span>
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
                    <div className="text-center bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        ¿Listo para comenzar?
                      </h3>
                      <p className="text-gray-600 mb-6">
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
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-xl p-2">
                  <img src="/logoweb.jpg" alt="TuWebAI" className="h-8 w-8 object-contain rounded-lg" />
                </div>
                <span className="text-xl font-bold">TuWebAI</span>
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


    </div>
  );
}
