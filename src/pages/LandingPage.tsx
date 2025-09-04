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
    <div className="min-h-screen bg-white overflow-x-hidden">
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
              <Button variant="ghost" asChild>
                <Link to="/login" className="text-gray-600 hover:text-gray-900">
                  Login
                </Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-cyan-500 to-emerald-600 hover:from-cyan-600 hover:to-emerald-700">
                <Link to="/register">
                  Registro
                </Link>
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

      {/* Secciones alternadas */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900">
                Gestión de proyectos simplificada
              </h2>
              <p className="text-xl text-gray-600">
                Organiza, supervisa y completa tus proyectos web con herramientas intuitivas diseñadas para equipos modernos.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-gray-700">Vista general en tiempo real</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-gray-700">Colaboración en equipo</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-gray-700">Automatización inteligente</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="transform -rotate-2 hover:rotate-0 transition-transform duration-700 ease-out">
                <img 
                  src="/dashboardadmin.png" 
                  alt="Dashboard Admin" 
                  className="w-full h-auto max-w-lg mx-auto rounded-2xl shadow-2xl object-contain"
                />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="transform rotate-2 hover:rotate-0 transition-transform duration-700 ease-out">
                <img 
                  src="/macbookcliente.jpg" 
                  alt="Dashboard Cliente en MacBook" 
                  className="w-full h-auto max-w-lg mx-auto rounded-2xl shadow-2xl object-contain"
                />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-3xl blur-xl -z-10"></div>
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-gray-900">
                Análisis y métricas claras
              </h2>
              <p className="text-xl text-gray-600">
                Obtén insights profundos sobre el rendimiento de tus proyectos con reportes detallados y visualizaciones interactivas.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-gray-700">Reportes en tiempo real</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-gray-700">Gráficos interactivos</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-gray-700">Exportación de datos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900">
                Seguridad y confiabilidad empresarial
              </h2>
              <p className="text-xl text-gray-600">
                Protege tus datos con las mejores prácticas de seguridad y disfruta de una plataforma estable y confiable.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-gray-700">Encriptación de extremo a extremo</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-gray-700">Backup automático</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-gray-700">Soporte 24/7</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="transform -rotate-1 hover:rotate-0 transition-transform duration-700 ease-out">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 shadow-2xl">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-8 w-8 text-green-500" />
                      <span className="text-white text-xl font-semibold">Seguridad</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Encriptación</span>
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-green-500 rounded-full"></div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Backup</span>
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-green-500 rounded-full"></div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Monitoreo</span>
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-green-500 rounded-full"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-3xl blur-xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Mini demo interactiva */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Prueba la experiencia
            </h2>
            <p className="text-xl text-gray-600">
              Interactúa con nuestro dashboard y descubre todas las funcionalidades
            </p>
          </div>

          <div className="relative">
            {/* Controles de la demo */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-4 bg-white rounded-full p-2 shadow-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="rounded-full"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <span className="text-sm text-gray-600">
                  {isPlaying ? 'Demo en vivo' : 'Iniciar demo'}
                </span>
              </div>
            </div>

            {/* Grid de cards interactivas */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {demoCards.map((card) => {
                const Icon = card.icon;
                const isActive = activeDemo === card.id;
                
                return (
                  <Card 
                    key={card.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                      isActive 
                        ? 'ring-2 ring-cyan-500 shadow-xl scale-105' 
                        : 'hover:scale-105'
                    }`}
                    onClick={() => setActiveDemo(isActive ? null : card.id)}
                  >
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center mb-4`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {card.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {card.description}
                      </p>
                      {isActive && (
                        <div className="space-y-2">
                          {Object.entries(card.stats).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-gray-500 capitalize">{key}:</span>
                              <span className="font-medium text-gray-900">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Indicador de estado */}
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                {demoCards.map((card) => (
                  <div
                    key={card.id}
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      activeDemo === card.id ? 'bg-cyan-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
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
