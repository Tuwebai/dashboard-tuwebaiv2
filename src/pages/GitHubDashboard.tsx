import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Github, 
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Star,
  GitFork,
  Calendar,
  TrendingUp,
  Code,
  Users,
  Eye,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGitHubAuth } from '@/hooks/useGitHubAuth';
import { useGitHubData } from '@/hooks/useGitHubData';

const GitHubDashboard: React.FC = () => {
  // Hooks personalizados primero
  const { isConnected, isLoading: authLoading, error: authError, connect, disconnect } = useGitHubAuth();
  const { 
    user, 
    repos, 
    featuredRepos, 
    stats, 
    languages, 
    contributionGraph,
    isLoading: dataLoading, 
    error: dataError, 
    refreshData 
  } = useGitHubData();
  
  // Hooks de estado locales después
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    stats: true,
    languages: true,
    repos: true,
    contributions: false
  });
  const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Hook de navegación
  const navigate = useNavigate();

  // Detectar tamaño de pantalla y modo de vista
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setViewMode('mobile');
      } else if (width < 1024) {
        setViewMode('tablet');
      } else {
        setViewMode('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Gestos táctiles para navegación
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && viewMode === 'mobile') {
      // Swipe izquierda - cerrar menú móvil
      setIsMobileMenuOpen(false);
    }
    if (isRightSwipe && viewMode === 'mobile') {
      // Swipe derecha - abrir menú móvil
      setIsMobileMenuOpen(true);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getGridCols = () => {
    switch (viewMode) {
      case 'mobile':
        return 'grid-cols-1';
      case 'tablet':
        return 'grid-cols-1 md:grid-cols-2';
      case 'desktop':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default:
        return 'grid-cols-1';
    }
  };

  const getStatsGridCols = () => {
    switch (viewMode) {
      case 'mobile':
        return 'grid-cols-2';
      case 'tablet':
        return 'grid-cols-2 md:grid-cols-4';
      case 'desktop':
        return 'grid-cols-2 md:grid-cols-4';
      default:
        return 'grid-cols-2';
    }
  };

  const getTopLanguages = () => {
    if (!languages || typeof languages !== 'object') {
      return [];
    }
    return Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => navigate('/perfil')}
              className="mb-6 transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
              Volver al perfil
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Dashboard de GitHub
            </h1>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              Tu actividad y estadísticas de desarrollo
            </p>
          </div>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <div className="p-2 bg-slate-100 rounded-xl transition-all duration-300 hover:bg-slate-200">
                  <Github className="w-6 h-6 text-slate-700" />
                </div>
                <span className="font-bold text-slate-800">GitHub</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                    <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-pulse"></div>
                  </div>
                  <p className="text-lg font-medium text-slate-700">Cargando datos de GitHub...</p>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header responsivo con indicador de vista */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/perfil')}
                className="transition-all duration-200 hover:scale-105 hover:shadow-md group"
                size={viewMode === 'mobile' ? 'sm' : 'md'}
              >
                <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
                <span className={viewMode === 'mobile' ? 'hidden' : 'block'}>Volver al perfil</span>
              </Button>
              
              <div className="space-y-1">
                <h1 className={`font-bold text-slate-800 tracking-tight ${
                  viewMode === 'mobile' ? 'text-lg' : 'text-2xl'
                }`}>
                  Dashboard de GitHub
                </h1>
                <p className={`text-slate-600 font-medium ${
                  viewMode === 'mobile' ? 'text-xs' : 'text-sm'
                }`}>
                  Tu actividad y estadísticas de desarrollo
                </p>
              </div>
            </div>

            {/* Indicador de modo de vista */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
                <div className={`p-1 rounded transition-all duration-200 ${
                  viewMode === 'mobile' ? 'bg-blue-500 text-white' : 'text-slate-600'
                }`}>
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className={`p-1 rounded transition-all duration-200 ${
                  viewMode === 'tablet' ? 'bg-blue-500 text-white' : 'text-slate-600'
                }`}>
                  <Tablet className="w-4 h-4" />
                </div>
                <div className={`p-1 rounded transition-all duration-200 ${
                  viewMode === 'desktop' ? 'bg-blue-500 text-white' : 'text-slate-600'
                }`}>
                  <Monitor className="w-4 h-4" />
                </div>
              </div>

              {/* Menú móvil */}
              {viewMode === 'mobile' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="transition-all duration-200 hover:scale-105"
                >
                  {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">

        {/* Menú móvil desplegable */}
        {isMobileMenuOpen && viewMode === 'mobile' && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Navegación</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(expandedSections).map(([section, isExpanded]) => (
                    <div key={section} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {section === 'profile' && 'Perfil'}
                        {section === 'stats' && 'Estadísticas'}
                        {section === 'languages' && 'Lenguajes'}
                        {section === 'repos' && 'Repositorios'}
                        {section === 'contributions' && 'Contribuciones'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection(section as keyof typeof expandedSections)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl transition-all duration-300 hover:shadow-2xl">
          <CardHeader className="pb-6">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <CardTitle className="flex items-center space-x-3 text-lg">
                <div className="p-2 bg-slate-100 rounded-xl transition-all duration-300 hover:bg-slate-200 hover:scale-110">
                  <Github className="w-5 h-5 text-slate-700" />
                </div>
                <span className="font-bold text-slate-800">GitHub</span>
              </CardTitle>
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-full">
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className={`text-sm font-semibold transition-colors duration-200 ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                {isConnected && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-full">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-blue-700">
                        {isRefreshing ? 'Actualizando...' : 'Datos en vivo'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="transition-all duration-200 hover:scale-105 hover:shadow-md"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 transition-transform duration-300 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                      <span className={viewMode === 'mobile' ? 'hidden' : 'block'}>Actualizar</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={disconnect}
                      className="transition-all duration-200 hover:scale-105 hover:shadow-md"
                    >
                      <span className={viewMode === 'mobile' ? 'hidden' : 'block'}>Desconectar</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        <CardContent className="p-8">
          {!isConnected ? (
            <div className="text-center space-y-6 py-12">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  <Github className="w-10 h-10 text-slate-600" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-slate-300 animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800">
                  No conectado a GitHub
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Conecta tu cuenta de GitHub para ver tus repositorios, estadísticas de contribuciones y actividad de desarrollo.
                </p>
                {authError && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl transition-all duration-300 hover:shadow-md">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-sm font-medium text-red-700">{authError}</p>
                    </div>
                  </div>
                )}
                <div className="pt-4">
                  <Button 
                    onClick={connect} 
                    className="px-6 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    disabled={authLoading}
                  >
                    {authLoading ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Conectando...</span>
                      </div>
                    ) : (
                      'Conectar con GitHub'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : !user ? (
            <div className="text-center space-y-6 py-12">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800">
                  Error al cargar datos
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  {dataError || authError || 'Error desconocido'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <Button 
                    onClick={handleRefresh} 
                    variant="outline"
                    disabled={dataLoading}
                    className="px-4 py-2 transition-all duration-300 hover:scale-105 hover:shadow-md"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 transition-transform duration-300 ${dataLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                    {dataLoading ? 'Cargando...' : 'Reintentar'}
                  </Button>
                  <Button 
                    onClick={disconnect} 
                    variant="destructive"
                    className="px-4 py-2 transition-all duration-300 hover:scale-105 hover:shadow-md"
                  >
                    Desconectar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grid principal responsivo */}
              <div className={`grid gap-6 ${getGridCols()}`}>
                
                {/* Perfil del usuario - Sección expandible */}
                <div className={`${viewMode === 'mobile' ? 'col-span-1' : 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4'}`}>
                  <div className="group relative overflow-hidden bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200/50">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span>Perfil de Usuario</span>
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('profile')}
                        className="transition-all duration-200 hover:scale-105"
                      >
                        {expandedSections.profile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                    
                    {expandedSections.profile && (
                      <div className="p-6">
                        <div className={`flex ${viewMode === 'mobile' ? 'flex-col space-y-4' : 'items-start space-x-6'}`}>
                          <div className="relative flex-shrink-0">
                            <img
                              src={user.avatar_url}
                              alt={user.name || user.login}
                              className={`rounded-full border-4 border-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl ${
                                viewMode === 'mobile' ? 'w-16 h-16 mx-auto' : 'w-20 h-20'
                              }`}
                            />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                          </div>
                          <div className="flex-1 min-w-0 text-center lg:text-left">
                            <h3 className="text-lg font-bold text-slate-800 truncate transition-colors duration-200 group-hover:text-blue-700">
                              {user.name || user.login}
                            </h3>
                            <p className="text-sm text-slate-600 font-medium truncate">
                              @{user.login}
                            </p>
                            {user.bio && (
                              <p className="text-slate-600 text-sm mt-2 line-clamp-2 leading-relaxed">
                                {user.bio}
                              </p>
                            )}
                            <div className={`flex items-center justify-center lg:justify-start space-x-6 mt-4 ${
                              viewMode === 'mobile' ? 'flex-wrap gap-4' : ''
                            }`}>
                              <div className="flex items-center space-x-2 text-slate-600">
                                <Users className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                <span className="font-semibold">{user.followers || 0}</span>
                                <span className="text-sm">seguidores</span>
                              </div>
                              <div className="flex items-center space-x-2 text-slate-600">
                                <Users className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                <span className="font-semibold">{user.following || 0}</span>
                                <span className="text-sm">siguiendo</span>
                              </div>
                              <div className="flex items-center space-x-2 text-slate-600">
                                <Code className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                <span className="font-semibold">{user.public_repos || 0}</span>
                                <span className="text-sm">repositorios</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estadísticas de contribuciones - Sección expandible */}
                {stats && (
                  <div className={`${viewMode === 'mobile' ? 'col-span-1' : 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4'}`}>
                    <div className="group relative overflow-hidden bg-gradient-to-r from-slate-50 to-green-50/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                      <div className="flex items-center justify-between p-4 border-b border-slate-200/50">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <span>Estadísticas de Contribuciones</span>
                          </h3>
                          <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Datos reales</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSection('stats')}
                          className="transition-all duration-200 hover:scale-105"
                        >
                          {expandedSections.stats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      {expandedSections.stats && (
                        <div className="p-6">
                          <div className={`grid gap-4 ${getStatsGridCols()}`}>
                            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative">
                                <div className={`font-bold text-blue-700 mb-2 transition-all duration-300 group-hover:scale-110 ${
                                  viewMode === 'mobile' ? 'text-xl' : 'text-2xl'
                                }`}>
                                  {stats.totalCommits || 0}
                                </div>
                                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                  Commits totales
                                </div>
                              </div>
                            </div>
                            <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1">
                              <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative">
                                <div className={`font-bold text-green-700 mb-2 transition-all duration-300 group-hover:scale-110 ${
                                  viewMode === 'mobile' ? 'text-xl' : 'text-2xl'
                                }`}>
                                  {stats.commitsThisYear || 0}
                                </div>
                                <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                                  Este año
                                </div>
                              </div>
                            </div>
                            <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1">
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative">
                                <div className={`font-bold text-purple-700 mb-2 transition-all duration-300 group-hover:scale-110 ${
                                  viewMode === 'mobile' ? 'text-xl' : 'text-2xl'
                                }`}>
                                  {stats.commitsThisMonth || 0}
                                </div>
                                <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                                  Este mes
                                </div>
                              </div>
                            </div>
                            <div className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1">
                              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative">
                                <div className={`font-bold text-orange-700 mb-2 transition-all duration-300 group-hover:scale-110 ${
                                  viewMode === 'mobile' ? 'text-xl' : 'text-2xl'
                                }`}>
                                  {stats.streak || 0}
                                </div>
                                <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                                  Racha actual
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lenguajes más usados - Sección expandible */}
                {languages && Object.keys(languages).length > 0 && (
                  <div className={`${viewMode === 'mobile' ? 'col-span-1' : 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4'}`}>
                    <div className="group relative overflow-hidden bg-gradient-to-r from-slate-50 to-purple-50/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                      <div className="flex items-center justify-between p-4 border-b border-slate-200/50">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                          <Code className="w-5 h-5 text-purple-600" />
                          <span>Lenguajes más usados</span>
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSection('languages')}
                          className="transition-all duration-200 hover:scale-105"
                        >
                          {expandedSections.languages ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      {expandedSections.languages && (
                        <div className="p-6">
                          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
                            <div className="space-y-4">
                              {getTopLanguages().map(([language, count], index) => (
                                <div 
                                  key={language} 
                                  className="group flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:bg-slate-50/80 hover:scale-[1.02]"
                                  style={{ animationDelay: `${index * 100}ms` }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 group-hover:scale-125"></div>
                                    <span className="text-sm font-semibold text-slate-800">{language}</span>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <div className={`bg-slate-200 rounded-full h-3 overflow-hidden ${
                                      viewMode === 'mobile' ? 'w-20' : 'w-32'
                                    }`}>
                                      <div 
                                        className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out group-hover:shadow-lg" 
                                        style={{ 
                                          width: `${(count / Math.max(...Object.values(languages))) * 100}%`,
                                          animationDelay: `${index * 200}ms`
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 w-12 text-right">
                                      {count}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Repositorios destacados - Sección expandible */}
                {featuredRepos && featuredRepos.length > 0 && (
                  <div className={`${viewMode === 'mobile' ? 'col-span-1' : 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4'}`}>
                    <div className="group relative overflow-hidden bg-gradient-to-r from-slate-50 to-yellow-50/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                      <div className="flex items-center justify-between p-4 border-b border-slate-200/50">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            <span>Repositorios destacados</span>
                          </h3>
                          <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Datos reales</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSection('repos')}
                          className="transition-all duration-200 hover:scale-105"
                        >
                          {expandedSections.repos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      {expandedSections.repos && (
                        <div className="p-6">
                          <div className={`grid gap-4 ${viewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                            {featuredRepos.slice(0, viewMode === 'mobile' ? 4 : 6).map((repo, index) => (
                              <div 
                                key={repo.id} 
                                className="group relative overflow-hidden bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
                                style={{ animationDelay: `${index * 100}ms` }}
                                onClick={() => window.open(repo.html_url, '_blank', 'noopener,noreferrer')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    window.open(repo.html_url, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                                tabIndex={0}
                                role="button"
                                aria-label={`Abrir repositorio ${repo.name} en GitHub`}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative">
                                  <div className="flex items-start justify-between mb-3">
                                    <h4 className="text-base font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors duration-200">
                                      {repo.name}
                                    </h4>
                                    <div className="flex items-center space-x-1 text-yellow-500">
                                      <Star className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                      <span className="text-sm font-semibold">{repo.stargazers_count || 0}</span>
                                    </div>
                                  </div>
                                  <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                                    {repo.description || 'Sin descripción'}
                                  </p>
                                  <div className={`flex items-center justify-between ${
                                    viewMode === 'mobile' ? 'flex-col space-y-2' : ''
                                  }`}>
                                    <div className={`flex items-center space-x-4 ${
                                      viewMode === 'mobile' ? 'justify-center' : ''
                                    }`}>
                                      <div className="flex items-center space-x-1 text-slate-600">
                                        <Code className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                        <span className="text-sm font-medium">{repo.language || 'Sin lenguaje'}</span>
                                      </div>
                                      <div className="flex items-center space-x-1 text-slate-600">
                                        <GitFork className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                        <span className="text-sm font-medium">{repo.forks_count || 0}</span>
                                      </div>
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">
                                      {formatDate(repo.updated_at)}
                                    </div>
                                  </div>
                                  {/* Indicador de que es clickeable */}
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Gráfico de contribuciones - Sección expandible */}
                {contributionGraph && (
                  <div className={`${viewMode === 'mobile' ? 'col-span-1' : 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4'}`}>
                    <div className="group relative overflow-hidden bg-gradient-to-r from-slate-50 to-green-50/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                      <div className="flex items-center justify-between p-4 border-b border-slate-200/50">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-green-600" />
                          <span>Gráfico de contribuciones</span>
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSection('contributions')}
                          className="transition-all duration-200 hover:scale-105"
                        >
                          {expandedSections.contributions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      {expandedSections.contributions && (
                        <div className="p-6">
                          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50">
                            <div className="text-center space-y-4">
                              <div className={`bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto ${
                                viewMode === 'mobile' ? 'w-12 h-12' : 'w-16 h-16'
                              }`}>
                                <Calendar className={`text-green-600 ${viewMode === 'mobile' ? 'w-6 h-6' : 'w-8 h-8'}`} />
                              </div>
                              <h4 className="text-base font-bold text-slate-800">Gráfico de contribuciones</h4>
                              <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                                Visualización de tu actividad de commits en GitHub (implementación pendiente)
                              </p>
                              <div className="flex justify-center space-x-2 mt-6">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export { GitHubDashboard };
